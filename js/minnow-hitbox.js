(()=>{
'use strict';

let IMAGE_W=1672, IMAGE_H=941;
const PRE_THEFT='../images/Aurora-lit ferret treats bookshelf-1.png';
const POST_THEFT='../images/Minnow Treats crime scene-2.png';
const GEOJSON_URL='../../json/minnow-hitbox.geojson';
const NS='http://www.w3.org/2000/svg';
const FALLBACK_POINTS=[[726.51,258.23],[916.57,257.2],[904.8,454],[736.84,451.39]];
const LOCAL_PREFIX='ff:minnow-theft-clicked:';

let points=FALLBACK_POINTS.map(p=>p.slice());
let geojson=null,viewer=null,scene=null,svg=null,polygon=null,currentState=null,armed=false,resizeObserver=null;
const $=id=>document.getElementById(id);
function phaseOf(s){return String(s?.game?.phase||'').toUpperCase()}
function gameKey(s){return LOCAL_PREFIX+String(s?.game?.id||'local')}
function localStolen(s){try{return localStorage.getItem(gameKey(s))==='1'}catch{return false}}
function markLocalStolen(s){try{localStorage.setItem(gameKey(s),'1')}catch{}}
function clearLocalStolen(s){try{localStorage.removeItem(gameKey(s))}catch{}}
function isAwake(s){const h=Number(s?.game?.currentHour||0);return Array.isArray(s?.me?.wakeHours)&&s.me.wakeHours.map(Number).includes(h)}
function currentObservation(s){const h=Number(s?.game?.currentHour||0);return (s?.me?.observations||[]).find(o=>Number(o?.hour)===h)||null}
function awakeAlreadySeesMissing(s){
  if(phaseOf(s)!=='NIGHT'||s?.me?.actionPrompt?.kind==='SLEEP')return false;
  const obs=currentObservation(s);if(isRaiderTheftMoment(s))return false;
  return String(obs?.treatStateBefore||'').toUpperCase()==='MISSING'||obs?.treatChangedDuringWindow===true;
}
function isRaiderTheftMoment(s){
  const me=s?.me||{},phase=phaseOf(s),hour=Number(s?.game?.currentHour||0);
  return phase==='NIGHT'&&String(me.startingRole||me.role?.id||'').toUpperCase()==='BANDIT'&&me.isRaider===true&&me.actionPrompt?.kind!=='SLEEP'&&hour>0&&isAwake(s)&&!localStolen(s);
}
function shouldShowMissing(s){
  const phase=phaseOf(s);if(['MORNING','VOTE','RESULTS'].includes(phase))return true;
  if(phase==='NIGHT'&&localStolen(s))return true;return awakeAlreadySeesMissing(s);
}
function setSceneMissing(missing){
  if(!scene)scene=$('gameScene');const hud=$('treatHud'),text=$('treatHudText');
  if(scene){const next=missing?POST_THEFT:PRE_THEFT;const desired=new URL(next,document.baseURI).href;if(scene.src!==desired){scene.classList.add('scene-changing');requestAnimationFrame(()=>{scene.src=next;requestAnimationFrame(()=>scene.classList.remove('scene-changing'))})}scene.alt=missing?'Aurora-lit ferret shelf after the Minnow Treats were stolen, marked as a crime scene':'Aurora-lit ferret shelf with the Minnow Treats present'}
  hud?.classList.toggle('missing',!!missing);if(text)text.textContent=missing?'TREATS MISSING':'TREATS PRESENT';if(missing)setArmed(false);requestAnimationFrame(syncOverlayBox);
}
function actualImageRect(){
  if(!scene||!viewer)return null;const vr=viewer.getBoundingClientRect(),sr=scene.getBoundingClientRect();const iw=Number(scene.naturalWidth)||IMAGE_W,ih=Number(scene.naturalHeight)||IMAGE_H;const scale=Math.min(sr.width/iw,sr.height/ih);const w=iw*scale,h=ih*scale;return{left:(sr.left-vr.left)+(sr.width-w)/2,top:(sr.top-vr.top)+(sr.height-h)/2,width:w,height:h};
}
function syncOverlayBox(){if(!svg)return;const r=actualImageRect();if(!r)return;svg.style.left=r.left+'px';svg.style.top=r.top+'px';svg.style.width=r.width+'px';svg.style.height=r.height+'px'}
function updatePolygon(){if(!svg||!polygon)return;svg.setAttribute('viewBox',`0 0 ${IMAGE_W} ${IMAGE_H}`);polygon.setAttribute('points',points.map(p=>p.join(',')).join(' '));syncOverlayBox()}
function setArmed(next){armed=!!next;if(svg)svg.classList.toggle('armed',armed);if(polygon){polygon.setAttribute('aria-disabled',String(!armed));polygon.tabIndex=armed?0:-1}const hint=$('crimeActionHint');if(hint)hint.hidden=!armed}
function steal(){
  if(!armed||!currentState||!isRaiderTheftMoment(currentState))return false;
  markLocalStolen(currentState);setArmed(false);setSceneMissing(true);
  const banner=$('rollResult');if(banner)banner.textContent='MINNOW TREATS STOLEN · keep your theft private until Morning Business';
  window.dispatchEvent(new CustomEvent('ferret-frenzy-treat-stolen',{detail:{gameId:currentState?.game?.id||'',hour:Number(currentState?.game?.currentHour||0),private:true,source:'geojson-overlay'}}));return true;
}
function parseGeoJSON(data){
  const feature=(data?.features||[]).find(f=>f?.geometry?.type==='Polygon')||data?.features?.[0];const ring=feature?.geometry?.coordinates?.[0];
  if(!Array.isArray(ring)||ring.length<4)return false;const parsed=ring.slice(0,-1).map(p=>[Number(p?.[0]),Number(p?.[1])]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));if(parsed.length<3)return false;
  points=parsed;IMAGE_W=Number(feature?.properties?.image_width)||IMAGE_W;IMAGE_H=Number(feature?.properties?.image_height)||IMAGE_H;geojson=data;updatePolygon();return true;
}
async function loadGeoJSON(){
  try{const res=await fetch(GEOJSON_URL,{cache:'no-store'});if(!res.ok)throw new Error(`GeoJSON HTTP ${res.status}`);const data=await res.json();if(!parseGeoJSON(data))throw new Error('GeoJSON polygon is invalid');document.documentElement.dataset.minnowOverlay='geojson-loaded';return data}
  catch(err){document.documentElement.dataset.minnowOverlay='fallback-polygon';console.warn('Ferret Frenzy Minnow GeoJSON:',err);return null}
}
function mount(){
  if(svg)return;viewer=$('viewerScreen');scene=$('gameScene');if(!viewer||!scene)return;
  svg=document.createElementNS(NS,'svg');svg.classList.add('minnow-hitbox-svg');svg.setAttribute('viewBox',`0 0 ${IMAGE_W} ${IMAGE_H}`);svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','false');
  polygon=document.createElementNS(NS,'polygon');polygon.classList.add('minnow-hitbox-target');polygon.setAttribute('points',points.map(p=>p.join(',')).join(' '));polygon.setAttribute('role','button');polygon.setAttribute('aria-label','Steal the Minnow Treats');polygon.setAttribute('aria-disabled','true');polygon.tabIndex=-1;
  polygon.addEventListener('click',steal);polygon.addEventListener('keydown',e=>{if(armed&&(e.key==='Enter'||e.key===' ')){e.preventDefault();steal()}});svg.append(polygon);viewer.append(svg);
  const sync=()=>requestAnimationFrame(syncOverlayBox);if(scene.complete)sync();else scene.addEventListener('load',sync);addEventListener('resize',sync);if('ResizeObserver'in window){resizeObserver=new ResizeObserver(sync);resizeObserver.observe(viewer);resizeObserver.observe(scene)}
  void loadGeoJSON();
}
function update(s){
  currentState=s;if(!svg)mount();if(!s?.game)return;const phase=phaseOf(s);if(phase==='LOBBY'||phase==='PREP')clearLocalStolen(s);const missing=shouldShowMissing(s);setSceneMissing(missing);const canSteal=!missing&&isRaiderTheftMoment(s);setArmed(canSteal);if(canSteal){const banner=$('rollResult');if(banner)banner.textContent='RAIDER · tap the highlighted Minnow Treats to steal them'}
}
function destroy(){resizeObserver?.disconnect();resizeObserver=null;svg?.remove();svg=polygon=null;currentState=null;armed=false}
function fallbackGeoJSON(){return{"type":"FeatureCollection","name":"Ferret Frenzy Minnow Treats Locked Hitbox","features":[{"type":"Feature","id":"minnow-treats-hitbox","properties":{"game":"Ferret Frenzy","asset":"assets/images/Aurora-lit ferret treats bookshelf-1.png","coordinate_space":"image-pixels","image_width":IMAGE_W,"image_height":IMAGE_H,"purpose":"Bandit Raider clickable theft target","locked":true,"runtime":"js/minnow-hitbox.js","interaction":"Raider-only theft hotspot during the Raider wake hour; switches local scene to post-theft.","source":"Packaged GeoJSON with fallback polygon"},"geometry":{"type":"Polygon","coordinates":[[...points,points[0]].map(p=>p.slice())]}}]}}
window.FFMinnowHitbox={update,setSceneMissing,canSteal:()=>!!(currentState&&isRaiderTheftMoment(currentState)),steal,getGeoJSON:()=>geojson||fallbackGeoJSON(),reloadGeoJSON:loadGeoJSON,destroy};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
