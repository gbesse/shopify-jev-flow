import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { normalizeDecision, verifyShopifyHmac } from '../src/core.js';
import { handleAction } from '../src/server.js';

test('validates Shopify HMAC without parsing the body', () => { const body = '{"x":1}', secret = 'test-secret'; const hmac = createHmac('sha256', secret).update(body).digest('base64'); assert.equal(verifyShopifyHmac(body, hmac, secret), true); assert.equal(verifyShopifyHmac(`${body} `, hmac, secret), false); });
test('low confidence is always sent to review', () => assert.deepEqual(normalizeDecision({ answers: { route: { type: 'choice', choice: 'auto_approve', confidence: 0.6 }, confidence_to_automate: { type: 'noul', noul: 0.95 } } }).route, 'manual_review'));
test('fixture action is idempotent', async () => { const store = {}; const raw = JSON.stringify({ decisionId: 'same', subject: { amount: 10 } }); const first = await handleAction(raw, {}, { fixture: true, store }); const second = await handleAction(raw, {}, { fixture: true, store }); assert.equal(first.body.replayed, undefined); assert.equal(second.body.replayed, true); });
test('unsigned live request is rejected', async () => assert.equal((await handleAction('{}', {}, { fixture: false, secret: 's', store: {} })).status, 401));
test('out-of-range provider probabilities cannot trigger an automatic route', () => {
  const response = { answers: { route: { type: 'choice', choice: 'auto_approve', confidence: 1.2 }, confidence_to_automate: { type: 'noul', noul: 0.9 } } };
  assert.throws(() => normalizeDecision(response), /out-of-range/);
  response.answers.route.confidence = 0.9;
  response.answers.confidence_to_automate.noul = -0.1;
  assert.throws(() => normalizeDecision(response), /out-of-range/);
});

test('changed payload with a reused decision ID conflicts and shop scopes stay separate',async()=>{
 const store={},raw=JSON.stringify({decisionId:'same',subject:{amount:10}});
 const a=await handleAction(raw,{'x-shopify-shop-domain':'a.example'},{fixture:true,store});
 assert.equal(a.status,200);
 assert.equal((await handleAction(JSON.stringify({decisionId:'same',subject:{amount:999}}),{'x-shopify-shop-domain':'a.example'},{fixture:true,store})).status,409);
 const b=await handleAction(raw,{'x-shopify-shop-domain':'b.example'},{fixture:true,store});assert.equal(b.body.replayed,undefined);
});
test('prototype-like decision IDs cannot access inherited receipts',async()=>{
 const store={};const result=await handleAction(JSON.stringify({decisionId:'__proto__',subject:{amount:10}}),{},{fixture:true,store});
 assert.equal(result.status,200);assert.equal(result.body.route,'auto_approve');assert.equal(Object.getPrototypeOf(store),Object.prototype);
});
test('concurrent signed requests evaluate once and replay one bound receipt',async()=>{
 const store={},secret='synthetic-secret',raw=JSON.stringify({decisionId:'same',subject:{amount:10}});
 const headers={'x-shopify-shop-domain':'a.example','x-shopify-hmac-sha256':createHmac('sha256',secret).update(raw).digest('base64')};
 let calls=0;const provider=async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,5));return {model:'jev-1.13.0',answers:{route:{type:'choice',choice:'auto_approve',confidence:.9},confidence_to_automate:{type:'noul',noul:.9}}};};
 const results=await Promise.all([handleAction(raw,headers,{fixture:false,secret,store,provider}),handleAction(raw,headers,{fixture:false,secret,store,provider})]);
 assert.equal(calls,1);assert.equal(results[1].body.replayed,true);
});
test('legacy unbound receipts block and invalid subjects never reach the provider',async()=>{
 assert.equal((await handleAction(JSON.stringify({decisionId:'same',subject:{amount:1}}),{},{fixture:true,store:{same:{route:'auto_approve'}}})).status,409);
 for(const subject of ( [null,[],1] ))await assert.rejects(handleAction(JSON.stringify({decisionId:'id',subject}),{},{fixture:true,store:{}}),/subject/);
});
