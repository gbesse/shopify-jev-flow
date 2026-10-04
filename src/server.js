#!/usr/bin/env node
import { createServer } from 'node:http';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildRequest, fakeResponse, normalizeDecision, verifyShopifyHmac } from './core.js';

const storePath = process.env.JEV_FLOW_STORE ?? 'local-data/decisions.json';
const auditPath = process.env.JEV_FLOW_AUDIT ?? 'local-data/audit.jsonl';

async function loadStore() { try { return JSON.parse(await readFile(storePath, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return {}; throw error; } }
async function saveStore(store) { await mkdir(dirname(storePath), { recursive: true }); await writeFile(storePath, JSON.stringify(store, null, 2), { mode: 0o600 }); }
async function audit(record) { await mkdir(dirname(auditPath), { recursive: true }); await appendFile(auditPath, `${JSON.stringify(record)}\n`, { mode: 0o600 }); }

async function liveProvider(request) {
  if (!process.env.TYPESAFE_API_KEY) throw new Error('TYPESAFE_API_KEY is required in live mode');
  const response = await fetch('https://api.typesafe.ai/v1/systemone', { method: 'POST', signal: AbortSignal.timeout(10_000), headers: { authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(request) });
  if (!response.ok) throw new Error(`TypeSafe request failed with HTTP ${response.status}`);
  return response.json();
}

export async function handleAction(rawBody, headers, { secret = process.env.SHOPIFY_API_SECRET, fixture = process.env.JEV_FIXTURE === '1', store = null } = {}) {
  if (!fixture && !verifyShopifyHmac(rawBody, headers['x-shopify-hmac-sha256'], secret)) return { status: 401, body: { error: 'invalid_hmac' } };
  const input = JSON.parse(rawBody);
  const decisions = store ?? await loadStore();
  if (decisions[input.decisionId]) return { status: 200, body: { ...decisions[input.decisionId], replayed: true } };
  const response = fixture ? fakeResponse(input) : await liveProvider(buildRequest(input));
  const decision = { decisionId: input.decisionId, ...normalizeDecision(response), model: response.model, usage: response.usage };
  decisions[input.decisionId] = decision;
  if (!store) { await saveStore(decisions); await audit({ recordedAt: new Date().toISOString(), shopDomain: headers['x-shopify-shop-domain'] ?? null, ...decision }); }
  return { status: 200, body: decision };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/api/flow/decision') return response.writeHead(404).end();
    try {
      let raw = ''; for await (const chunk of request) { raw += chunk; if (raw.length > 256_000) throw new Error('body too large'); }
      const result = await handleAction(raw, request.headers);
      response.writeHead(result.status, { 'content-type': 'application/json' }).end(JSON.stringify(result.body));
    } catch (error) { response.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: error.message })); }
  }).listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => console.log('Shopify Jev Flow listening on http://127.0.0.1:3000'));
}
