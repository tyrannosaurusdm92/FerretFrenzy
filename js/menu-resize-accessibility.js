(()=>{"use strict";
const TARGETS=".panel,dialog.howto-dialog";
const EDGES=["n","s","e","w","ne","nw","se","sw"];
const SCALE_MIN=.78;
const SCALE_MAX=2.2;
const state=new WeakMap();
const wired=new WeakSet();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const px=n=>`${Math.round(n*100)/100}px`;
const sized=(base,scale,min=2,max=180)=>clamp(base*scale,min,max);

function setScaledVars(el,scale){
  const v=(name,base,min,max)=>el.style.setProperty(name,px(sized(base,scale,min,max)));
  v("--ff-font-tiny",8,9,22);
  v("--ff-font-small",10,10,26);
  v("--ff-font-body",12,11,30);
  v("--ff-font-heading",12,12,32);
  v("--ff-font-large",14,13,36);
  v("--ff-font-xl",20,17,46);
  v("--ff-icon-size",18,16,42);
  v("--ff-gap",8,6,20);
  v("--ff-gap-small",5,4,14);
  v("--ff-pad",12,9,28);
  v("--ff-pad-small",8,6,20);
  v("--ff-radius",10,8,22);
  v("--ff-head-h",42,42,88);
  v("--ff-action-size",31,31,68);
  v("--ff-control-h",36,36,78);
  v("--ff-card-min",150,120,330);
  v("--ff-sidebar-w",190,150,360);
  el.style.setProperty("--ff-ui-scale",String(Math.round(scale*1000)/1000));
}

function captureBaseline(el){
  let s=state.get(el);if(!s){s={};state.set(el,s)}
  if(s.baseW&&s.baseH)return true;
  const r=el.getBoundingClientRect();
  if(r.width<2||r.height<2)return false;
  s.baseW=r.width;s.baseH=r.height;
  el.dataset.ffDefaultWidth=String(Math.round(r.width*100)/100);
  el.dataset.ffDefaultHeight=String(Math.round(r.height*100)/100);
  setScaledVars(el,1);
  applyLayout(el,r.width);
  return true;
}

function applyLayout(el,width){
  el.dataset.ffLayout=width<600?"compact":width<860?"medium":"wide";
}

function applyScale(el){
  const s=state.get(el);if(!s||!s.baseW||!s.baseH)return;
  const r=el.getBoundingClientRect();if(r.width<1||r.height<1)return;
  const wr=r.width/s.baseW,hr=r.height/s.baseH;
  const scale=clamp(Math.sqrt(Math.max(.01,wr)*Math.max(.01,hr)),SCALE_MIN,SCALE_MAX);
  setScaledVars(el,scale);applyLayout(el,r.width);
  const detail={width:r.width,height:r.height,scale,defaultWidth:s.baseW,defaultHeight:s.baseH};
  el.dispatchEvent(new CustomEvent("ferretfrenzy:menuresize",{bubbles:true,detail}));
}

function commitRect(el,x,y,w,h){
  const vw=Math.max(120,innerWidth),vh=Math.max(100,innerHeight);
  w=clamp(w,100,Math.max(100,vw-8));h=clamp(h,80,Math.max(80,vh-8));
  x=clamp(x,4,Math.max(4,vw-w-4));y=clamp(y,4,Math.max(4,vh-h-4));
  el.classList.add("ff-user-sized");
  if(el.classList.contains("panel"))el.classList.add("pinned","open");
  el.style.setProperty("--ff-user-x",px(x));
  el.style.setProperty("--ff-user-y",px(y));
  el.style.setProperty("--ff-user-w",px(w));
  el.style.setProperty("--ff-user-h",px(h));
}

function normalize(el){
  if(!captureBaseline(el))return null;
  const r=el.getBoundingClientRect();
  commitRect(el,r.left,r.top,r.width,r.height);
  return r;
}

function minSize(el){
  const s=state.get(el)||{};
  const vw=Math.max(100,innerWidth-8),vh=Math.max(80,innerHeight-8);
  const minW=Math.min(Math.max(el.matches("dialog")?280:210,Math.min((s.baseW||520)*.38,320)),vw);
  const minH=Math.min(Math.max(el.matches("dialog")?220:140,Math.min((s.baseH||420)*.28,260)),vh);
  return {minW,minH};
}

function resizedRect(r,edge,dx,dy,minW,minH){
  let x=r.left,y=r.top,w=r.width,h=r.height;
  if(edge.includes("e"))w=clamp(r.width+dx,minW,Math.max(minW,innerWidth-r.left-4));
  if(edge.includes("s"))h=clamp(r.height+dy,minH,Math.max(minH,innerHeight-r.top-4));
  if(edge.includes("w")){
    const nx=clamp(r.left+dx,4,r.right-minW);w=r.right-nx;x=nx;
  }
  if(edge.includes("n")){
    const ny=clamp(r.top+dy,4,r.bottom-minH);h=r.bottom-ny;y=ny;
  }
  if(x+w>innerWidth-4)w=Math.max(minW,innerWidth-4-x);
  if(y+h>innerHeight-4)h=Math.max(minH,innerHeight-4-y);
  return {x,y,w,h};
}

function beginResize(e,el,edge){
  if(e.button!==undefined&&e.button!==0)return;
  e.preventDefault();e.stopPropagation();
  const r=normalize(el);if(!r)return;
  const {minW,minH}=minSize(el),sx=e.clientX,sy=e.clientY;
  el.classList.add("ff-resizing");
  const handle=e.currentTarget;handle.setPointerCapture?.(e.pointerId);
  const move=ev=>{
    const next=resizedRect(r,edge,ev.clientX-sx,ev.clientY-sy,minW,minH);
    commitRect(el,next.x,next.y,next.w,next.h);
  };
  const end=()=>{
    el.classList.remove("ff-resizing");
    handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",end);handle.removeEventListener("pointercancel",end);
  };
  handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",end);handle.addEventListener("pointercancel",end);
}

function keyboardResize(e,el,edge){
  if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home"].includes(e.key))return;
  e.preventDefault();e.stopPropagation();
  if(e.key==="Home"){reset(el);return}
  const r=normalize(el);if(!r)return;
  const {minW,minH}=minSize(el),step=e.shiftKey?48:24;
  let dx=0,dy=0;
  if(e.key==="ArrowLeft")dx=-step;
  if(e.key==="ArrowRight")dx=step;
  if(e.key==="ArrowUp")dy=-step;
  if(e.key==="ArrowDown")dy=step;
  if(!edge.includes("e")&&!edge.includes("w"))dx=0;
  if(!edge.includes("n")&&!edge.includes("s"))dy=0;
  const next=resizedRect(r,edge,dx,dy,minW,minH);
  commitRect(el,next.x,next.y,next.w,next.h);
}

function reset(el){
  el.classList.remove("ff-user-sized","ff-resizing","ff-moving");
  ["--ff-user-x","--ff-user-y","--ff-user-w","--ff-user-h"].forEach(k=>el.style.removeProperty(k));
  setScaledVars(el,1);
  requestAnimationFrame(()=>{const r=el.getBoundingClientRect();if(r.width>1)applyLayout(el,r.width)});
  el.dispatchEvent(new CustomEvent("ferretfrenzy:menureset",{bubbles:true}));
}

function addHandles(el){
  EDGES.forEach(edge=>{
    if(el.querySelector(`:scope > .ff-resize-handle[data-edge="${edge}"]`))return;
    const h=document.createElement("span");h.className="ff-resize-handle";h.dataset.edge=edge;
    h.tabIndex=0;h.setAttribute("role","separator");
    h.setAttribute("aria-label",`Resize menu from the ${edge.toUpperCase()} edge`);
    h.title="Drag to resize · Arrow keys resize · Shift+Arrow resizes faster · Home or double-click restores default size";
    h.addEventListener("pointerdown",ev=>beginResize(ev,el,edge));
    h.addEventListener("keydown",ev=>keyboardResize(ev,el,edge));
    h.addEventListener("dblclick",ev=>{ev.preventDefault();ev.stopPropagation();reset(el)});
    el.appendChild(h);
  });
}

function addMoveHandle(el){
  const head=el.matches("dialog.howto-dialog")?el.querySelector(".howto-head"):el.querySelector(":scope > .panel-head");
  if(!head||head.dataset.ffMoveWired)return;head.dataset.ffMoveWired="1";
  head.addEventListener("pointerdown",e=>{
    if(e.button!==undefined&&e.button!==0)return;
    if(e.target.closest("button,input,select,textarea,a,.ff-resize-handle"))return;
    const r=normalize(el);if(!r)return;
    const sx=e.clientX,sy=e.clientY;let moved=false;
    head.setPointerCapture?.(e.pointerId);el.classList.add("ff-moving");
    const mv=ev=>{
      const dx=ev.clientX-sx,dy=ev.clientY-sy;if(Math.hypot(dx,dy)>3)moved=true;
      if(!moved)return;commitRect(el,r.left+dx,r.top+dy,r.width,r.height);
    };
    const up=()=>{el.classList.remove("ff-moving");head.removeEventListener("pointermove",mv);head.removeEventListener("pointerup",up);head.removeEventListener("pointercancel",up)};
    head.addEventListener("pointermove",mv);head.addEventListener("pointerup",up);head.addEventListener("pointercancel",up);
  });
}

function wire(el){
  if(wired.has(el))return;wired.add(el);el.classList.add("ff-resizable");addHandles(el);addMoveHandle(el);observer.observe(el);captureBaseline(el);
}

if(!("ResizeObserver" in window))return;
const observer=new ResizeObserver(entries=>entries.forEach(({target})=>{if(captureBaseline(target))applyScale(target)}));
document.querySelectorAll(TARGETS).forEach(wire);
const mo=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  if(node.matches?.(TARGETS))wire(node);
  node.querySelectorAll?.(TARGETS).forEach(wire);
})));
mo.observe(document.documentElement,{subtree:true,childList:true});
addEventListener("resize",()=>document.querySelectorAll(`${TARGETS}.ff-user-sized`).forEach(el=>{
  const r=el.getBoundingClientRect();commitRect(el,r.left,r.top,Math.min(r.width,innerWidth-8),Math.min(r.height,innerHeight-8));
}));
window.FerretFrenzyMenuResize={reset:el=>reset(el),wire};
})();
