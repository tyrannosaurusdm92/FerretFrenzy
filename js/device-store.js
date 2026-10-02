import {uid,sanitizeName} from './utils.js';
const KEY='ff:device:v1';
export function getDevice(){let d;try{d=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}if(!d){d={deviceId:uid('dev'),displayName:`Ferret ${Math.floor(Math.random()*900+100)}`,avatarSeed:uid('fur').slice(-8),createdAt:Date.now()};saveDevice(d)}return d}
export function saveDevice(next){const clean={...next,displayName:sanitizeName(next.displayName,20)||'Ferret',avatarSeed:sanitizeName(next.avatarSeed,20)||'ferret'};localStorage.setItem(KEY,JSON.stringify(clean));return clean}
