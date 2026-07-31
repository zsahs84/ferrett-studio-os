(function(){
  const $ = (id)=>document.getElementById(id);
  const AI_KEY='ferrett_os_ai_v1';
  const DEFAULT_HA_URL='https://donita.ddns.net:8123'; // pre-filled; edit in ⚙ setup anytime. Must be https (mixed-content).
  const loadCfg=()=>{ try{ return JSON.parse(localStorage.getItem(AI_KEY)||'{}'); }catch(e){ return {}; } };
  const saveCfg=(c)=>{ try{ localStorage.setItem(AI_KEY, JSON.stringify(c)); }catch(e){ alert('Failed to save AI config: ' + e.message + ' (You may be out of local storage space. Try clearing your browser cache or deleting large files in Ferrett Studio.)'); } };
  const isConfigured=()=>{ const c=loadCfg(); return c.mode==='groq' ? !!c.groqKey : c.mode==='gemini' ? !!c.geminiKey : !!(c.url && c.token); };
  window.__aiIsConfigured = isConfigured; // shared so other script blocks gate exactly like the lyrics tools do

  // A per-DAY quota is a different animal to a per-minute one and has to be told apart from it. The
  // per-minute cap refills while you watch and is worth pausing for; the daily one comes back in
  // hours, so every retry against it is guaranteed to fail and just burns the user's time. Callers
  // read .exhausted to stop outright instead of working through their retry ladder for nothing.
  window.__aiIsDailyLimit = (msg) => /tokens per day|\bTPD\b|requests per day|\bRPD\b/i.test(String(msg||''));

  // ==================== WHAT THE CALL ACTUALLY COST ====================
  // Every backend reports its own token usage and the app was throwing all of it away, so the only
  // answer to "what does a kit cost" was an estimate built from character counts — input guessable,
  // output not, and output is where the money goes because thinking bills at the output rate. These
  // are the provider's own counts, so they replace the guess entirely.
  //
  // Rates are per MILLION tokens and dated, because they change. Only models whose price was actually
  // confirmed appear here: an unknown model reports its tokens with no dollar figure rather than a
  // number that looks authoritative and is wrong — the same rule the plugin tables follow. Add a row
  // when you check a price; don't guess one.
  window.AI_PRICES = { // verified 2026-07-26 against ai.google.dev/gemini-api/docs/pricing
      'gemini-3.6-flash':      { in: 1.50, out: 7.50, cachedIn: 0.15 },
      'gemini-3.5-flash-lite': { in: 0.30, out: 2.50 }
  };
  window.__aiPriceFor = (model) => {
      const m = String(model||'').replace(/^models\//,'').toLowerCase();
      return window.AI_PRICES[m] || null;
  };
  // Thinking tokens bill as output on Gemini and are reported separately, so they are counted into
  // `out` for the cost but kept in their own field — being able to see that the thinking was four
  // times the answer is the whole point of measuring rather than estimating.
  window.__aiUsage = {
      session: { calls: 0, in: 0, out: 0, thoughts: 0, cached: 0, usd: 0, unpriced: 0 },
      _scope: null,
      blank() { return { calls: 0, in: 0, out: 0, thoughts: 0, cached: 0, usd: 0, unpriced: 0 }; },
      begin(context) { this._scope = this.blank(); this._scope.context = context; return this._scope; },
      end() {
          const s = this._scope;
          if (s && s.context && window.db) {
              window.db.accounting = window.db.accounting || [];
              window.db.accounting.unshift({
                  id: Date.now().toString(36) + Math.random().toString(36).substring(2,6),
                  ts: Date.now(),
                  context: s.context,
                  usd: s.usd
              });
              if (window.db.accounting.length > 5000) window.db.accounting.pop();
              window.saveData();
              window.renderAccountingLedger?.();
          }
          this._scope = null;
          return s;
      },
      // Called once per response, INCLUDING responses that turned out to be empty or were retried —
      // a call that returned nothing usable was still billed, and a meter that hides those is exactly
      // the meter that makes a build look cheaper than the invoice.
      record(model, u) {
          if (!u) return;
          const price = window.__aiPriceFor(model);
          const rec = {
              in: u.in || 0, out: (u.out || 0) + (u.thoughts || 0), thoughts: u.thoughts || 0, cached: u.cached || 0
          };
          const billableIn = Math.max(0, rec.in - rec.cached);
          const usd = price ? (billableIn * price.in + rec.cached * (price.cachedIn ?? price.in) + rec.out * price.out) / 1e6 : 0;
          [this.session, this._scope].forEach(t => {
              if (!t) return;
              t.calls++; t.in += rec.in; t.out += rec.out; t.thoughts += rec.thoughts; t.cached += rec.cached;
              if (price) t.usd += usd; else t.unpriced++;
          });

          // Lyrics, punch-ins and Lyria prompts have nowhere of their own to show a cost, and they
          // are the calls most likely to be fired dozens of times without thinking about it. Pushing
          // the running session total into the status line is the only place they become visible.
          window.__updateAiStatus?.();
      },
      fmtUsd(n) { return n >= 1 ? `$${n.toFixed(2)}` : n >= 0.01 ? `${(n*100).toFixed(1)}¢` : `${(n*100).toFixed(2)}¢`; },
      // One line for a badge. Says "tokens only" rather than showing $0.00 when no price is on file,
      // because a confident zero is worse than an honest gap.
      summary(t) {
          if (!t || !t.calls) return '';
          const tok = `${((t.in + t.out)/1000).toFixed(1)}k tokens`;
          const think = t.thoughts ? ` · ${((t.thoughts)/1000).toFixed(1)}k thinking` : '';
          return t.unpriced ? `${tok}${think} · no price on file` : `${this.fmtUsd(t.usd)} · ${tok}${think}`;
      }
  };

  // thinkingConfig is rejected outright by older Gemini models rather than ignored, which would turn
  // an optional quality knob into a hard failure for anyone pointed at one. First 400 that names it
  // switches it off for the session and the call is retried without it — the same
  // learn-once-and-stop-paying-for-it shape the kit uses for JSON mode.
  let geminiThinkOk = true;

  // What the pacer is allowed to spend per minute, per backend. This is NOT a property of the app —
  // it's a property of whichever account is on the other end, and the two differ by orders of
  // magnitude. Groq's free tier is 8000 TPM, so the kit has to be paced call by call; paid Gemini is
  // far above anything a kit needs, and applying Groq's figure there would throttle a 30-second build
  // into a three-minute one for no reason. If a Groq Dev Tier or a bigger Gemini tier is in play these
  // are simply too low — they're floors chosen to never exceed a limit, not measurements of one.
  window.__aiTpmBudget = () => {
    const c = loadCfg();
    if (c.mode === 'gemini') return 250000;
    return 7200; // Groq free tier: 8000 TPM, minus headroom for our own token estimate running light
  };

  // Which model is actually answering, and a way to point at a different one for a single run. The
  // HA hop has its own model default baked into the rest_command, so it reports as the backend rather
  // than pretending to know — better an honest "HA hop" than a confident wrong model id on a kit.
  window.__aiModelLabel = () => {
    const c = loadCfg();
    return c.mode === 'gemini' ? (c.geminiModel || 'gemini-3.6-flash')
         : c.mode === 'groq'   ? (c.groqModel   || 'openai/gpt-oss-120b')
         : 'HA hop (' + (c.haModel || 'openai/gpt-oss-120b') + ')';
  };
  // Raw stored value, undefined included — that's what has to go back after a comparison run, because
  // writing a concrete id where there wasn't one silently pins a model the user never chose.
  window.__aiGetModel = () => {
    const c = loadCfg();
    return c.mode === 'gemini' ? c.geminiModel : c.mode === 'groq' ? c.groqModel : c.haModel;
  };
  window.__aiSetModel = (id) => {
    const c = loadCfg();
    const key = c.mode === 'gemini' ? 'geminiModel' : c.mode === 'groq' ? 'groqModel' : 'haModel';
    if (id == null) delete c[key]; else c[key] = id;
    saveCfg(c); updateStatus();
  };
  window.__aiGetMode = () => loadCfg().mode || 'ha';

  // ---- core client: returns text, throws Error with a friendly message ----
  // opts.json:true requests the API's native JSON mode (Groq/OpenAI-compatible response_format) so a
  // structured-output caller gets back guaranteed-parseable JSON instead of hoping the model doesn't
  // wrap it in a markdown fence or a chatty preamble — that inconsistency, not just network flakiness,
  // is a real source of "some batches come back, some don't" for callers parsing JSON out of prose.
  // Thrown errors carry .status and .retryAfterMs (when the server sends one) so a caller can back off
  // intelligently on a 429 instead of guessing; existing callers that only read .message are unaffected.
  window.ferrettAI = async function(system, user, opts){
    opts=opts||{}; const c=loadCfg();
    // 45s suits the short lyrics calls; a long structured answer (the AI Kit's per-instrument chain
    // sheets) needs longer or it gets aborted mid-stream and reads as a hard failure, so callers can
    // ask for more. maxTokens likewise: leaving it unset lets the model run past whatever default
    // ceiling is in play and come back truncated.
    const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(), opts.timeoutMs || 45000);
    try{
      let res, data, text, haFinish, haApiErr, emptyHint='';
      if(c.mode==='groq'){
        if(!c.groqKey) throw new Error('No Groq key set — open ⚙ setup.');
        const model=c.groqModel||'openai/gpt-oss-120b';
        const body={ model, temperature: opts.creative?0.8:0.3, messages:[{role:'system',content:system},{role:'user',content:user}] };
        // Exactly what the caller asked for, deliberately — do NOT pad this the way the Gemini branch
        // does. Groq charges a request against the tokens-per-minute cap as prompt +
        // max_completion_tokens, reserving the ceiling whether the answer uses it or not, so padding
        // for reasoning headroom is self-defeating: on the free tier's 8000 TPM a request asking for
        // 8000 completion tokens is bigger than the entire minute and is refused outright with
        // "Request too large", however short the real answer would have been. Callers size their own
        // headroom; reasoning_effort is what keeps the amount needed small.
        if(opts.maxTokens) body.max_completion_tokens=opts.maxTokens;
        if(/gpt-oss/i.test(model)) body.reasoning_effort='low'; // keep the thinking short so the budget goes on the answer
        if(opts.json) body.response_format={ type:'json_object' };
        res=await fetch('https://api.groq.com/openai/v1/chat/completions',{ method:'POST', signal:ctrl.signal, headers:{'Content-Type':'application/json','Authorization':'Bearer '+c.groqKey}, body:JSON.stringify(body) });
        if(!res.ok){
          // Groq puts the useful part in the body — which limit, how much is left, how long to wait.
          // A bare "Groq 429 — rate limited" hides whether this is a per-minute blip worth retrying
          // or the daily budget being gone for hours, and those need opposite responses.
          let detail=''; try{ detail=(await res.json())?.error?.message||''; }catch(e){}
          const err=new Error('Groq '+res.status+(res.status===401?' — bad key':res.status===429?' — rate limited':'')+(detail?' — '+detail:''));
          err.status=res.status; const ra=res.headers.get('retry-after'); if(ra) err.retryAfterMs=(parseFloat(ra)||0)*1000;
          if(window.__aiIsDailyLimit(detail)) err.exhausted=true;
          throw err;
        }
        data=await res.json(); text=data?.choices?.[0]?.message?.content;
        // Groq reports OpenAI-shaped usage. No reasoning-token field, so `thoughts` stays 0 and the
        // badge simply won't show a thinking figure rather than implying there wasn't any.
        window.__aiUsage?.record(model, { in: data?.usage?.prompt_tokens, out: data?.usage?.completion_tokens });
      } else if(c.mode==='gemini'){
        if(!c.geminiKey) throw new Error('No Google API key set — open ⚙ setup.');
        const model=(c.geminiModel||'gemini-3.6-flash').replace(/^models\//,'');
        const body={
          contents:[{ role:'user', parts:[{ text:user }] }],
          systemInstruction:{ parts:[{ text:system }] },
          generationConfig:{ temperature: opts.creative?0.8:0.3 }
        };
        // Gemini counts any internal reasoning against maxOutputTokens, so a ceiling sized for the
        // answer alone can be spent before the answer starts and come back empty with
        // finishReason MAX_TOKENS. Give it real headroom rather than the caller's exact figure.
        if(opts.maxTokens) body.generationConfig.maxOutputTokens=Math.max(opts.maxTokens*2, 8000);
        if(opts.json) body.generationConfig.responseMimeType='application/json';
        // How hard the model is allowed to think, and therefore most of what separates a chain that
        // understands the gear from one that pattern-matches a plausible-looking answer. It matters
        // that this is set explicitly rather than left alone: the per-model DEFAULTS differ (3.6 Flash
        // defaults to medium, the Flash-Lites to minimal), so comparing two models without pinning it
        // compares thinking budgets as much as it compares models.
        const think = opts.think || c.geminiThink;
        if(think && geminiThinkOk) body.generationConfig.thinkingConfig={ thinkingLevel: think };
        // A response body can only be read once, so send/read is one helper and the retry below reuses
        // it rather than trying to re-read a consumed body.
        const sendGemini = async () => {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
            method:'POST', signal:ctrl.signal,
            headers:{'Content-Type':'application/json','x-goog-api-key':c.geminiKey}, // header, not ?key= — keeps the key out of the URL
            body:JSON.stringify(body) });
          let payload=null; try{ payload=await r.json(); }catch(e){}
          return { r, payload, detail: payload?.error?.message || '' };
        };
        let sent=await sendGemini();
        // Older models reject thinkingConfig outright rather than ignoring it, which would turn an
        // optional quality knob into a hard failure. Drop it, remember that for the session, and send
        // the same request again rather than losing a build over a parameter we didn't need.
        if(!sent.r.ok && sent.r.status===400 && geminiThinkOk && /thinking/i.test(sent.detail)){
          geminiThinkOk=false; delete body.generationConfig.thinkingConfig;
          sent=await sendGemini();
        }
        res=sent.r;
        if(!res.ok){
          const detail=sent.detail;
          const err=new Error('Gemini '+res.status+(res.status===400?' — bad key or model id':res.status===403?' — key rejected':res.status===404?' — no such model':res.status===429?' — rate limited':'')+(detail?' — '+detail:''));
          err.status=res.status; const ra=res.headers.get('retry-after'); if(ra) err.retryAfterMs=(parseFloat(ra)||0)*1000;
          if(window.__aiIsDailyLimit(detail)) err.exhausted=true;
          throw err;
        }
        data=sent.payload; // already parsed by sendGemini — a body can only be read once
        // Recorded before the text is extracted, so a response that comes back empty (thinking ate
        // the whole budget) still lands on the meter. Those are billed exactly like a useful one.
        window.__aiUsage?.record(model, { in: data?.usageMetadata?.promptTokenCount,
                                          out: data?.usageMetadata?.candidatesTokenCount,
                                          thoughts: data?.usageMetadata?.thoughtsTokenCount,
                                          cached: data?.usageMetadata?.cachedContentTokenCount });
        const cand=data?.candidates?.[0];
        text=(cand?.content?.parts||[]).map(p=>p&&p.text).filter(Boolean).join('');
        if(!text){
          const fr=cand?.finishReason||data?.promptFeedback?.blockReason;
          throw new Error('Empty response from Gemini.'+(fr?` (finishReason: ${fr})`:''));
        }
      } else {
        if(!c.url||!c.token) throw new Error('Set your HA URL + token in ⚙ setup.');
        const base=c.url.replace(/\/+$/,'');
        const post=(cmd,body)=>fetch(base+'/api/services/rest_command/'+cmd+'?return_response',{ method:'POST', signal:ctrl.signal, headers:{'Content-Type':'application/json','Authorization':'Bearer '+c.token}, body:JSON.stringify(body) });
        const shared={ system_prompt:system, user_prompt:user };
        // ferrett_ai_request is the hop that actually carries this app's parameters. The older
        // groq_speed_request / groq_creative_request hardcode model, temperature and (creative) a
        // "creative storyteller" persona in front of the system prompt, drop response_format on the
        // floor, and — the killer — set no `timeout:`, so HA's 10s rest_command default aborts any
        // call long enough to matter. opts.timeoutMs never had a say; HA gave up first.
        // Sized, never padded — see the max_completion_tokens note on the direct-Groq branch above.
        res=await post('ferrett_ai_request', { ...shared,
          temperature: opts.creative?0.8:0.3,
          max_tokens: opts.maxTokens || 1500,
          reasoning_effort: opts.think || 'low',
          // Only sent when something has explicitly chosen one; otherwise the rest_command's own
          // default stands, so an un-updated Home Assistant keeps behaving exactly as it did.
          ...(c.haModel ? { model: c.haModel } : {}),
          response_format: opts.json?'json_object':'text' });
        // 400 from HA means the service doesn't exist — this Home Assistant hasn't picked up the new
        // rest_command yet. Fall back to the old pair so the app still works, just unparameterized.
        if(res.status===400) res=await post(opts.creative?'groq_creative_request':'groq_speed_request', opts.json?{...shared, response_format:'json_object'}:shared);
        if(!res.ok){ const err=new Error('HA '+res.status+(res.status===401?' — bad token':res.status===400?' — check rest_command exists':res.status===429?' — rate limited':'')); err.status=res.status; const ra=res.headers.get('retry-after'); if(ra) err.retryAfterMs=(parseFloat(ra)||0)*1000; throw err; }
        data=await res.json();
        const sr=data?.service_response||data;
        // The HA hop forwards whatever the upstream returned, so usage may or may not survive the
        // round trip. Recorded when it does; the model label is the hop itself, which has no price
        // on file, so this shows tokens without pretending to know the rate.
        window.__aiUsage?.record(c.haModel || 'HA hop', { in: (sr?.content?.usage || sr?.usage)?.prompt_tokens,
                                                          out: (sr?.content?.usage || sr?.usage)?.completion_tokens });
        const msg = sr?.content?.choices?.[0]?.message ?? sr?.choices?.[0]?.message ?? null;
        // `??` treats an empty string as a present value and stops looking, which is exactly wrong
        // here: a reasoning model that spent its whole budget thinking returns content:"" — a real,
        // common outcome that has to fall through to the diagnostics below rather than read as an answer.
        text = (msg && msg.content) || (typeof sr?.content==='string' ? sr.content : null);
        // Read the failure reason out of the SAME envelope the text came from. Looking for it on the
        // outer HA response (which has no `choices`) is why every failed batch reported a bare "Empty
        // response from the model." and four rounds of retries taught us nothing about why.
        haFinish = sr?.content?.choices?.[0]?.finish_reason ?? sr?.choices?.[0]?.finish_reason;
        haApiErr = sr?.content?.error?.message ?? sr?.error?.message;
        // Groq's own 400s and 429s arrive INSIDE a 200 from Home Assistant — HA reports that it
        // successfully made a request, and the rejection is just the body it got back. So without
        // this, a rate-limit refusal reached the caller as an anonymous "empty response" with no
        // status to switch on: callWithRetry couldn't tell it from a fluke, backed off by guesswork,
        // and re-sent the same over-budget request until the rounds ran out. Rethrow it as the rate
        // limit it is, carrying the server's own "try again in 14.2275s" as the delay.
        if(!text && haApiErr){
          const err=new Error(haApiErr);
          if(/rate limit|tokens per minute|\bTPM\b|too large/i.test(haApiErr)) err.status=429;
          const m=/try again in ([\d.]+)\s*s/i.exec(haApiErr);
          if(m) err.retryAfterMs=Math.ceil(parseFloat(m[1])*1000)+500;
          if(window.__aiIsDailyLimit(haApiErr)) err.exhausted=true;
          throw err;
        }
        if(!text && msg && msg.reasoning) emptyHint='the model returned only its reasoning and no answer — it ran out of tokens before writing one';
        else if(!text && !msg) emptyHint='Home Assistant returned no model response at all — usually the rest_command timing out';
      }
      if(!text||typeof text!=='string') {
        // finish_reason:'length' means the model got cut off mid-response (often a token-budget/rate
        // issue), 'content_filter' means it was blocked — surface whichever is available instead of a
        // bare "empty response" so a recurrence is diagnosable without digging through devtools.
        const reason=data?.choices?.[0]?.finish_reason ?? haFinish; const apiErr=data?.error?.message ?? haApiErr;
        throw new Error('Empty response from the model.'+(reason?` (finish_reason: ${reason})`:'')+(apiErr?` — ${apiErr}`:'')+(emptyHint?` — ${emptyHint}`:''));
      }
      return text.trim();
    } catch(e){
      if(e.name==='AbortError') throw new Error(`Timed out (${Math.round((opts.timeoutMs||45000)/1000)}s).`);
      if(e instanceof TypeError) throw new Error(c.mode==='ha' ? 'Network/CORS blocked — check HTTPS + cors_allowed_origins.' : 'Network blocked — no connection, or the browser refused the call.');
      throw e;
    } finally { clearTimeout(to); }
  };

  // ---- helpers ----
  function toLines(txt){ return txt.split('\n').map(l=>l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/,'').replace(/^["'“]|["'”]$/g,'').trim()).filter(l=>l && !/^\(.*\)$/.test(l)).slice(0,40); }
  const MODE_LABEL={ ha:'HA', groq:'Groq', gemini:'Gemini' };
  function updateStatus(){ const on=isConfigured(); const c=loadCfg(); const spend=window.__aiUsage?.summary(window.__aiUsage.session); const label= on?`● ${MODE_LABEL[c.mode]||'HA'} linked${spend?` · ${spend} this session`:''}`:'○ not set up'; ['ai-status-lyr','ai-status-tools'].forEach(id=>{ const el=$(id); if(el){ el.textContent=label; el.style.color=on?'#00FF88':'rgba(226,232,240,0.4)'; } }); }
  window.__updateAiStatus = updateStatus;

  // ---- settings modal ----
  const AI_MODES=['ha','groq','gemini'];
  let modalMode='ha';
  function setModalMode(m){
    modalMode = AI_MODES.includes(m) ? m : 'ha';
    AI_MODES.forEach(k=>{
      const on = k===modalMode;
      $('ai-cfg-'+k)?.classList.toggle('hidden', !on);
      const b=$('ai-mode-'+k); if(!b) return;
      b.classList.toggle('bg-[#00E5FF]/20', on);
      b.classList.toggle('text-[#00E5FF]', on);
      b.classList.toggle('text-[#00E5FF]/50', !on);
    });
  }
  function populateAiSettings(){ 
    try {
      const c=loadCfg() || {}; 
      setModalMode(c.mode||'ha'); 
      if($('ai-url')) $('ai-url').value=c.url||DEFAULT_HA_URL; 
      
      if($('ai-token')){
        $('ai-token').value='';
        $('ai-token').placeholder=c.token ? '[ TOKEN SAVED - LEAVE BLANK TO KEEP ]' : '';
      }
      
      if($('ai-groq-key')){
        $('ai-groq-key').value='';
        $('ai-groq-key').placeholder=c.groqKey ? '[ API KEY SAVED - LEAVE BLANK TO KEEP ]' : '';
      }
      if($('ai-groq-model')) $('ai-groq-model').value=c.groqModel||'openai/gpt-oss-120b'; 
      
      if($('ai-gemini-key')){
        $('ai-gemini-key').value='';
        $('ai-gemini-key').placeholder=c.geminiKey ? '[ API KEY SAVED - LEAVE BLANK TO KEEP ]' : 'AIza…';
      }
      if($('ai-gemini-model')) $('ai-gemini-model').value=c.geminiModel||'gemini-3.6-flash'; 
      if($('ai-gemini-think')) $('ai-gemini-think').value=c.geminiThink||'low'; 
      
      if($('ai-test-out')) $('ai-test-out').textContent=`Loaded config: mode=${c.mode}, think=${c.geminiThink}`; 
      window.renderAccountingLedger?.(); 
    } catch(e) {
      console.error('Error in populateAiSettings:', e);
    }
  }
  window.populateAiSettings = populateAiSettings;
  
  function openAiModal(){
      populateAiSettings();
      const navSettings = $('nav-settings-new');
      if (navSettings) navSettings.click();
  }

  window.renderAccountingLedger = () => {
    try {
      let log = (window.db && window.db.accounting) || [];
      if (!Array.isArray(log)) {
          // If the data somehow got corrupted into an object (e.g. from a bad Drive sync)
          log = [];
          if (window.db) window.db.accounting = [];
      }
      let life = 0, month = 0, week = 0;
      const now = Date.now();
      log.forEach(e => {
          const amt = e.usd || 0;
          life += amt;
          if (now - (e.ts||0) <= 30*24*60*60*1000) month += amt;
          if (now - (e.ts||0) <= 7*24*60*60*1000) week += amt;
      });
      if ($('acct-life')) $('acct-life').textContent = window.__aiUsage?.fmtUsd(life) || '$0.00';
      if ($('acct-month')) $('acct-month').textContent = window.__aiUsage?.fmtUsd(month) || '$0.00';
      if ($('acct-week')) $('acct-week').textContent = window.__aiUsage?.fmtUsd(week) || '$0.00';
      
      const list = $('acct-list');
      if (!list) return;
      list.innerHTML = log.slice(0, 30).map(e => {
          const d = new Date(e.ts||Date.now());
          const df = d.toLocaleDateString('en-US', {month:'2-digit',day:'2-digit'}) + ' ' + d.toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit'});
          return `<div class="flex items-center gap-2 text-[10px] py-1 border-b border-[#00E5FF10] last:border-0">
              <span class="flex-1 text-[#E2E8F0]/70 truncate">${e.context||'API Call'}</span>
              <span class="text-[#00E5FF]/40 font-mono w-24 text-right shrink-0">${df}</span>
              <span class="text-[#7AFFBF] font-mono font-bold w-12 text-right shrink-0">${window.__aiUsage?.fmtUsd(e.usd||0)}</span>
          </div>`;
      }).join('') || '<div class="text-[10px] text-[#E2E8F0]/30 italic py-2 text-center">No AI calls logged yet.</div>';
    } catch (e) {
      console.error('Error rendering accounting ledger:', e);
    }
  };
  window.__openAiModal = openAiModal;
  function closeAiModal(){ const m=$('ai-modal'); m.classList.add('hidden'); m.classList.remove('flex'); }
  function readModalCfg(){
    const current = loadCfg();
    if(modalMode==='groq') return { ...current, mode:'groq', groqKey:$('ai-groq-key').value.trim() || current.groqKey, groqModel:$('ai-groq-model').value.trim()||'openai/gpt-oss-120b' };
    if(modalMode==='gemini') return { ...current, mode:'gemini', geminiKey:$('ai-gemini-key').value.trim() || current.geminiKey, geminiModel:$('ai-gemini-model').value.trim()||'gemini-3.6-flash', geminiThink:$('ai-gemini-think').value };
    return { ...current, mode:'ha', url:$('ai-url').value.trim(), token:$('ai-token').value.trim() || current.token };
  }
  async function testConn(){ const out=$('ai-test-out'); saveCfg(readModalCfg()); out.style.color='#00E5FF'; out.textContent='testing…'; try{ window.__aiUsage?.begin('Settings: Test Connection'); const r=await window.ferrettAI('You are a test. Reply with exactly: OK','ping',{creative:false}); window.__aiUsage?.end(); out.style.color='#00FF88'; out.textContent='✓ connected — model said: '+r.slice(0,40); }catch(e){ out.style.color='#FF5A5A'; out.textContent='✗ '+e.message; } }

  // ---- lyrics AI ----
  // All four actions below share one progress bar (window.startAiProgress, defined in
  // js/02-app-core.js) instead of the old plain "thinking…" spinner — same visual language as
  // Producer Notes and the Lyria Prompt Generator. These calls are short (a handful of lines or
  // titles), so a generous estimate isn't needed; 8s is enough to fill smoothly for a typical reply.
  function note(id,msg){ const el=$(id); if(el) el.textContent=msg||''; }
  const lyrProgress = (verb) => window.startAiProgress('ai-lyr-progress-wrap','ai-lyr-progress-bar','ai-lyr-progress-label', verb, 8000);
  async function lyrGen(){
    if(!isConfigured()){ openAiModal(); return; }
    const theme=$('ai-lyr-theme').value.trim()||'anything'; const style=$('ai-lyr-style').value;
    const progress=lyrProgress('Writing lyric lines'); note('ai-lyr-note','');
    try{
      const sys='You are a professional songwriter. Output ONLY lyric lines — one per line, no title, no numbering, no commentary, no section labels unless natural like [Hook]. Keep lines singable and vivid.';
      window.__aiUsage?.begin('Lyrics: Generate');
      const txt=await window.ferrettAI(sys, `Write 8 lines of ${style} about: ${theme}.`, {creative:true});
      window.__aiUsage?.end();
      const lines=toLines(txt); if(!lines.length) throw new Error('No usable lines came back.');
      window.lyrAddLines(lines);
      progress.stop(true);
    }catch(e){ progress.stop(false); note('ai-lyr-note', e.message); }
  }
  async function lyrContinue(){
    if(!isConfigured()){ openAiModal(); return; }
    const cur=(window.lyrGetActiveText&&window.lyrGetActiveText())||''; if(!cur.trim()){ note('ai-lyr-note','Write or generate a few lines first.'); return; }
    const progress=lyrProgress('Continuing the lyric'); note('ai-lyr-note','');
    try{
      const sys='You are a songwriter. Continue the given lyric in the same voice, theme, and rhythm. Output ONLY the new lines — one per line, no commentary.';
      window.__aiUsage?.begin('Lyrics: Continue');
      const txt=await window.ferrettAI(sys, `Continue with 4 more lines:\n\n${cur}`, {creative:true});
      window.__aiUsage?.end();
      const lines=toLines(txt); if(!lines.length) throw new Error('No usable lines came back.');
      window.lyrAddLines(lines);
      progress.stop(true);
    }catch(e){ progress.stop(false); note('ai-lyr-note', e.message); }
  }
  async function lyrPunch(){
    if(!isConfigured()){ openAiModal(); return; }
    let targets=window.lyrGetSelectedLines?window.lyrGetSelectedLines().filter(ln=>ln.text.trim()):[];
    let usingSelection=targets.length>0;
    if(!usingSelection){
      const last=window.lyrGetLastNonEmptyLine&&window.lyrGetLastNonEmptyLine();
      if(!last){ note('ai-lyr-note','Nothing to punch up yet — check a line, or write one first.'); return; }
      targets=[last];
    }
    // One bar for the whole batch, not one per line — a multi-line punch-up is still one wait from
    // the user's point of view, sized a bit longer since it can be several sequential calls deep.
    const progress=lyrProgress(targets.length>1?`Punching up ${targets.length} lines`:'Punching up the line'); note('ai-lyr-note','');
    try{
      window.lyrBeginBatchEdit&&window.lyrBeginBatchEdit();
      const sys='You are a punch-in lyric editor. Given one line, output 3 punchier alternative versions — one per line, no numbering, no commentary. Keep the syllable count close.';
      let addedAny=false;
      for(const ln of targets){
        const clean=(ln.text||'').replace(/^\[[^\]]*\]\s*/,'').trim(); if(!clean) continue;
        window.__aiUsage?.begin('Lyrics: Punch In');
        const txt=await window.ferrettAI(sys, `Rewrite this line 3 ways: ${clean}`, {creative:true});
        window.__aiUsage?.end();
        const alts=toLines(txt).slice(0,3); if(!alts.length) continue;
        if(window.lyrInsertAltsAfterLine(ln,alts)) addedAny=true;
      }
      if(!addedAny) throw new Error('No alternatives came back.');
      window.lyrFinishBatchEdit&&window.lyrFinishBatchEdit();
      progress.stop(true);
      note('ai-lyr-note', usingSelection ? 'Added alternatives right under each checked line (highlighted) — keep your favorite, delete the rest.' : 'Added alternatives right under the last line (highlighted) — keep your favorite, delete the rest.');
    }catch(e){ progress.stop(false); note('ai-lyr-note', e.message); }
  }

  async function lyrTitle(){
    if(!isConfigured()){ openAiModal(); return; }
    const cur=(window.lyrGetActiveText&&window.lyrGetActiveText())||''; if(!cur.trim()){ note('ai-lyr-note','Write or generate a few lines first.'); return; }
    const progress=lyrProgress('Naming the song'); note('ai-lyr-note','');
    try{
      const sys='You name songs. Given lyrics, output 5 short, evocative song-title options — one per line, no numbering, no quotes, no commentary.';
      window.__aiUsage?.begin('Lyrics: Generate Titles');
      const txt=await window.ferrettAI(sys, `Lyrics:\n\n${cur}`, {creative:true});
      window.__aiUsage?.end();
      const titles=toLines(txt).slice(0,6); const box=$('ai-lyr-titles');
      box.innerHTML=titles.map(t=>`<button class="ai-title-chip text-[11px] px-2.5 py-1 rounded border border-[#00E5FF40] text-[#00E5FF] hover:bg-[#00E5FF]/10 cursor-pointer" data-t="${window.escapeHtml(t)}">${window.escapeHtml(t)}</button>`).join('');
      box.classList.remove('hidden'); box.classList.add('flex');
      box.querySelectorAll('.ai-title-chip').forEach(c=>c.addEventListener('click',()=>{ const ti=$('lyr-title'); if(ti){ ti.value=c.dataset.t; ti.dispatchEvent(new Event('input',{bubbles:true})); } }));
      progress.stop(true);
    }catch(e){ progress.stop(false); note('ai-lyr-note', e.message); }
  }

  function init(){
    // modal wiring
    AI_MODES.forEach(k=>$('ai-mode-'+k)?.addEventListener('click',()=>setModalMode(k)));
    $('ai-modal-close')?.addEventListener('click',closeAiModal);
    $('ai-test-btn')?.addEventListener('click',testConn);
    $('ai-save-btn')?.addEventListener('click',(e)=>{
        saveCfg(readModalCfg());
        updateStatus();
        const btn = e.target;
        const orig = btn.textContent;
        btn.textContent = 'SAVED ✓';
        btn.classList.add('bg-[#00FF88]/20', 'text-[#00FF88]');
        setTimeout(() => {
            btn.textContent = orig;
            btn.classList.remove('bg-[#00FF88]/20', 'text-[#00FF88]');
            closeAiModal();
        }, 600);
    });
    $('ai-clear-btn')?.addEventListener('click',()=>{ if(confirm('Clear stored AI connection?')){ localStorage.removeItem(AI_KEY); updateStatus(); populateAiSettings(); } });
    document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && $('ai-modal') && !$('ai-modal').classList.contains('hidden')) closeAiModal(); });
    $('btn-ai-settings-lyr')?.addEventListener('click',openAiModal);
    // populate settings immediately on load
    populateAiSettings();
    // lyrics
    $('btn-ai-lyr-gen')?.addEventListener('click',lyrGen);
    $('btn-ai-lyr-cont')?.addEventListener('click',lyrContinue);
    $('btn-ai-lyr-punch')?.addEventListener('click',lyrPunch);
    $('btn-lyr-punch-selected')?.addEventListener('click',lyrPunch);
    $('btn-ai-lyr-title')?.addEventListener('click',lyrTitle);
    $('ai-lyr-theme')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') lyrGen(); });
    updateStatus();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
