/* Guided overview. Fixed fictional fixtures; no live lookups or security actions. */
(() => {
  'use strict';
  const root = document.querySelector('[data-breach-guide]');
  if (!root) return;
  const findingTypes = {
    session: {
      label:'Saved sign-in exposed', short:'A login may stay open without a password.', symbol:'↗', priority:'Review first',
      meaning:'Websites use a small file, called a session cookie, to remember a signed-in user. An exposed copy could allow someone to reuse that sign-in.',
      unknown:'The sample record has a future expiry date. That does not prove the sign-in still works; the service may already have revoked it.',
      action:'Review and revoke affected sign-ins', owner:'Account administrator',
      why:'Check the account’s active sessions and revoke the affected sign-ins. A password change alone may not end every existing session.',
      source:'Saved browser session', detail:'Cookie value: masked sample · listed expiry: 30 Nov 2026 · live validity: not checked'
    },
    password: {
      label:'Work password exposed', short:'A work login appears in a breach record.', symbol:'✳', priority:'Review next',
      meaning:'The sample record contains an employee’s work email and a saved password. Someone could try that combination on the company’s services.',
      unknown:'The record does not tell us whether this is the employee’s current password, or whether anyone has used it.',
      action:'Review and reset the affected password', owner:'Account administrator',
      why:'Confirm the exposure with the account owner, reset the affected password, and review the account’s sign-in protection.',
      source:'Saved browser login', detail:'Password: masked sample · account ownership: sample fixture · current validity: not checked'
    },
    device: {
      label:'Computer needs review', short:'The leaked records point to the same computer.', symbol:'▣', priority:'Review next',
      meaning:'A device record connects the exposed account data to one computer. This gives the security team a place to investigate how the data was taken.',
      unknown:'A historical device record does not prove the computer is currently infected. Its current condition needs a separate check.',
      action:'Ask IT to inspect the affected computer', owner:'IT / endpoint team',
      why:'Review the device for signs of malware and confirm it is safe before relying on it for new sign-ins.',
      source:'Device record associated with the leak', detail:'Operating system: Windows 11 · current endpoint condition: unknown'
    }
  };
  const companies = [
    {id:'kestrel',name:'Kestrel Works',domain:'kestrel.example',initial:'K',description:'A small team with a few findings to review.',records:[
      {id:'KW-01',type:'session',name:'Maya Ellis',email:'maya@kestrel.example',device:'KES-LAPTOP-04',service:'Work email'},
      {id:'KW-02',type:'password',name:'Jules Morgan',email:'jules@kestrel.example',device:'KES-LAPTOP-09',service:'Company portal'},
      {id:'KW-03',type:'device',name:'Maya Ellis',email:'maya@kestrel.example',device:'KES-LAPTOP-04',service:'Work computer'}
    ]},
    {id:'harbor',name:'Harbor Studio',domain:'harbor.example',initial:'H',description:'One employee, two related findings.',records:[
      {id:'HS-01',type:'password',name:'Alex Rowan',email:'alex@harbor.example',device:'HAR-DESKTOP-02',service:'Company portal'},
      {id:'HS-02',type:'device',name:'Alex Rowan',email:'alex@harbor.example',device:'HAR-DESKTOP-02',service:'Work computer'}
    ]},
    {id:'northstar',name:'Northstar Labs',domain:'northstar.example',initial:'N',description:'An example with no matching records.',records:[]}
  ];
  const personal = {id:'personal',name:'Maya’s personal check',domain:'maya@personal.example',initial:'M',description:'A fictional email with two personal-data findings.',personal:true,records:[
    {id:'P-01',type:'contact',name:'Maya Ellis',email:'maya@personal.example',device:'Not identified',service:'Personal contact details'},
    {id:'P-02',type:'password',name:'Maya Ellis',email:'maya@personal.example',device:'Not identified',service:'Personal account'}
  ]};
  findingTypes.contact={label:'Contact details in a dark-web listing',short:'An email and masked phone number appear together.',symbol:'@',priority:'Review the source',meaning:'This fictional example shows personal contact details listed in a dark-web source. Exposed details could be used to make unwanted messages or scams more convincing.',unknown:'A listing does not prove anyone has accessed your accounts. Its accuracy, origin and age still need to be checked.',action:'Review the exposed contact details',owner:'You',why:'Check which details were exposed and be cautious with unexpected requests that mention them. Verify requests through a channel you already trust.',source:'Illustrative dark-web listing',detail:'Fictional source DW-DEMO-01 · email: maya@personal.example · phone: ••• •• 0142 · no live lookup performed'};
  function finding(record) {
    const original=findingTypes[record.type];
    if(!company.personal||record.type!=='password')return original;
    return {...original,label:'Personal password exposed',short:'A personal login appears in a breach record.',meaning:'A fictional breach record contains your email and a saved password for a personal account. Someone could try that combination to sign in.',unknown:'This sample does not tell us whether the password is current or whether anyone has used it.',owner:'You',action:'Change the affected account password',why:'Open the service directly, change the affected password, and check whether you reused it elsewhere. Review your sign-in protection.',source:'Illustrative personal-account breach'};
  }
  let audience='personal';
  let company=personal,step=0,furthest=0,selected=0,included=new Set(),reviewed=new Set();
  const plural=(n,one,many=one+'s')=>n+' '+(n===1?one:many);
  root.innerHTML=`<header class="bg-top"><span class="bg-brand">${BFUI.logo()} breachify <span>/ guided demo</span></span><span class="bg-sample">Sample data</span></header><div class="bg-workspace"><nav class="bg-progress" aria-label="Demo steps"></nav><div class="bg-main"><div class="bg-content"></div><footer class="bg-bottom"><span data-guide-status role="status" aria-live="polite">Choose a personal or company example to get started.</span><button type="button" data-guide-action="restart">Start again ↺</button></footer></div></div>`;
  const $=s=>root.querySelector(s);
  function announce(text){$('[data-guide-status]').textContent=text;}
  function render(focus=false){
    $('.bg-progress').innerHTML=['Choose an example','Understand the findings','Prepare a plan'].map((name,i)=>`<button type="button" data-guide-step="${i}" ${i>furthest?'disabled':''} ${step===i?'aria-current="step"':''}><span class="bg-nav-icon">${BFUI.icon(['building','globe','fileSearch'][i])}</span><span><small>STEP ${String(i+1).padStart(2,'0')}</small>${name}</span>${i<step?'<b aria-hidden="true">✓</b>':''}</button>`).join('');
    $('.bg-content').innerHTML=step===0?choose():step===1?findings():plan();
    if(focus)$('.bg-heading').focus();
  }
  function choose(){return `<div class="bg-intro"><p class="bg-kicker">STEP 01 / A PLACE TO START</p><h3 class="bg-heading" tabindex="-1">Whose accounts are we checking?</h3><p>${audience==='personal'?'A personal plan checks your own data. Try a fictional email to see what a finding could look like.':'A company plan checks accounts across your organisation’s domain. Choose a sample company.'}</p></div><div class="bg-audience" role="group" aria-label="Plan type"><button type="button" data-audience="personal" aria-pressed="${audience==='personal'}">Personal plan</button><button type="button" data-audience="company" aria-pressed="${audience==='company'}">Company plan</button></div><div class="bg-company-grid">${(audience==='personal'?[personal]:companies).map(c=>`<button type="button" class="bg-company" data-company="${c.id}" aria-pressed="${company.id===c.id}"><span class="bg-company-icon">${c.initial}</span><span class="bg-company-title">${c.name}<small>${c.domain}</small></span><span class="bg-radio" aria-hidden="true"></span><span class="bg-company-description">${c.description}</span></button>`).join('')}</div><div class="bg-start-row"><p>${audience==='personal'?'<strong>Your own data, explained.</strong> This example uses a fictional email. No personal details are required.':'<strong>What’s a domain?</strong> For maya@kestrel.example, it’s <span>kestrel.example</span>.'}</p><button type="button" class="bg-primary" data-guide-action="show">Show sample findings <span aria-hidden="true">→</span></button></div>`;}
  function findings(){
    const count=company.records.length,people=new Set(company.records.map(r=>r.email)).size;
    if(!count)return `<div class="bg-empty"><span class="bg-empty-symbol" aria-hidden="true">✓</span><p class="bg-kicker">${company.domain}</p><h3 class="bg-heading" tabindex="-1">No matches in this sample.</h3><p>There are no breach records for ${company.name} in this demo dataset. That does not guarantee a company has never been exposed.</p><div class="bg-empty-note"><strong>No match ≠ no risk</strong><p>A real lookup only covers the records available to the service. New or undiscovered leaks may not appear.</p></div><button type="button" class="bg-primary" data-guide-action="another">Try another example →</button></div>`;
    const r=company.records[selected],f=finding(r);
    return `<div class="bg-result-head"><div><p class="bg-kicker">${company.domain} / SAMPLE RESULTS</p><h3 class="bg-heading" tabindex="-1">${plural(count,'finding')} worth a closer look.</h3><p>${company.personal?'Your sample email appears in '+plural(count,'record')+'.':plural(people,'employee')+' affected in this example.'} Select a finding to see what it means.</p></div><span class="bg-count"><b>${String(count).padStart(2,'0')}</b>findings</span></div><div class="bg-metrics" aria-label="Sample investigation totals"><div><span>Findings to review</span><strong>${count}</strong></div><div><span>${company.personal?'Email addresses checked':'Employees affected'}</span><strong>${people}</strong></div><div><span>${company.personal?'Dark-web source examples':'Computers in the records'}</span><strong>${company.personal?company.records.filter(record=>record.type==='contact').length:new Set(company.records.map(record=>record.device)).size}</strong></div></div><div class="bg-findings"><div class="bg-finding-list" aria-label="Sample findings">${company.records.map((record,i)=>{const type=finding(record);return `<button type="button" class="bg-finding" data-finding="${i}" aria-pressed="${selected===i}" aria-controls="bg-explanation"><span class="bg-finding-symbol" aria-hidden="true">${type.symbol}</span><span><small>${record.name} · ${type.priority}</small><strong>${type.label}</strong><span>${type.short}</span></span><b aria-hidden="true">${reviewed.has(record.id)?'✓':'↗'}</b></button>`;}).join('')}<p class="bg-list-hint">Related findings can come from the same account or device. They aren’t necessarily separate incidents.</p></div><section id="bg-explanation" class="bg-explanation" aria-label="Finding explained"><div class="bg-evidence-label"><span>${f.priority}</span><small>${r.id} · fictional evidence</small></div><h4>${f.label}</h4><p class="bg-person">${r.name} / ${r.service}</p><div class="bg-meaning"><h5>What this means</h5><p>${f.meaning}</p></div><div class="bg-next"><h5>Where to start</h5><p>${f.why}</p></div><p class="bg-unknown"><strong>Still unknown:</strong> ${f.unknown}</p><details class="bg-source"><summary>See the sample evidence</summary><dl><div><dt>Account</dt><dd>${r.email}</dd></div><div><dt>Computer</dt><dd>${r.device}</dd></div><div><dt>Source</dt><dd>${f.source}</dd></div></dl><p>${f.detail}</p></details></section></div><div class="bg-navigation"><button type="button" class="bg-secondary" data-guide-action="back">← Change example</button><span>Next: turn the findings into a checklist.</span><button type="button" class="bg-primary" data-guide-action="plan">Prepare a response plan →</button></div>`;
  }
  function plan(){return `<div class="bg-intro"><p class="bg-kicker">STEP 03 / ${company.domain}</p><h3 class="bg-heading" tabindex="-1">${company.personal?'Know what you can do next.':'Give the team a clear starting point.'}</h3><p>Choose what to include in your plan. These are suggested actions to review—not completed fixes.</p></div><div class="bg-plan-grid"><div class="bg-action-list">${company.records.map(r=>{const f=finding(r);return `<label class="bg-action"><input type="checkbox" data-include="${r.id}" ${included.has(r.id)?'checked':''}/><span><strong>${f.action}</strong><span>${r.name} · ${r.type==='device'?r.device:r.email}</span><small>For: ${f.owner} · evidence ${r.id}</small></span></label>`;}).join('')}</div><aside class="bg-handover"><span class="bg-kicker">${company.personal?'YOUR PERSONAL PLAN':'YOUR HANDOVER'}</span><h4>${company.name}</h4><p data-plan-count>${plural(included.size,'action')} selected</p><ul><li>Who and what was affected</li><li>Suggested follow-up and owner</li><li>Evidence references and unknowns</li></ul><button type="button" class="bg-primary" data-guide-action="download" ${!included.size?'disabled':''}>Download the sample plan ↓</button><span class="bg-download-note">Text file · fictional data only</span></aside></div><div class="bg-plan-note"><strong>A plan is not a fix.</strong><p>This demo does not reset passwords, revoke sessions or inspect computers. Carry out any real changes through the relevant service or your security team.</p></div><div class="bg-navigation"><button type="button" class="bg-secondary" data-guide-action="results">← Review the findings</button><button type="button" class="bg-secondary" data-guide-action="another">Try another example ↗</button></div>`;}
  function startOver(){audience='personal';company=personal;step=furthest=selected=0;included=new Set();reviewed=new Set();render(true);announce('Demo reset. Choose a personal or company example.');}
  function save(){
    const rows=company.records.filter(r=>included.has(r.id));
    if(!rows.length)return;
    const output=['# Sample data — Breachify response plan','Fictional design demonstration. No live security checks or fixes performed.','',company.name+' / '+company.domain,'',...rows.flatMap((r,i)=>{const f=finding(r);return [(i+1)+'. '+f.action,'Suggested owner: '+f.owner,'Account: '+r.email,'Computer: '+r.device,'Finding: '+f.label,'Evidence: '+r.id+' / '+f.source,'Next step: '+f.why,'Unknown: '+f.unknown,'Status: proposed, not completed',''];})].join('\n');
    const url=URL.createObjectURL(new Blob([output],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='breachify-'+company.id+'-sample-plan.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    announce('Sample plan downloaded. '+plural(rows.length,'proposed action')+' included; no real security changes made.');
  }
  function setAudience(value) {
    audience=value;company=audience==='personal'?personal:companies[0];step=furthest=selected=0;included=new Set();reviewed=new Set();render();
    $('[data-audience="'+audience+'"]').focus({preventScroll:true});announce((audience==='personal'?'Personal':'Company')+' example selected.');
  }
  document.querySelectorAll('[data-demo-audience]').forEach(link=>link.addEventListener('click',()=>setAudience(link.dataset.demoAudience)));
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.audience){setAudience(b.dataset.audience);return;}
    if(b.dataset.company){company=[personal,...companies].find(c=>c.id===b.dataset.company);included=new Set();reviewed=new Set();furthest=0;render();$('[data-company="'+company.id+'"]').focus({preventScroll:true});announce(company.name+' selected. Show sample findings to continue.');return;}
    if(b.dataset.finding!==undefined){selected=Number(b.dataset.finding);reviewed.add(company.records[selected].id);render();$('[data-finding="'+selected+'"]').focus({preventScroll:true});announce(finding(company.records[selected]).label+' selected. Explanation updated.');return;}
    if(b.dataset.guideStep!==undefined){step=Number(b.dataset.guideStep);render(true);return;}
    switch(b.dataset.guideAction){
      case 'show':step=furthest=1;selected=0;included=new Set(company.records.map(r=>r.id));reviewed=new Set(company.records.length?[company.records[0].id]:[]);announce(plural(company.records.length,'sample finding')+' for '+company.name+'.');break;
      case 'back':case 'another':step=0;announce('Choose a personal or company example.');break;
      case 'results':step=1;break;
      case 'plan':if(!company.records.length)return;step=furthest=2;announce('Response plan ready to review. Choose the actions to include.');break;
      case 'download':save();return;
      case 'restart':startOver();return;
      default:return;
    }
    render(true);
  });
  root.addEventListener('change',e=>{
    const id=e.target.dataset.include;if(!id)return;
    if(e.target.checked)included.add(id);else included.delete(id);
    $('[data-plan-count]').textContent=plural(included.size,'action')+' selected';
    $('[data-guide-action="download"]').disabled=!included.size;
    announce(plural(included.size,'action')+' selected for the sample plan.');
  });
  render();
})();
