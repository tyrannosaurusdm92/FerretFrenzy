export const now=()=>Date.now();
export function uid(prefix='id'){const a=new Uint32Array(3);crypto.getRandomValues(a);return `${prefix}_${[...a].map(v=>v.toString(36)).join('')}`}
export function clone(v){return structuredClone(v)}
export function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
export function sanitizeName(v,max=36){return String(v??'').replace(/[<>\u0000-\u001F]/g,'').trim().slice(0,max)}
export function makeSixDigitCode(){const a=new Uint32Array(1);crypto.getRandomValues(a);return String(100000+(a[0]%900000))}
export function hashString(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function avatarColors(seed){const h=hashString(seed);return [`hsl(${h%360} 78% 68%)`,`hsl(${(h*7)%360} 72% 63%)`]}
export function formatAgo(ts){const s=Math.max(0,Math.round((Date.now()-ts)/1000));if(s<8)return 'now';if(s<60)return `${s}s`;if(s<3600)return `${Math.floor(s/60)}m`;return `${Math.floor(s/3600)}h`}
export function emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}))}
