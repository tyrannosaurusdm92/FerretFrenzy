(()=>{
'use strict';
const BASE='../images/cards/';
const LOGO='../images/frenzy_logo.png';
const META={
  BANDIT:{name:'Bandit',variety:'Sable / Black Sable',team:'Bandit side',summary:'Know the starting Bandit roster. The earliest Bandit wake becomes the Raider.',images:['01_Bandit_Sable_Black_Sable_01.jpg','02_Bandit_Sable_Black_Sable_02.jpg','03_Bandit_Sable_Black_Sable_03.jpg','04_Bandit_Sable_Black_Sable_04.jpg']},
  DOOKER:{name:'Dooker',variety:'Silver Mitt',team:'Business side',summary:'Three wakes: observe, Glimpse one alignment, then inspect and optionally Trip-swap a Hammock card.',images:['05_Dooker_Silver_Mitt_01.jpg']},
  ITCHY:{name:'Itchy',variety:'Cinnamon',team:'Business side',summary:'Roll d6 first. On 5–6, gain a second wake and a partial Raider clue.',images:['06_Itchy_Cinnamon_01.jpg']},
  TROUBLE:{name:'Trouble',variety:'Champagne',team:'Business side',summary:'Blind-swap two other player cards. If awake for the theft, become In On It.',images:['07_Trouble_Champagne_01.jpg']},
  BUSINESS:{name:'Business',variety:'Warm Sable Roan',team:'Business side',summary:'Observe Treat State and co-wakers. If alone, you may inspect one other wake schedule.',images:Array.from({length:14},(_,i)=>`${String(8+i).padStart(2,'0')}_Business_Roan_${String(i+1).padStart(2,'0')}.jpg`)},
  SNUGGLER:{name:'Snuggler',variety:'Chocolate',team:'Business side',summary:'Before Hour 1, bond two players. If one is caught, the other is revealed too.',images:['22_Snuggler_Chocolate_01.jpg']},
  HUNTER:{name:'Hunter',variety:'Blaze',team:'Business side',summary:'Two wakes. A Bandit overlap can trigger a d6 conversion check; if loyal, place one Hunt Mark.',images:['23_Hunter_Blaze_01.jpg']},
  GUARDIAN:{name:'Guardian',variety:'Dark-Eyed White',team:'Business side',summary:'Know the starting Hunter. Before vote resolution, protect one other player.',images:['24_Guardian_Dark-Eyed_White_01.jpg']}
};
const upper=v=>String(v||'').trim().toUpperCase();
const $=id=>document.getElementById(id);
function hashSeed(value){let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return Math.abs(h>>>0)}
function roleImage(role,seed='1'){const id=upper(role),m=META[id];if(!m)return '';const list=m.images;return BASE+list[hashSeed(seed)%list.length]}
function meta(role,fallback={}){const id=upper(role);const m=META[id]||{};return {id,name:fallback.name||m.name||id||'Unknown',variety:fallback.variety||fallback.pattern||m.variety||'',team:fallback.team||m.team||'',summary:fallback.summary||m.summary||'',image:roleImage(id,fallback.seed||id)}}
function cardBack(label='Hidden card',sub='FERRET FRENZY'){
  const el=document.createElement('div');el.className='ff-card ff-card-back';el.innerHTML=`<div class="ff-card-back-art"><img src="${LOGO}" alt=""></div><div class="ff-card-copy"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(sub)}</small></div>`;return el;
}
function roleCard(role,{seed='1',title='',compact=false,revealLabel='',backendMeta=null}={}){
  const m=meta(role,{...(backendMeta||{}),seed});const el=document.createElement('article');el.className='ff-card ff-role-card'+(compact?' compact':'');el.dataset.role=m.id;
  el.innerHTML=`<div class="ff-card-image-wrap"><img class="ff-card-image" src="${m.image}" alt="${escapeHtml(m.name)} role card"></div><div class="ff-card-copy">${title?`<span class="ff-card-kicker">${escapeHtml(title)}</span>`:''}<strong>${escapeHtml(m.name)}</strong><span>${escapeHtml(m.variety)}</span>${!compact?`<small>${escapeHtml(m.summary)}</small><em>${escapeHtml(revealLabel||m.team)}</em>`:''}</div>`;return el;
}
function playerBack(p,{selected=false,labelPrefix='Player'}={}){const label=`${labelPrefix} ${p?.seat||'?'}${p?.displayName?' · '+p.displayName:''}`;const isBot=p?.kind==='BOT'||/^Ferret Bot\b/i.test(String(p?.displayName||''));const el=cardBack(label,isBot?'BOT FERRET':'HIDDEN ROLE');el.classList.add('ff-player-card');el.dataset.participantId=p?.id||'';if(selected)el.classList.add('selected');return el}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
let lastRevealKey='';
function revealKey(state){return `${state?.game?.id||''}:${state?.me?.startingRole||''}`}
function shouldAutoReveal(state){const role=upper(state?.me?.startingRole);if(!role||!META[role])return false;const phase=upper(state?.game?.phase);if(!['PREP','NIGHT'].includes(phase))return false;const key=revealKey(state);try{return localStorage.getItem('ff:role-card-seen:'+key)!=='1'}catch{return key!==lastRevealKey}}
function acknowledge(state){const key=revealKey(state);lastRevealKey=key;try{localStorage.setItem('ff:role-card-seen:'+key,'1')}catch{};$('roleRevealOverlay')?.setAttribute('hidden','')}
function renderReveal(state){const overlay=$('roleRevealOverlay'),slot=$('roleRevealCard');if(!overlay||!slot)return;const me=state?.me||{},role=upper(me.startingRole);if(!role||!META[role]){overlay.hidden=true;return}slot.innerHTML='';slot.append(roleCard(role,{seed:me.seat||me.id,title:'YOUR STARTING CARD',backendMeta:me.role,revealLabel:me.isRaider?'RAIDER · BANDIT SIDE':(me.role?.team||META[role].team)}));if(shouldAutoReveal(state))overlay.hidden=false}
function renderDock(state){const dock=$('roleCardDock');if(!dock)return;const me=state?.me||{},role=upper(me.startingRole);dock.innerHTML='';if(!role||!META[role]){dock.hidden=true;return}dock.hidden=false;dock.append(roleCard(role,{seed:me.seat||me.id,compact:true,backendMeta:me.role}));dock.title='Your starting role card';}
function renderPrivate(state){const slot=$('privateRoleCardSlot');if(slot){slot.innerHTML='';const me=state?.me||{};if(me.startingRole)slot.append(roleCard(me.startingRole,{seed:me.seat||me.id,title:'STARTING CARD',backendMeta:me.role}));}
  const final=$('privateFinalCardSlot');if(final){final.innerHTML='';const phase=upper(state?.game?.phase);if(phase==='RESULTS'&&state?.me?.currentCard)final.append(roleCard(state.me.currentCard,{seed:'final-'+(state.me.seat||state.me.id),title:'FINAL CARD'}));else final.append(cardBack('Final card','REVEALED AT RESULTS'));}
}
function renderLobbyRoster(state){const box=$('lobbyRoster');if(!box)return;box.innerHTML='';const ps=state?.participants||[];for(const p of ps){const card=playerBack(p);if(p.id===state?.me?.id)card.classList.add('is-you');if(p.isHost)card.classList.add('is-host');box.append(card)}if(!ps.length)box.innerHTML='<div class="readout">Waiting for players…</div>'}
function renderResults(state){const box=$('resultsCards'),summary=$('resultsSummary');if(!box)return;box.innerHTML='';const participants=state?.participants||[],res=state?.results||{};for(const p of participants){const role=p.currentCard||p.startingRole;const wrap=document.createElement('article');wrap.className='ff-result-player'+(p.caught?' caught':'');const c=roleCard(role,{seed:'result-'+(p.seat||p.id),compact:false,title:`PLAYER ${p.seat||'?'} · ${p.displayName||'Ferret'}`,revealLabel:p.isRaider?'RAIDER':(p.allegiance?`${p.allegiance} SIDE`:'')});wrap.append(c);const note=document.createElement('div');note.className='ff-result-note';note.textContent=`Started: ${prettyRole(p.startingRole)}${p.currentCard&&p.currentCard!==p.startingRole?` · Final: ${prettyRole(p.currentCard)}`:''}${p.caught?' · CAUGHT':''}`;wrap.append(note);box.append(wrap)}
  if(summary){const winner=String(res.primaryWinner||'').toUpperCase();summary.textContent=winner?`${winner==='BUSINESS'?'Business caught the Raider':'Bandits protected the Raider'}.`:'Round complete.'}
}
function prettyRole(role){const id=upper(role);return META[id]?.name||id||'Unknown'}
function sync(state){renderReveal(state);renderDock(state);renderPrivate(state);renderLobbyRoster(state);if(upper(state?.game?.phase)==='RESULTS')renderResults(state)}
function transientReveal(role,{title='REVEALED CARD',message=''}={}){const box=$('cardToast'),slot=$('cardToastSlot'),note=$('cardToastNote');if(!box||!slot)return;slot.innerHTML='';slot.append(roleCard(role,{seed:'transient-'+Date.now(),title}));if(note)note.textContent=message;box.hidden=false;clearTimeout(transientReveal._t);transientReveal._t=setTimeout(()=>{box.hidden=true},5000)}
function bind(){document.querySelectorAll('[data-ack-role-card]').forEach(b=>b.addEventListener('click',()=>{const st=window.FFNetwork?.getState?.();if(st)acknowledge(st);else $('roleRevealOverlay')?.setAttribute('hidden','')}));$('roleCardDock')?.addEventListener('click',()=>window.FerretFrenzyShell?.openPanel?.('privateInfo'));$('cardToastClose')?.addEventListener('click',()=>{$('cardToast').hidden=true})}
const api={META,meta,roleImage,roleCard,cardBack,playerBack,sync,renderResults,transientReveal,acknowledge,prettyRole};window.FFCards=api;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
