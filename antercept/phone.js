/* Connected, local-only target lab. No SMS provider, device access or network calls. */
(function () {
  'use strict';
  const root = document.querySelector('[data-target-lab]');
  if (!root) return;
  const countries = [
    ['MA','🇲🇦','Morocco','+212','Casablanca','33.57° N · 7.59° W'],
    ['IL','🇮🇱','Israel','+972','Tel Aviv','32.09° N · 34.78° E'],
    ['US','🇺🇸','United States','+1','New York','40.71° N · 74.01° W'],
    ['DE','🇩🇪','Germany','+49','Berlin','52.52° N · 13.40° E'],
    ['ET','🇪🇹','Ethiopia','+251','Addis Ababa','9.03° N · 38.75° E'],
    ['AE','🇦🇪','United Arab Emirates','+971','Dubai','25.20° N · 55.27° E'],
    ['QA','🇶🇦','Qatar','+974','Doha','25.29° N · 51.53° E'],
    ['FR','🇫🇷','France','+33','Paris','48.86° N · 2.35° E']
  ];
  const scenarios = {
    parcel: {name:'Parcel update',brand:'ParcelFern',tag:'Familiarity · urgency',message:'Your delivery is waiting. Review your delivery preferences before 18:00.',domain:'parcelfern.example',title:'Your delivery, on your terms.',description:'A familiar delivery message creates a reason to act quickly.'},
    workspace: {name:'Workspace invitation',brand:'CloudWren',tag:'Curiosity · authority',message:'Your team shared a new workspace invitation. Review the invitation to continue.',domain:'cloudwren.example',title:'Your team is waiting.',description:'A workplace invitation borrows trust from an existing relationship.'},
    payroll: {name:'Payroll notice',brand:'PeopleHarbour',tag:'Authority · urgency',message:'Your monthly payroll summary is ready. Review the notice before the next payroll cycle.',domain:'peopleharbour.example',title:'One place for your payroll.',description:'A financial context makes an ordinary notification feel important.'}
  };
  const state = {stage:0,country:0,scenario:'parcel',reserved:false,delivered:false,opened:false,visited:false,submitted:false,reported:false,resolved:false,screen:'home',tab:'activity',events:[]};
  let timer;
  const $ = selector => root.querySelector(selector);
  const country = () => countries[state.country];
  const scenario = () => scenarios[state.scenario];
  const number = () => country()[3] + ' ••• •• 0142';
  const status = () => state.resolved ? 'Resolved' : state.reported ? 'Reported' : state.submitted ? 'Interaction recorded' : state.visited ? 'Link opened' : state.opened ? 'SMS read' : state.delivered ? 'SMS delivered' : state.reserved ? 'Ready to deliver' : 'Awaiting setup';
  const icons = {message:'<path d="M4 4h16v12H8l-4 4V4Z"/><path d="M8 8h8M8 12h5"/>',shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>'};
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
  root.innerHTML = `
    <header class="tl-top"><div><strong>Antercept</strong><span>/ guided demo</span></div><span class="tl-local"><i></i> Sample data</span></header>
    <nav class="tg-steps" aria-label="Demo steps"><span data-guide-step="0">01 <b>Choose a message</b></span><span data-guide-step="1">02 <b>Try it on the phone</b></span><span data-guide-step="2">03 <b>Understand the result</b></span></nav>
    <div class="tl-title"><div><p class="tl-kicker" data-guide-kicker></p><h3 tabindex="-1" data-guide-heading></h3><p data-guide-intro></p></div><button type="button" class="tl-btn" data-action="reset">↺ Start again</button></div>
    <div class="tl-grid">
      <section class="tl-setup" aria-label="Choose a sample message">
        <div><label class="tl-label" for="tl-scenario">What kind of message?</label><select id="tl-scenario"><option value="parcel">A delivery update</option><option value="workspace">A workspace invitation</option><option value="payroll">A payroll notice</option></select>
        <details class="tg-country"><summary>Change country <span data-country-name></span></summary><label class="tl-label" for="tl-country-search">Find a country</label><input id="tl-country-search" class="tl-search" type="search" placeholder="Country or dial code" autocomplete="off"/><div class="tl-countries" aria-label="Countries"></div></details>
        <div class="tl-number"><span class="tl-kicker">FICTIONAL RECIPIENT / MIRA</span><strong data-number></strong><span data-reservation></span></div></div>
        <div class="tg-message-card"><span class="tl-kicker">MESSAGE PREVIEW</span><div class="tl-preview"><strong data-brand></strong><p data-message></p><span class="tl-tags" data-tags></span></div><button type="button" class="tl-btn tl-primary" data-action="deliver">Show it on the phone →</button><p class="tl-hint">This only delivers to the simulated phone below.</p></div>
      </section>
      <section class="tl-device-stage" aria-label="Interactive target phone"><div class="tl-device-label"><span class="tl-kicker">MIRA’S PHONE</span><span>Pixel-style · Android</span></div>
        <div class="tl-phone"><div class="tl-camera" aria-hidden="true"></div><div class="tl-phone-status"><span>09:41</span><span aria-label="Full signal, Wi-Fi, battery 92 percent">▂▄▆ · ◒ ▰</span></div><div class="tl-screen"></div><button type="button" class="tl-home" data-action="home" aria-label="Phone home"><span></span></button></div>
        <p class="tl-device-hint" data-phone-hint>Open the notification to read the message.</p>
      </section>
      <aside class="tg-coach"><p class="tl-kicker">YOU’RE THE RECIPIENT</p><h4 data-coach-title></h4><p data-coach-copy></p><div class="tg-clue"><strong>Something to notice</strong><p data-coach-clue></p></div><button type="button" class="tl-btn tl-primary" data-action="result" disabled>See what happened →</button><p class="tl-hint" data-result-hint></p></aside>
      <section class="tl-inspector" aria-label="Exercise result"><div class="tl-session"><span class="tl-kicker">SAMPLE RESULT</span><div><strong data-session-status></strong><i></i></div><span data-session-location></span></div><div class="tl-detail"></div><button type="button" class="tl-btn tl-resolve" data-action="resolve" disabled>Finish the exercise</button><button type="button" class="tl-btn" data-action="return">← Back to the phone</button></section>
    </div>
    <footer class="tl-foot"><span>${icon('shield')} Fictional exercise · no real messages sent</span><span data-live role="status" aria-live="polite">Choose a sample message to begin.</span></footer>`;

  function event(title,detail) {
    state.events.push({title,detail,time:'+'+String(state.events.length*3).padStart(2,'0')+'s'});
    $('[data-live]').textContent = title + '. ' + detail;
  }
  function reset(keepCountry=true) {
    clearTimeout(timer);
    Object.assign(state,{stage:0,country:keepCountry?state.country:0,reserved:false,delivered:false,opened:false,visited:false,submitted:false,reported:false,resolved:false,screen:'home',events:[]});
    $('[data-live]').textContent='Choose a message and try another path.';
    render();
  }
  function renderCountries() {
    const query=$('.tl-search').value.toLowerCase().trim();
    const list=$('.tl-countries'); list.replaceChildren();
    countries.forEach((c,i)=>{
      if(!(c[2]+' '+c[3]).toLowerCase().includes(query))return;
      const button=document.createElement('button');button.type='button';button.className='tl-country';button.dataset.country=c[0];button.setAttribute('aria-pressed',String(i===state.country));
      button.innerHTML=`<span aria-hidden="true">${c[1]}</span><span>${c[2]}</span><small>${c[3]}</small>`;
      button.addEventListener('click',()=>{state.country=i;reset();$('[data-country="'+c[0]+'"]').focus({preventScroll:true});});list.appendChild(button);
    });
    if(!list.children.length)list.textContent='No matching countries.';
  }
  function phone() {
    const s=scenario();let content='';
    if(state.screen==='home') {
      content=`<div class="tl-lock-date">Thursday, 15 October</div><div class="tl-clock">09<span>41</span></div><div class="tl-weather">☀ &nbsp; A little room to pause.</div>`;
      if(state.delivered) content+=`<button type="button" class="tl-notification" data-action="read"><span class="tl-notification-top">${icon('message')} Messages <small>now</small></span><strong>${s.brand}</strong><span>${s.message}</span><small>Tap to open message ↗</small></button>`;
      else content+='<div class="tl-phone-idle">Your next decision<br/>starts with a message.</div>';
      content+=`<div class="tl-dock"><button type="button" data-action="messages" aria-label="Open messages">${icon('message')}</button><button type="button" data-action="browser" aria-label="Open browser">${icon('globe')}</button><button type="button" data-action="safety" aria-label="Open safety centre">${icon('shield')}</button></div>`;
    } else if(state.screen==='messages') {
      content=`<div class="tl-app-heading"><button type="button" data-action="home" aria-label="Back to phone home">‹</button><span class="tl-avatar">${s.brand[0]}</span><div><strong>${s.brand}</strong><small>Sample business sender</small></div></div><p class="tl-message-date">Today · 09:41</p>`;
      if(state.delivered)content+=`<div class="tl-bubble">${s.message}<button type="button" class="tl-sms-link" data-action="visit" ${state.reported||state.resolved?'disabled':''}>${s.domain}/review ↗</button></div><p class="tl-sms-meta">SMS · Fictional training message</p><button type="button" class="tl-report" data-action="report" ${state.reported||state.resolved?'disabled':''}>${icon('shield')}${state.reported?'Message reported':'Report suspicious message'}</button><div class="tl-phone-tip"><strong>What would you do?</strong><p>Open the sample link to explore the journey, or report the message to security.</p></div>`;
      else content+='<div class="tl-phone-tip"><strong>No messages yet</strong><p>Choose a sample message to start the exercise.</p></div>';
    } else if(state.screen==='browser') {
      content=`<div class="tl-browser-bar">${icon('globe')} ${state.visited?s.domain:'Training browser'}</div><div class="tl-web-page"><span class="tl-web-mark">${s.brand[0]}</span><span class="tl-kicker">${s.brand}</span><h4>${state.visited?s.title:'A safe place to explore.'}</h4><p>${state.visited?s.description:'Open the link in your sample SMS to preview the landing-page journey.'}</p>`;
      if(state.visited) content+=`<div class="tl-fake-field">mira@kestrel.example <span>DEMO</span></div><button type="button" class="tl-web-button" data-action="submit" ${state.submitted||state.resolved?'disabled':''}>${state.submitted?'Sample interaction recorded ✓':'Continue with sample identity'}</button><p class="tl-web-note">No credentials requested or collected.</p><button type="button" class="tl-report" data-action="report" ${state.reported||state.resolved?'disabled':''}>Report this page</button>`;
      content+='</div>';
    } else {
      content=`<div class="tl-safety">${icon('shield')}<h4>${state.reported?'Good catch.':'Pause. Check. Decide.'}</h4><p>${state.reported?'The sample message is flagged. Its event history stays available to the operator.':'Verify an unexpected request through a channel you already trust. A familiar brand is not proof of a trusted sender.'}</p><button type="button" class="tl-web-button" data-action="messages">Back to messages</button></div>`;
    }
    $('.tl-screen').innerHTML=content;
    $('.tl-phone').dataset.screen=state.screen;
  }
  function inspector() {
    $('[data-session-status]').textContent=state.resolved?'Exercise finished':state.reported?'You reported the message':state.submitted?'You continued on the sample page':state.visited?'You opened the link':'You read the message';
    $('[data-session-location]').textContent=scenario().name+' · '+country()[2]+' · '+number();
    const explanation=state.reported?(state.visited?'You followed the link, then reported the message. Both actions remain in the result; reporting does not erase the earlier visit.':'You flagged the message instead of following its link. The team can use this as an example of recognising a suspicious request.') : state.submitted?'You followed the link and continued with a fictional identity. In a real exercise, the team would review what made the request feel convincing.':'You followed a link in the sample text. This shows an interaction, not proof that a device was infected or an account was compromised.';
    $('.tl-detail').innerHTML=`<div class="tg-result-copy"><div><h4>What this means</h4><p>${explanation}</p></div><div class="tg-clue"><h4>What to learn from it</h4><p>${scenario().description} Before acting on an unexpected request, check it through a channel you already trust.</p></div><p class="tl-insight-note">This demo records only your choices here. It cannot tell whether a real device is infected, and it does not assess a person’s security skills from one click.</p></div><details class="tg-history"><summary>See the actions taken (${state.events.length})</summary><ol class="tl-timeline">${state.events.map(e=>`<li><span>${e.time}</span><div><strong>${e.title}</strong><p>${e.detail}</p></div></li>`).join('')}</ol></details>`;
    $('[data-action="resolve"]').disabled=state.resolved||!state.delivered;
    $('[data-action="resolve"]').textContent=state.resolved?'Exercise finished ✓':'Finish the exercise';
  }
  function guide() {
    root.dataset.stage=state.stage;
    const titles=['Choose a message to try.','What would you do?','Here’s what happened.'];
    const intros=['Pick a scenario. You can change the sample country if you like.','Tap the notification on the phone. Open the sample link or report the message.','A short explanation of your choices, and a useful lesson to take away.'];
    $('[data-guide-heading]').textContent=titles[state.stage];
    $('[data-guide-kicker]').textContent='STEP 0'+(state.stage+1)+' / GUIDED EXERCISE';
    $('[data-guide-intro]').textContent=intros[state.stage];
    root.querySelectorAll('[data-guide-step]').forEach(n=>{if(Number(n.dataset.guideStep)===state.stage)n.setAttribute('aria-current','step');else n.removeAttribute('aria-current');});
    const ready=state.reported||state.visited;
    $('[data-action="result"]').disabled=!ready;
    $('[data-coach-title]').textContent=state.reported?'You spotted something suspicious.':state.submitted?'You continued on the page.':state.visited?'You followed the link.':'A message just arrived.';
    $('[data-coach-copy]').textContent=ready?'You can review the result now, or keep exploring the sample phone.':'Read the message, then decide: would you open its link, or report it to the security team? Both paths work in this demo.';
    $('[data-coach-clue]').textContent=scenario().description;
    $('[data-result-hint]').textContent=ready?'Your choices are ready to review.':'Open a link or report the message to continue.';
  }
  function render() {
    renderCountries();
    $('[data-number]').textContent=number();
    $('[data-reservation]').textContent='Masked sample number · no real recipient';
    $('[data-country-name]').textContent=country()[1]+' '+country()[2];
    $('[data-brand]').textContent=scenario().brand+' / SMS';
    $('[data-message]').textContent=scenario().message;
    $('[data-tags]').textContent=scenario().tag;
    const button=$('[data-action="deliver"]');button.disabled=state.delivered;
    button.textContent=state.delivered?'Message ready ✓':'Show it on the phone →';
    $('#tl-scenario').value=state.scenario;
    $('[data-phone-hint]').textContent=state.resolved?'Exercise finished. Start again to try another path.':state.reported||state.visited?'Ready when you are: choose “See what happened” to review your choices.':'Tap the notification, then decide what you would do.';
    phone();inspector();guide();
  }
  function openMessages() {
    state.screen='messages';
    if(state.delivered&&!state.opened&&!state.resolved) {state.opened=true;event('Message read','You read the sample message.');}
  }
  root.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button||button.disabled)return;
    const action=button.dataset.action;
    if(action==='reset'){reset();$('[data-guide-heading]').focus();return;}
    if(action==='result'&&(state.visited||state.reported)){state.stage=2;render();$('[data-guide-heading]').focus();return;}
    if(action==='return'){state.stage=1;render();$('[data-guide-heading]').focus();return;}
    if(action==='deliver') {
      button.disabled=true;button.textContent='Preparing the sample…';
      timer=setTimeout(()=>{state.reserved=true;state.delivered=true;state.stage=1;state.screen='home';event('Sample text delivered',scenario().brand+' → '+number());render();$('[data-guide-heading]').focus();},350);
      return;
    } else if(action==='read'||action==='messages')openMessages();
    else if(action==='home')state.screen='home';
    else if(action==='browser')state.screen='browser';
    else if(action==='safety')state.screen='safety';
    else if(action==='visit'&&state.delivered&&!state.reported&&!state.resolved){state.screen='browser';if(!state.visited){state.visited=true;event('Training link opened','You opened the fictional training page.');}}
    else if(action==='submit'&&state.visited&&!state.submitted&&!state.resolved){state.submitted=true;event('Sample interaction recorded','Demo identity only. No credentials collected.');}
    else if(action==='report'&&state.delivered&&!state.reported&&!state.resolved){state.reported=true;state.screen='safety';event('Reported to security','You flagged the sample message as suspicious.');}
    else if(action==='resolve'&&(state.reported||state.visited)&&!state.resolved){state.resolved=true;event('Exercise finished','Your choices are preserved in this sample result.');}
    else return;
    // Update in place around the phone; restore focus if its screen was replaced.
    const wasPhone=Boolean(button.closest('.tl-phone'));render();
    if(wasPhone){const next=$('.tl-screen button:not(:disabled)')||$('.tl-home');next.focus({preventScroll:true});}
  });
  $('.tl-search').addEventListener('input',renderCountries);
  $('#tl-scenario').addEventListener('change',e=>{state.scenario=e.target.value;reset();});
  root.addEventListener('keydown',()=>root.classList.add('tl-keyboard'));
  root.addEventListener('pointerdown',()=>root.classList.remove('tl-keyboard'));
  render();
})();
