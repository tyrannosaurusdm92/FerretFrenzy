import {LocalTransport} from './local-transport.js';import {BackendTransport} from './backend-transport.js';
export function createTransport(){const base=window.FF_BACKEND_URL||localStorage.getItem('ff:backend:url')||'';return base?new BackendTransport(base):new LocalTransport()}
