import assert from 'node:assert/strict';
import {FerretFrenzyApi} from '../js/ferret-frenzy-api.js';
import {FF_BACKEND_URL} from '../js/ferret-frenzy-constants.js';

const originalFetch=globalThis.fetch;
let receiver=null;
let payload=null;
try{
  globalThis.fetch=function(input,init){
    receiver=this;
    payload={input,init};
    if(this!==globalThis) throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal Invocation");
    return Promise.resolve({
      ok:true,
      status:200,
      async json(){return {ok:true,backendId:'ferretfrenzy',data:{status:'ok'}};},
      async text(){return '';}
    });
  };
  const api=new FerretFrenzyApi();
  const out=await api.health();
  assert.equal(receiver,globalThis,'native global fetch must remain bound to the browser global');
  assert.equal(payload.input,FF_BACKEND_URL);
  assert.equal(JSON.parse(payload.init.body).action,'health');
  assert.deepEqual(out,{status:'ok'});
} finally {
  globalThis.fetch=originalFetch;
}
console.log(JSON.stringify({ok:true,test:'solo-bots-browser-fetch-test',illegalInvocationPrevented:true},null,2));
