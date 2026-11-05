'use strict';
const $ = s => document.querySelector(s);
const slides = [...document.querySelectorAll('.slide')];
const data = window.PITCH_DATA;
let current = 0;
function go(target, updateHash = true) {
 const idx = typeof target === 'number' ? Math.max(0, Math.min(slides.length - 1, target)) : slides.findIndex(s => s.id === target);
 if (idx < 0) return;
 current = idx;
 slides.forEach((s,i) => {s.hidden=i!==idx; if(i===idx) s.scrollTop=0;});
 document.querySelectorAll('.rail-button').forEach((b,i)=>{b.classList.toggle('current',i===idx); if(i===idx)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 document.querySelectorAll('#chapter-links button').forEach((b,i)=>b.classList.toggle('menu-current',i===idx));
 $('#counter').textContent=`${String(idx+1).padStart(2,'0')} / ${slides.length}`;
 $('#prev').disabled=idx===0; $('#next').disabled=idx===slides.length-1;
 document.title=`${slides[idx].dataset.name} · Clash Compass`;
 if(updateHash && location.hash.slice(1)!==slides[idx].id) history.replaceState(null,'',`#${slides[idx].id}`);
 closeMenu();
}
slides.forEach((s,i)=>{
 const b=document.createElement('button'); b.className='rail-button'; b.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>${s.dataset.name}`;b.title=`${i+1}. ${s.dataset.name}`;b.setAttribute('aria-label',b.title);b.onclick=()=>go(i);$('#rail').append(b);
 const m=document.createElement('button');m.textContent=`${String(i+1).padStart(2,'0')}  ${s.dataset.name}`;m.onclick=()=>go(i);$('#chapter-links').append(m);
});
$('#prev').onclick=()=>go(current-1);$('#next').onclick=()=>go(current+1);
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
function closeMenu(){$('#chapters').hidden=true;$('#menu-button').setAttribute('aria-expanded','false');}
$('#menu-button').onclick=()=>{const open=$('#chapters').hidden;$('#chapters').hidden=!open;$('#menu-button').setAttribute('aria-expanded',String(open));};$('#close-menu').onclick=closeMenu;
document.addEventListener('click',e=>{if(!e.target.closest('#chapters')&&!e.target.closest('#menu-button'))closeMenu();});
window.addEventListener('hashchange',()=>go(location.hash.slice(1),false));
document.addEventListener('keydown',e=>{
 if(['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(e.target.tagName)||document.querySelector('dialog[open]'))return;
 if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();go(current+1);}
 if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(current-1);}
 if(e.key==='Home'){e.preventDefault();go(0);}if(e.key==='End'){e.preventDefault();go(slides.length-1);}
 if(e.key==='Escape')closeMenu();
});
const armyCopy={inspect:['COMPOSITION','See what the army contains.','Review troop counts, spells, heroes, pets and equipment before copying the army.'],adapt:['PLAYER CONTEXT','Check the army against the village.','The player’s available units and hero loadouts help match army choices to the current village.'],use:['IN-GAME LINK','Copy a complete, legal army.','Open the published CopyArmy link in Clash of Clans, or inspect and edit the composition with the existing army tools.']};
const planCopy={progress:['PREREQUISITES','Resolve what blocks the next step.','Town Hall requirements, merged defenses, storage capacity and offensive buildings determine which upgrades can be started.'],army:['OFFENSIVE PRIORITIES','Prioritize what the player actually uses.','Selected-army troops, spells, heroes and pets inform the plan, alongside the laboratory, camps and Clan Castle. Low-value collector upgrades are not the default priority.'],war:['HERO AVAILABILITY','Plan around the fighting window.','Hero upgrade timing accounts for the player’s war schedule. The aim is to keep selected-army heroes available for league battles while other builders continue work.']};
function decisionButtons(attr,copy,target){document.querySelectorAll(`[data-${attr}]`).forEach(b=>b.onclick=()=>{document.querySelectorAll(`[data-${attr}]`).forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});const d=copy[b.dataset[attr]];$(target).innerHTML=`<span class="detail-label">${d[0]}</span><h3>${d[1]}</h3><p>${d[2]}</p>`;});}
decisionButtons('army',armyCopy,'#army-detail');decisionButtons('plan',planCopy,'#plan-detail');
function chart(){
 const metric=$('#metric-select').value;const vals=data.daily.map(r=>metric==='uniques'?r.uniq.uniques:r.sum[metric]);const max=Math.max(...vals);$('#traffic-chart').replaceChildren();
 data.daily.forEach((r,i)=>{const b=document.createElement('button');const n=vals[i];b.className='bar-button';b.style.height=`${Math.max(1.5,100*n/max)}%`;const label=`${r.dimensions.date}: ${n.toLocaleString('en-US')} ${metric==='pageViews'?'edge page views':metric==='requests'?'HTTP requests':'unique IPs'}`;b.setAttribute('aria-label',label);b.title=label;b.onclick=()=>{document.querySelectorAll('.bar-button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#chart-readout').textContent=label;};$('#traffic-chart').append(b);});
 $('#chart-readout').textContent=metric==='uniques'?'Daily unique IPs · Cloudflare':'Select a day to inspect its value.';
}
$('#metric-select').onchange=chart;chart();
const mx=Math.max(...data.research.players.map(x=>x[1]));data.research.players.forEach(([th,n])=>{const d=document.createElement('div');d.className='profile-row';d.innerHTML=`<b>TH${th}</b><div class="profile-track"><span style="width:${n/mx*100}%"></span></div><em>${n.toLocaleString('en-US')}</em>`;$('#profile-bars').append(d);});
const pv=data.posthog.rows.reduce((a,r)=>a+Number(r[1]),0);$('#client-summary').textContent=`PostHog recorded ${pv.toLocaleString('en-US')} page-view events in the bounded website query. Its day grouping uses the project timezone. The workbook provides the full daily extract.`;
const sheet='https://docs.google.com/spreadsheets/d/1yZmHWG0XMIwuAlHcrwVifeJ-Uj3hJPgJjItkuJPwblQ/edit';$('#google-sheet-link').href=sheet;$('#google-sheet-link').hidden=false;
const sources=[
 ['Product & screenshots','The web catalogs and navigation were inspected on 5 November 2026. Web captures are dated; iOS visuals are the English App Store artwork prepared on 26 October. The planning tabs explain current workflow logic rather than executing a fresh simulation.',[['Live website','https://www.clashcompass.com/?lang=en'],['Army library','https://www.clashcompass.com/army?lang=en'],['Upgrade planner','https://www.clashcompass.com/plan?lang=en'],['App Store','https://apps.apple.com/tr/app/clash-compass/id6820775214']]],
 ['Cloudflare analytics','Read-only GraphQL export: httpRequests1dGroups for clashcompass.com, 14 October 2026 inclusive to 5 November exclusive, UTC. The period aggregation returns 258,601 HTTP requests, 154,079 edge page views, 29,888 period unique IPs, 8,787,800,109 bytes and 918 in the threats field. The threats field is retained as returned by Cloudflare. Period unique IPs are aggregated separately from daily IP counts. Country data are request counts: US 180,758 (69.9%). Edge measurements cover HTTP traffic, including automated and infrastructure requests.',[['Google data workbook',sheet],['Cloudflare GraphQL documentation','https://developers.cloudflare.com/analytics/graphql-api/']]],
 ['Client analytics & commercial snapshot','The separate PostHog query includes apex/www website URLs, a bounded timestamp range and daily pageview counts. It returns 230 recorded pageview events. Project-timezone conversion was enabled, so these client day labels are not represented as UTC. The extract contains 14 dated rows. The subscriber figure comes from the founder’s conversation snapshot; this dataset covers traffic and research inventory.',[['PostHog query API documentation','https://posthog.com/docs/api/queries']]],
 ['Research inventory','Read-only inventory of the retained research SQLite database on 5 November 2026: 1,165,019 raw battle rows and 37,373 stored profiles across TH11–TH18. TH18 has 9,666 profiles and 286,355 raw rows across homeVillage, Ranked and Legend. Raw rows include incoming and outgoing observations; the training pipeline applies its separate eligibility rules. The inspected TH18 Ranked report was fitted 23 October on 3,200 eligible matches from 468 players for ranked-2026-10-19 and qualified=false. The report corresponds to its recorded Ranked week. This brief contains aggregate inventory counts.',[['Research inventory in workbook',sheet],['Public research page','https://www.clashcompass.com/mlarmy?lang=en']]],
 ['Competitive context','A scoped comparison of documented product functions, checked 5 November 2026. The comparison describes the documented focus of each product.',[['Clash Ninja tracker','https://www.clash.ninja/upgrade-tracker/overview'],['ClashClock about','https://clashclock.com/about'],['Clashify','https://clashify.app/']]],
 ['Commercial policy & proposed partnership','Supercell’s Fan Content Policy generally requires approval for paid fan-content functionality, with exceptions including advertising, donations and coaching. Its FAQ treats sale of base layouts as coaching. The policy is the reference for evaluating commercial content scope. MOBA’s 21 May 2026 company release discusses companion apps, selected websites, ads and subscriptions. The proposed contribution draws on that direction. The initial payment and monthly paid development role are for discussion; commercial terms remain open.',[['Supercell Fan Content Policy','https://supercell.com/en/fan-content-policy/'],['MOBA company release · 21 May 2026','https://view.news.eu.nasdaq.com/view?id=bbb976f5ed278b00d83c95f9b51919d4a&lang=en&src=listed']]]
];
$('#sources-content').innerHTML=sources.map(([title,body,links])=>`<article><h3>${title}</h3><p>${body}</p><ul>${links.map(([name,url])=>`<li><a href="${url}" target="_blank" rel="noopener">${name} ↗</a></li>`).join('')}</ul></article>`).join('');
function openSources(){$('#sources-dialog').showModal();}
$('#sources-button').onclick=openSources;$('#sources-last').onclick=openSources;
document.querySelectorAll('.dialog-close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
document.querySelectorAll('[data-gallery]').forEach(b=>b.onclick=()=>{$('#enlarged-image').src=b.dataset.gallery;$('#image-dialog').showModal();});
go(location.hash.slice(1)||'overview',false);
