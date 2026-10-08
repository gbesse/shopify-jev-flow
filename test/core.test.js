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
