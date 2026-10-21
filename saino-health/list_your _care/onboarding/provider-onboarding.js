(function(){
 const file=(location.pathname.split('/').pop()||'').toLowerCase();
 const steps=[['organization-details.html','Organization'],['provider-details.html','Plan'],['legal-agreement.html','Documents'],['bank-details.html','Payment'],['check-submit.html','Review']];
 const idx=Math.max(0,steps.findIndex(s=>s[0]===file));
 const mount=document.querySelector('.main')||document.querySelector('main');
 if(!mount)return;
 const wrap=document.createElement('section');wrap.className='provider-flow-bar';
 const top=document.createElement('div');top.className='provider-flow-top';
 top.innerHTML='<div><div class="provider-flow-title">SAINO Provider Onboarding</div><div class="provider-flow-status">Complete your listing once — SAINO will review it before publishing.</div></div><div class="provider-flow-status">Step '+(idx+1)+' of '+steps.length+'</div>';
 const row=document.createElement('div');row.className='provider-flow-steps';
 steps.forEach((s,i)=>{const a=document.createElement('a');a.className='provider-flow-step '+(i===idx?'active ':'')+(i<idx?'done':'');a.href=s[0];a.innerHTML='<span class="provider-flow-dot">'+(i<idx?'✓':i+1)+'</span><span>'+s[1]+'</span>';row.appendChild(a)});
 wrap.append(top,row);mount.prepend(wrap);
 const plan=localStorage.getItem('selectedPlanName');
 if(plan){const note=document.createElement('div');note.className='onboarding-note';note.innerHTML='<strong>Selected plan:</strong> '+plan+' <span style="float:right">'+(localStorage.getItem('selectedPlanPrice')||'')+'</span>';mount.insertBefore(note,wrap.nextSibling)}
})();
