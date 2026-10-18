import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {handleAction} from '../src/server.js';
const raw=JSON.stringify({decisionId:'id',subject:{amount:10}}),secret='synthetic-secret';
const headers={'x-shopify-shop-domain':'shop.example','x-shopify-hmac-sha256':createHmac('sha256',secret).update(raw).digest('base64')};
test('malformed injected stores are rejected before any provider call',async()=>{
 let calls=0;for(const store of [[],new Map(),new Date(),0,'invalid'])await assert.rejects(handleAction(raw,headers,{secret,store,provider:async()=>{calls++;}}),/Invalid receipt store/);assert.equal(calls,0);
});
test('corrupt bound receipts conflict rather than replay or trigger inference',async()=>{
 const store={};await handleAction(raw,headers,{fixture:true,store});const key=Object.keys(store)[0],valid=structuredClone(store[key]);let calls=0;
 for(const patch of [{decision:undefined},{decision:{}},{decision:{...valid.decision,confidence:NaN}},{decision:{...valid.decision,model:'different'}},{decision:{...valid.decision,reviewRequired:true,route:'auto_approve'}}]){
  store[key]={...structuredClone(valid),...patch};const result=await handleAction(raw,headers,{secret,store,provider:async()=>{calls++;}});assert.equal(result.status,409);assert.equal(result.body.error,'invalid_bound_receipt');
 }assert.equal(calls,0);
});
test('mutating returned decisions cannot rewrite an injected receipt',async()=>{
 const store={};const first=await handleAction(raw,headers,{fixture:true,store});first.body.route='reject';first.body.usage.input_tokens=999;
 const replay=await handleAction(raw,headers,{fixture:true,store});assert.equal(replay.body.route,'auto_approve');assert.equal(replay.body.usage.input_tokens,36);
 replay.body.usage.input_tokens=888;assert.equal((await handleAction(raw,headers,{fixture:true,store})).body.usage.input_tokens,36);
});
