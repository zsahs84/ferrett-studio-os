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
  // ---- song forms ----
  // Machine-readable counterparts to the display-only SONG STRUCTURE TEMPLATES card in the Lyrics Lab.
  // [sectionName, bars] — bars doubles as the line count asked of the model, since one line per bar is
  // the convention the sheet itself already assumes (see sectionsFromLines in js/06-lyrics-lab.js), so
  // an inserted song lands with a bar count that matches its arrangement without any extra mapping.
  const SONG_FORMS=[
    ['auto',   "Auto — match the genre's usual shape", null],
    ['simple', 'Simple — Verse / Chorus ×2',           [['Verse',8],['Chorus',8],['Verse',8],['Chorus',8]]],
    ['pop',    'Modern Pop',                           [['Intro',2],['Verse',8],['Pre-Chorus',4],['Chorus',8],['Verse',8],['Pre-Chorus',4],['Chorus',8],['Bridge',8],['Chorus',8],['Outro',2]]],
    ['hiphop', 'Hip-Hop / Rap',                        [['Intro',4],['Hook',8],['Verse',16],['Hook',8],['Verse',16],['Hook',8],['Verse',12],['Outro',4]]],
    ['rock',   'Verse-Chorus Rock',                    [['Intro',2],['Verse',8],['Chorus',8],['Verse',8],['Chorus',8],['Bridge',8],['Chorus',8],['Outro',4]]],
    ['ballad', 'Ballad',                               [['Verse',8],['Chorus',8],['Verse',8],['Chorus',8],['Bridge',8],['Chorus',8]]],
    ['aaba',   'AABA (32-bar standard)',               [['Verse',8],['Verse',8],['Bridge',8],['Verse',8]]],
    ['edm',    'EDM / Dance',                          [['Intro',4],['Build',4],['Drop',8],['Breakdown',4],['Build',4],['Drop',8],['Outro',4]]],
    ['linked', "Match this sheet's linked song",       null],
    ['custom', 'Custom…',                              null]
  ];
  // Which template a genre falls back to on "Auto", keyed off the Cookbook's own category field so a
  // new genre in an existing category is handled without touching this list.
  const FORM_BY_CATEGORY={ 'HIP HOP':'hiphop', 'ROCK':'rock', 'METAL':'rock', 'POP':'pop', 'EDM':'edm', 'COUNTRY':'ballad' };

  function lyrGenreMeta(){
    const genre=$('ai-lyr-genre')?.value||'';
    let meta=null;
    if(genre && window.getGenreMeta){ try{ meta=window.getGenreMeta(genre); }catch(e){} }
    return { genre, meta };
  }
  // Repeated section names get numbered the way an arrangement does ("Verse 1", "Verse 2"), so the
  // model can be told plainly that "Chorus 2" repeats "Chorus 1" verbatim.
  function numberSections(sections){
    const total={}; sections.forEach(([n])=>{ total[n]=(total[n]||0)+1; });
    const seen={};
    return sections.map(([n,bars])=>{
      if(total[n]>1){ seen[n]=(seen[n]||0)+1; return [`${n} ${seen[n]}`, bars, n]; }
      return [n, bars, n];
    });
  }
  function parseCustomForm(text){
    return String(text||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
      const m=l.match(/^(.*?)[\s·:-]+(\d{1,2})\s*$/);
      if(m) return [m[1].trim(), Math.max(1, Math.min(32, parseInt(m[2],10)||8))];
      return [l.replace(/\s+\d+$/,'').trim(), 8];
    }).filter(s=>s[0]);
  }
  // The section list the WRITE FULL SONG button will actually use, resolving auto/linked/custom.
  function resolveForm(){
    const key=$('ai-lyr-form')?.value||'auto';
    if(key==='custom') return { key, sections:parseCustomForm($('ai-lyr-form-custom')?.value), label:'Custom' };
    if(key==='linked'){
      const link=window.lyrLinkedArrangement?.();
      return { key, sections: link?link.sections:[], label: link?`${link.title||'linked song'}'s arrangement`:'linked song' };
    }
    if(key==='auto'){
      const { meta }=lyrGenreMeta();
      const pick=FORM_BY_CATEGORY[meta&&meta.category]||'simple';
      const row=SONG_FORMS.find(f=>f[0]===pick);
      return { key, sections:row?row[2]:[], label:`Auto → ${row?row[1]:'Simple'}` };
    }
    const row=SONG_FORMS.find(f=>f[0]===key);
    return { key, sections:row?row[2]:[], label:row?row[1]:key };
  }
  function renderFormPreview(){
    const el=$('ai-lyr-form-preview'); if(!el) return;
    const custom=$('ai-lyr-form-custom-wrap');
    if(custom) custom.classList.toggle('hidden', ($('ai-lyr-form')?.value||'')!=='custom');
    const f=resolveForm();
    if(!f.sections.length){
      el.textContent = f.key==='linked'
        ? 'This sheet isn\'t linked to a Song Board song with an arrangement yet — pick another form.'
        : 'Add at least one section above.';
      el.className='text-[9px] text-[#FF5A5A]/60 font-mono mb-3 leading-relaxed';
      return;
    }
    const numbered=numberSections(f.sections);
    const bars=numbered.reduce((s,x)=>s+x[1],0);
    el.textContent=`${f.label}: ` + numbered.map(([n,b])=>`${n} ${b}`).join(' · ') + `  —  ${numbered.length} sections, ${bars} lines`;
    el.className='text-[9px] text-[#00E5FF]/45 font-mono mb-3 leading-relaxed';
  }

  // ---- draft box ----
  // Every generator below writes HERE rather than into the sheet, so nothing touches the user's lines
  // until they press INSERT. __lyrTakeLoadedId mirrors the Lyria/Producer Notes pattern: while a saved
  // take is loaded, edits in the box autosave back into that take.
  window.__lyrTakeLoadedId=null;
  function lyrDraftSet(text, keepTakeLink){
    const out=$('ai-lyr-out'); if(!out) return;
    out.value=text||'';
    if(!keepTakeLink) window.__lyrTakeLoadedId=null;
    $('ai-lyr-out-wrap')?.classList.remove('hidden');
    lyrDraftCount();
    out.scrollIntoView({block:'nearest'});
  }
  function lyrDraftCount(){
    const out=$('ai-lyr-out'), el=$('ai-lyr-out-count'); if(!out||!el) return;
    const lines=out.value.split('\n').filter(l=>l.trim() && !/^\[.*\]$/.test(l.trim())).length;
    const secs=(out.value.match(/^\[.*\]\s*$/gm)||[]).length;
    el.textContent=`${secs?secs+' sections · ':''}${lines} lines · ${out.value.length.toLocaleString()} chars`;
  }
  // Turns the draft's "[Section]" headers into per-line tags, which is the shape lyrAddLines wants.
  // Bare header lines set the running tag and are dropped; the sheet re-derives its section list (and
  // the linked song's arrangement) from the tagged lines themselves.
  function draftToTagged(text){
    const out=[]; let tag='';
    String(text||'').split('\n').forEach(raw=>{
      const l=raw.trim(); if(!l) return;
      const header=l.match(/^\[(.+?)\]\s*$/);
      if(header){ tag=header[1].trim(); return; }
      const inline=l.match(/^\[(.+?)\]\s*(.+)$/);
      if(inline){ tag=inline[1].trim(); out.push(`[${tag}] ${inline[2].trim()}`); return; }
      out.push(tag?`[${tag}] ${l}`:l);
    });
    return out;
  }

  async function lyrSong(){
    if(!isConfigured()){ openAiModal(); return; }
    const form=resolveForm();
    if(!form.sections.length){ note('ai-lyr-note','Pick a song form with at least one section first.'); return; }
    const { genre, meta }=lyrGenreMeta();
    const theme=$('ai-lyr-theme')?.value.trim()||'';
    const mood=$('ai-lyr-mood')?.value.trim() || (meta&&meta.mood) || '';
    const pov=$('ai-lyr-pov')?.value||'';
    const numbered=numberSections(form.sections);
    // A full song is a much bigger reply than the other three actions, so this one gets its own
    // longer progress estimate, token ceiling and timeout — the shared 8s bar and the HA path's
    // default 1500-token cap would both cut a real song off part-written.
    const progress=lyrProgress('Writing the full song');
    note('ai-lyr-note','');
    try{
      const sys=[
        'You are a professional songwriter. Write a COMPLETE song — every section of the structure given, in the order given.',
        'FORMAT, exactly: each section starts with its name alone on its own line in square brackets, spelled exactly as given (e.g. [Verse 1]), followed by that section\'s lyric lines, one per line. Nothing before the first header, nothing after the last line. No numbering, no commentary, no markdown, no chord names, no production notes.',
        'Write exactly the number of lines each section asks for. That number is its bar count and one line per bar is the convention.',
        'A section that repeats (Chorus 2 after Chorus 1, a returning Hook) must repeat the SAME words as its first appearance, word for word, the way a real song does. Never write fresh lyrics for a repeat.',
        'Keep the syllable count and stress pattern consistent within a section so the lines sit on a grid and can actually be sung or rapped.',
        'Instrumental-only sections (Intro, Outro, Build, Drop, Breakdown, Solo) should carry very few words or a short repeated chant/ad-lib rather than full sentences — do not force full verses into them.',
        'NEVER name a real artist, producer, band or song title.'
      ].join(' ');
      const structureLines=numbered.map(([name,bars])=>`[${name}] — ${bars} lines`).join('\n');
      const repeats=numbered.filter(([name,,base])=>numbered.filter(x=>x[2]===base).length>1 && /\s2$|\s3$|\s4$/.test(name));
      const user=[
        `GENRE: ${genre||'(none chosen — write to the topic and mood alone)'}`,
        meta&&meta.desc?`GENRE BACKGROUND (private reference — never repeat any artist or song name from this in the lyrics): ${meta.desc}`:'',
        meta&&meta.vox?`VOCAL STYLE for this genre — write lines that suit this delivery: ${meta.vox}`:'',
        `MOOD: ${mood||'(your choice, but keep it consistent)'}`,
        `TOPIC / WHAT IT IS ABOUT: ${theme||'(your choice — pick one concrete situation and stay with it)'}`,
        pov?`PERSPECTIVE: write in ${pov}.`:'',
        repeats.length?`REPEATS: ${repeats.map(r=>r[0]).join(', ')} must reuse their first version's words exactly.`:'',
        '',
        'STRUCTURE — write every one of these, in this order, with these line counts:',
        structureLines
      ].filter(Boolean).join('\n');
      window.__aiUsage?.begin('Lyrics: Full Song');
      const txt=await window.ferrettAI(sys, user, { creative:true, maxTokens:3000, timeoutMs:120000 });
      window.__aiUsage?.end();
      if(!txt || !txt.trim()) throw new Error('Nothing came back.');
      lyrDraftSet(txt.trim().replace(/^```[a-z]*\n?|```$/g,'').trim());
      progress.stop(true);
      note('ai-lyr-note','');
      const gotSections=(($('ai-lyr-out')?.value.match(/^\[.*\]\s*$/gm))||[]).length;
      if(gotSections && gotSections<numbered.length){
        note('ai-lyr-note', `Only ${gotSections} of ${numbered.length} sections came back — the model may have run short. Edit the draft, or hit WRITE FULL SONG again.`);
      }
    }catch(e){ progress.stop(false); note('ai-lyr-note', e.message); }
  }

  async function lyrGen(){
    if(!isConfigured()){ openAiModal(); return; }
    const { genre, meta }=lyrGenreMeta();
    const theme=$('ai-lyr-theme')?.value.trim()||'';
    const mood=$('ai-lyr-mood')?.value.trim() || (meta&&meta.mood) || '';
    const pov=$('ai-lyr-pov')?.value||'';
    const section=$('ai-lyr-section')?.value||'';
    const count=Math.max(2, Math.min(32, parseInt($('ai-lyr-count')?.value,10)||8));
    const progress=lyrProgress(`Writing ${count} lines`); note('ai-lyr-note','');
    try{
      const sys='You are a professional songwriter. Output ONLY lyric lines — one per line, no title, no numbering, no commentary. Keep every line singable and speakable out loud, with a consistent syllable count and stress pattern so the lines sit on a grid. Never name a real artist, producer, band or song title.';
      const user=[
        `Write exactly ${count} lines${section?` for a [${section}] section`:''}.`,
        genre?`GENRE: ${genre}`:'',
        meta&&meta.vox?`VOCAL STYLE to suit: ${meta.vox}`:'',
        `MOOD: ${mood||'(your choice)'}`,
        `TOPIC: ${theme||'(your choice — one concrete situation)'}`,
        pov?`PERSPECTIVE: ${pov}.`:''
      ].filter(Boolean).join('\n');
      window.__aiUsage?.begin('Lyrics: Generate');
      const txt=await window.ferrettAI(sys, user, {creative:true});
      window.__aiUsage?.end();
      const lines=toLines(txt); if(!lines.length) throw new Error('No usable lines came back.');
      lyrDraftSet((section?`[${section}]\n`:'')+lines.join('\n'));
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
      // Into the draft box like every other generator — nothing reaches the sheet until INSERT, so a
      // continuation you don't like costs an ✕ DISCARD instead of hunting down four pasted lines.
      lyrDraftSet(lines.join('\n'));
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

  // ---- draft actions + saved takes (full CRUD on generated lyrics) ----
  function lyrDraftText(){ return ($('ai-lyr-out')?.value||'').trim(); }

  function lyrInsertDraft(){
    const arr=draftToTagged(lyrDraftText());
    if(!arr.length){ note('ai-lyr-note','Nothing in the draft to insert.'); return; }
    window.lyrAddLines(arr);
    note('ai-lyr-note',`Added ${arr.length} line${arr.length===1?'':'s'} to “${window.lyrTakes?.sheetTitle?.()||'the sheet'}”. Section headers became line tags, so the arrangement rebuilt itself.`);
    $('ai-lyr-note').className='text-[10px] text-[#7AFFBF]/80 mt-2';
  }
  function lyrDraftToNewSheet(){
    const arr=draftToTagged(lyrDraftText());
    if(!arr.length){ note('ai-lyr-note','Nothing in the draft to save.'); return; }
    const name=prompt('Name the new sheet:', $('ai-lyr-theme')?.value.trim() || 'Untitled');
    if(name===null) return;
    window.lyrNewSheetFromLines?.(name.trim()||'Untitled', arr);
    note('ai-lyr-note',`Started a new sheet — “${name.trim()||'Untitled'}”.`);
    $('ai-lyr-note').className='text-[10px] text-[#7AFFBF]/80 mt-2';
  }
  function lyrSaveTake(){
    const text=lyrDraftText();
    if(!text){ note('ai-lyr-note','Generate or write something first.'); return; }
    const list=window.lyrTakes?.list?.()||[];
    const suggested=`Take ${list.length+1}`;
    const name=prompt('Name this take (e.g. "Take 2 — darker second verse"):', suggested);
    if(name===null) return;
    const take=window.lyrTakes.add(name.trim()||suggested, text, {
      genre:$('ai-lyr-genre')?.value||'', mood:$('ai-lyr-mood')?.value||'',
      topic:$('ai-lyr-theme')?.value||'', form:$('ai-lyr-form')?.value||'', pov:$('ai-lyr-pov')?.value||''
    });
    // Edits from here autosave into this take, so small tweaks never need SAVE pressed again.
    window.__lyrTakeLoadedId=take.id;
    window.renderLyrTakes();
    note('ai-lyr-note',`Saved “${take.name}”. Edits to the draft now autosave into it.`);
    $('ai-lyr-note').className='text-[10px] text-[#7AFFBF]/80 mt-2';
  }
  window.renderLyrTakes=()=>{
    const wrap=$('ai-lyr-takes-wrap'); if(!wrap||!window.lyrTakes) return;
    const takes=window.lyrTakes.list();
    wrap.classList.toggle('hidden', !takes.length);
    const hint=$('ai-lyr-takes-hint');
    if(hint) hint.textContent=takes.length?`${takes.length} saved`:'';
    const list=$('ai-lyr-takes-list'); if(!list) return;
    // Newest first — the take you just saved is the one you're most likely to want back.
    list.innerHTML=takes.slice().reverse().map(t=>{
      const lines=String(t.text||'').split('\n').filter(l=>l.trim() && !/^\[.*\]$/.test(l.trim())).length;
      const on=String(window.__lyrTakeLoadedId)===String(t.id);
      return `<div class="flex items-center gap-2 p-2 rounded border ${on?'border-[#FFD60A60] bg-[#FFD60A]/5':'border-[#FFD60A20] bg-black/30'}">
        <div class="flex-1 min-w-0">
          <div class="text-[10px] font-bold text-[#FFD60A] truncate">${window.escapeHtml(t.name)}${on?' <span class="text-[8px] text-[#FFD60A]/60 font-normal">· editing</span>':''}</div>
          <div class="text-[9px] text-white/35 font-mono">${new Date(t.createdAt).toLocaleDateString()} · ${lines} lines${t.params&&t.params.genre?' · '+window.escapeHtml(t.params.genre):''}</div>
        </div>
        <button type="button" class="lyr-take-load btn-euterpe px-2 py-1 text-[9px] shrink-0" data-id="${t.id}" title="Load this take back into the draft box">✏️ LOAD</button>
        <button type="button" class="lyr-take-copy btn-euterpe-green px-2 py-1 text-[9px] shrink-0" data-id="${t.id}" title="Copy this take as plain text">📋</button>
        <button type="button" class="lyr-take-del text-white/30 hover:text-[#FF5A5A] text-[13px] px-1 shrink-0" data-id="${t.id}" title="Delete this take" aria-label="Delete this take">×</button>
      </div>`;
    }).join('');
  };
  function lyrLoadTake(id){
    const t=window.lyrTakes?.get(id); if(!t) return;
    window.__lyrTakeLoadedId=t.id;
    lyrDraftSet(t.text, true);
    const p=t.params||{};
    const set=(elId,v)=>{ const el=$(elId); if(el && v!=null && v!=='') el.value=v; };
    set('ai-lyr-genre',p.genre); set('ai-lyr-mood',p.mood); set('ai-lyr-theme',p.topic);
    set('ai-lyr-form',p.form); set('ai-lyr-pov',p.pov);
    renderFormPreview(); window.renderLyrTakes();
    note('ai-lyr-note',`Loaded “${t.name}” — editing the draft now autosaves into it.`);
    $('ai-lyr-note').className='text-[10px] text-[#7AFFBF]/80 mt-2';
  }
  function lyrDeleteTake(id){
    const t=window.lyrTakes?.get(id); if(!t) return;
    if(!confirm(`Delete saved take “${t.name}”? This can't be undone.`)) return;
    window.lyrTakes.remove(id);
    if(String(window.__lyrTakeLoadedId)===String(id)) window.__lyrTakeLoadedId=null;
    window.renderLyrTakes();
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
    $('btn-ai-lyr-song')?.addEventListener('click',lyrSong);
    $('ai-lyr-theme')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') lyrSong(); });

    // Genre list comes from the Cookbook itself, so a genre added there shows up here with no wiring.
    // Deferred to the next tick because this closure and the Cookbook's own init both run at load and
    // allCookbookGenres isn't guaranteed to exist yet when the AI script's init fires.
    setTimeout(()=>{
      const gsel=$('ai-lyr-genre');
      if(gsel && window.allCookbookGenres){
        const genres=window.allCookbookGenres().sort();
        gsel.innerHTML='<option value="">— no genre —</option>'+genres.map(g=>`<option value="${window.escapeHtml(g)}">${window.escapeHtml(g)}</option>`).join('');
      }
      const fsel=$('ai-lyr-form');
      if(fsel) fsel.innerHTML=SONG_FORMS.map(([k,label])=>`<option value="${k}">${label}</option>`).join('');
      renderFormPreview();
      window.renderLyrTakes?.();
    },0);
    $('ai-lyr-form')?.addEventListener('change',renderFormPreview);
    $('ai-lyr-genre')?.addEventListener('change',renderFormPreview);
    $('ai-lyr-form-custom')?.addEventListener('input',renderFormPreview);

    // draft box
    $('btn-ai-lyr-insert')?.addEventListener('click',lyrInsertDraft);
    $('btn-ai-lyr-newsheet')?.addEventListener('click',lyrDraftToNewSheet);
    $('btn-ai-lyr-save')?.addEventListener('click',lyrSaveTake);
    $('btn-ai-lyr-copy')?.addEventListener('click',(e)=>{
      const out=$('ai-lyr-out'); if(!out) return;
      out.select(); navigator.clipboard?.writeText(out.value).catch(()=>document.execCommand('copy'));
      const b=e.currentTarget, orig=b.textContent; b.textContent='✓ COPIED'; setTimeout(()=>b.textContent=orig,1500);
    });
    $('btn-ai-lyr-discard')?.addEventListener('click',()=>{
      const out=$('ai-lyr-out'); if(out) out.value='';
      $('ai-lyr-out-wrap')?.classList.add('hidden');
      window.__lyrTakeLoadedId=null; window.renderLyrTakes?.(); note('ai-lyr-note','');
    });
    // Keeps the counter honest as you type, and autosaves into the loaded take after a pause — same
    // debounced-write behaviour as the Lyria Prompt and Producer Notes boxes.
    $('ai-lyr-out')?.addEventListener('input',(e)=>{
      lyrDraftCount();
      if(!window.__lyrTakeLoadedId) return;
      clearTimeout(window.__lyrTakeAutosaveTimer);
      window.__lyrTakeAutosaveTimer=setTimeout(()=>{
        window.lyrTakes?.update(window.__lyrTakeLoadedId, e.target.value);
        window.renderLyrTakes?.();
      },700);
    });
    $('ai-lyr-takes-list')?.addEventListener('click',(e)=>{
      const load=e.target.closest('.lyr-take-load'), copy=e.target.closest('.lyr-take-copy'), del=e.target.closest('.lyr-take-del');
      if(load) lyrLoadTake(load.dataset.id);
      else if(copy){
        const t=window.lyrTakes?.get(copy.dataset.id); if(!t) return;
        navigator.clipboard?.writeText(t.text).catch(()=>{});
        const orig=copy.textContent; copy.textContent='✓'; setTimeout(()=>copy.textContent=orig,1200);
      }
      else if(del) lyrDeleteTake(del.dataset.id);
    });
    updateStatus();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
