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
  const state = {country:0,scenario:'parcel',reserved:false,delivered:false,opened:false,visited:false,submitted:false,reported:false,resolved:false,screen:'home',tab:'activity',events:[]};
  let timer;
  const $ = selector => root.querySelector(selector);
  const country = () => countries[state.country];
  const scenario = () => scenarios[state.scenario];
  const number = () => country()[3] + ' ••• •• 0142';
  const status = () => state.resolved ? 'Resolved' : state.reported ? 'Reported' : state.submitted ? 'Interaction recorded' : state.visited ? 'Link opened' : state.opened ? 'SMS read' : state.delivered ? 'SMS delivered' : state.reserved ? 'Ready to deliver' : 'Awaiting setup';
  const icons = {message:'<path d="M4 4h16v12H8l-4 4V4Z"/><path d="M8 8h8M8 12h5"/>',shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>'};
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
  root.innerHTML = `
    <header class="tl-top"><div><img src="../assets/antercept/mark.svg" alt=""/><strong>antercept</strong><span class="tl-divider">/</span><span>Target lab</span></div><span class="tl-local"><i></i> Local simulation</span></header>
    <div class="tl-title"><div><p class="tl-kicker">OPERATION / A-0142</p><h3>On the other side of the message.</h3><p>Set up the exercise. Pick up the phone. Follow the evidence.</p></div><button type="button" class="tl-btn" data-action="reset">↺ Reset exercise</button></div>
    <div class="tl-grid">
      <section class="tl-setup" aria-label="Exercise setup"><div class="tl-panel-title"><span>01</span><h4>Prepare the message</h4></div>
        <label class="tl-label" for="tl-country-search">SMS destination</label><input id="tl-country-search" class="tl-search" type="search" placeholder="Search country or dial code" autocomplete="off"/>
        <div class="tl-countries" aria-label="Countries"></div>
        <div class="tl-number"><span class="tl-kicker">SAMPLE NUMBER</span><strong data-number></strong><span data-reservation>Choose a country to begin</span></div>
        <label class="tl-label" for="tl-scenario">Awareness scenario</label><select id="tl-scenario"><option value="parcel">Parcel update</option><option value="workspace">Workspace invitation</option><option value="payroll">Payroll notice</option></select>
        <div class="tl-preview"><span class="tl-kicker" data-brand></span><p data-message></p><span class="tl-tags" data-tags></span></div>
        <button type="button" class="tl-btn tl-primary" data-action="deliver">Reserve sample number</button><p class="tl-hint">Masked demo numbers. No messages leave this page.</p>
      </section>
      <section class="tl-device-stage" aria-label="Interactive target phone"><div class="tl-device-label"><span class="tl-kicker">02 / TARGET DEVICE</span><span>Pixel-style · Android</span></div>
        <div class="tl-phone"><div class="tl-camera" aria-hidden="true"></div><div class="tl-phone-status"><span>09:41</span><span aria-label="Full signal, Wi-Fi, battery 92 percent">▂▄▆ · ◒ ▰</span></div><div class="tl-screen"></div><button type="button" class="tl-home" data-action="home" aria-label="Phone home"><span></span></button></div>
        <p class="tl-device-hint" data-phone-hint>Deliver a sample SMS to bring the phone to life.</p>
      </section>
      <section class="tl-inspector" aria-label="Session inspector"><div class="tl-panel-title"><span>03</span><h4>Read the signals</h4></div>
        <div class="tl-session"><span class="tl-kicker">TARGET / MIRA FENWICK</span><div><strong data-session-status></strong><i></i></div><span data-session-location></span></div>
        <div class="tl-tabs" role="tablist" aria-label="Session information"><button type="button" role="tab" id="tl-tab-activity" aria-controls="tl-detail" data-tab="activity">Activity</button><button type="button" role="tab" id="tl-tab-device" aria-controls="tl-detail" data-tab="device">Device</button><button type="button" role="tab" id="tl-tab-insight" aria-controls="tl-detail" data-tab="insight">AI insight</button></div>
        <div id="tl-detail" role="tabpanel" class="tl-detail"></div>
        <button type="button" class="tl-btn tl-resolve" data-action="resolve" disabled>Resolve exercise</button>
      </section>
    </div>
    <footer class="tl-foot"><span>${icon('shield')} Fictional identity · simulated device & location</span><span data-live role="status" aria-live="polite">Start by reserving a sample number.</span></footer>`;

  function event(title,detail) {
    state.events.push({title,detail,time:'+'+String(state.events.length*3).padStart(2,'0')+'s'});
    $('[data-live]').textContent = title + '. ' + detail;
  }
  function reset(keepCountry=true) {
    clearTimeout(timer);
    Object.assign(state,{country:keepCountry?state.country:0,reserved:false,delivered:false,opened:false,visited:false,submitted:false,reported:false,resolved:false,screen:'home',events:[]});
    $('[data-live]').textContent='New exercise ready. Reserve a sample number.';
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
      else content+='<div class="tl-phone-tip"><strong>No messages yet</strong><p>Reserve a sample number, then deliver an SMS from the setup panel.</p></div>';
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
    $('[data-session-status]').textContent=status();
    $('[data-session-location]').textContent=country()[1]+' '+country()[4]+' · '+number();
    root.querySelectorAll('[data-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.tab===state.tab));b.tabIndex=b.dataset.tab===state.tab?0:-1;});
    const panel=$('.tl-detail');panel.setAttribute('aria-labelledby','tl-tab-'+state.tab);
    if(state.tab==='activity') {
      panel.innerHTML=state.events.length?'<ol class="tl-timeline">'+state.events.map(e=>`<li><span>${e.time}</span><div><strong>${e.title}</strong><p>${e.detail}</p></div></li>`).join('')+'</ol>':`<div class="tl-empty">${icon('message')}<h4>Every interaction leaves a story.</h4><p>Delivery, message reads, link visits and reports will appear here as you use the phone.</p></div>`;
    } else if(state.tab==='device') {
      panel.innerHTML=`<div class="tl-location-art">${icon('pin')}<strong>${country()[4]}</strong><span>${country()[5]}</span><small>Illustrative office location</small></div><dl class="tl-facts"><div><dt>Device</dt><dd>Pixel-style / Android</dd></div><div><dt>Network</dt><dd>${country()[2]} · demo route</dd></div><div><dt>Sample IP</dt><dd>192.0.2.${state.country+10}</dd></div><div><dt>Session</dt><dd>${state.visited?'DEMO-0142':'Not started'}</dd></div><div><dt>Endpoint status</dt><dd>No endpoint telemetry</dd></div></dl><p class="tl-insight-note">Preset demo data. Location is not read from your browser or inferred from the SMS country code.</p>`;
    } else {
      const risk=state.reported?'Review complete':state.submitted?'Review recommended':state.visited?'Interaction detected':'Awaiting interaction';
      panel.innerHTML=`<div class="tl-ai-label">✦ PROPOSED AI ASSISTANT</div><h4 class="tl-ai-title">${risk}</h4><p class="tl-ai-copy">${state.reported?'The target reported the exercise. Preserve the earlier events and include the recognised cues in the debrief.':state.submitted?'A sample identity was used on the training page. Prioritise the session for review; this does not establish an endpoint infection.':state.visited?'A link visit is visible. Without an endpoint signal, infection status remains unknown.':'Deliver the exercise and interact with the phone to see an evidence-based briefing.'}</p><dl class="tl-facts"><div><dt>Infection status</dt><dd>Unknown</dd></div><div><dt>Observed signals</dt><dd>${[state.opened,state.visited,state.submitted,state.reported].filter(Boolean).length} / 4</dd></div><div><dt>Message cues</dt><dd>${scenario().tag}</dd></div></dl><div class="tl-ai-next"><span class="tl-kicker">SUGGESTED NEXT STEP</span><p>${state.reported?'Close the exercise after reviewing its timeline.':state.submitted?'Review the training interaction and discuss the message cues.':'Compare the sender and destination before acting.'}</p></div><p class="tl-insight-note">Rule-based illustration of a proposed AI workflow. No model inference or infection diagnosis runs here.</p>`;
    }
    $('[data-action="resolve"]').disabled=!(state.reported||state.submitted)||state.resolved;
    $('[data-action="resolve"]').textContent=state.resolved?'Exercise resolved ✓':'Resolve exercise';
  }
  function render() {
    renderCountries();
    $('[data-number]').textContent=number();
    $('[data-reservation]').textContent=state.reserved?'Reserved for this exercise':'Masked, fictional number';
    $('[data-brand]').textContent=scenario().brand+' / SMS';
    $('[data-message]').textContent=scenario().message;
    $('[data-tags]').textContent=scenario().tag;
    const button=$('[data-action="deliver"]');button.disabled=state.delivered;
    button.textContent=state.delivered?'SMS delivered ✓':state.reserved?'Deliver sample SMS ↗':'Reserve sample number';
    $('#tl-scenario').value=state.scenario;
    $('[data-phone-hint]').textContent=state.resolved?'Exercise closed. Reset to try a different path.':state.reported?'Reported. Review the timeline, then resolve the exercise.':state.submitted?'Sample interaction recorded. Review the signals or report the page.':state.screen==='messages'&&state.delivered?'Open the sample link, or report the message.':state.visited?'Explore the sample page. Every action updates the inspector.':state.delivered?'Tap the notification. The phone is interactive.':'Deliver a sample SMS to bring the phone to life.';
    phone();inspector();
  }
  function openMessages() {
    state.screen='messages';
    if(state.delivered&&!state.opened&&!state.resolved) {state.opened=true;event('Message read','The target opened the sample SMS.');}
  }
  root.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.tab){state.tab=button.dataset.tab;inspector();return;}
    const action=button.dataset.action;
    if(action==='reset'){reset();return;}
    if(action==='deliver') {
      if(!state.reserved){state.reserved=true;event('Number reserved',country()[2]+' · '+number());}
      else {
        button.disabled=true;button.textContent='Delivering…';
        timer=setTimeout(()=>{state.delivered=true;state.screen='home';event('SMS delivered',scenario().brand+' → '+number());render();},500);
        return;
      }
    } else if(action==='read'||action==='messages')openMessages();
    else if(action==='home')state.screen='home';
    else if(action==='browser')state.screen='browser';
    else if(action==='safety')state.screen='safety';
    else if(action==='visit'&&state.delivered&&!state.reported&&!state.resolved){state.screen='browser';if(!state.visited){state.visited=true;event('Training link opened','Sample session DEMO-0142 created.');}}
    else if(action==='submit'&&state.visited&&!state.submitted&&!state.resolved){state.submitted=true;event('Sample interaction recorded','Demo identity only. No credentials collected.');}
    else if(action==='report'&&state.delivered&&!state.reported&&!state.resolved){state.reported=true;state.screen='safety';event('Reported to security','The target flagged the training message.');}
    else if(action==='resolve'&&(state.reported||state.submitted)&&!state.resolved){state.resolved=true;event('Exercise resolved','Observed events preserved for the debrief.');}
    else return;
    // Update in place around the phone; restore focus if its screen was replaced.
    const wasPhone=Boolean(button.closest('.tl-phone'));render();
    if(wasPhone){const next=$('.tl-screen button:not(:disabled)')||$('.tl-home');next.focus({preventScroll:true});}
  });
  $('.tl-search').addEventListener('input',renderCountries);
  $('#tl-scenario').addEventListener('change',e=>{state.scenario=e.target.value;reset();});
  $('.tl-tabs').addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
    const tabs=['activity','device','insight'];const i=tabs.indexOf(state.tab);
    state.tab=tabs[e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3];inspector();$('[data-tab="'+state.tab+'"]').focus();
  });
  root.addEventListener('keydown',()=>root.classList.add('tl-keyboard'));
  root.addEventListener('pointerdown',()=>root.classList.remove('tl-keyboard'));
  render();
})();
