# Shopify Jev Flow

A typed Shopify Flow action for merchant-owned decisions. It returns a finite route, a calibrated confidence, and an explicit `reviewRequired` flag instead of generated prose.

## Offline proof

```bash
npm test
npm run demo
JEV_FIXTURE=1 npm start
```

POST the sample contract to `/api/flow/decision`. Fixture mode performs no network request. Live mode verifies Shopify's HMAC over the raw request body before parsing it and requires `SHOPIFY_API_SECRET` plus a server-side `TYPESAFE_API_KEY`.

The first example pack routes return requests to `auto_approve`, `manual_review`, or `reject`. Low-confidence results always become `manual_review`. `decisionId` provides idempotence, and an append-only audit record preserves the applied result.

## Shopify setup

Create a Shopify app, replace the placeholder HTTPS action URL in `extensions/jev-decision/shopify.extension.toml`, and deploy the Flow action with Shopify CLI. The included manifest is a source template, not a published App Store listing. Use a durable transactional store instead of the development JSON store in production.

## Security and boundaries

Never expose provider or Shopify secrets to theme code. Restrict the endpoint to Shopify, verify HMAC, enforce tenant authorization, rate limits and replay protection, and minimize the customer data included in `subject`. This project does not decide refunds or reject customers without merchant-owned policy and an appropriate human-review lane.

Independent community integration. MIT licensed.

## October 2026 improvement · Amélioration d’octobre 2026 · Mejora de octubre de 2026

Provider probabilities and the automation threshold must now stay in [0,1]; invalid values cannot trigger an automatic route. Run `npm test` without Shopify credentials.

Les probabilités du fournisseur et le seuil d’automatisation doivent désormais rester dans [0,1] ; une valeur invalide ne peut pas déclencher un routage automatique. Lancez `npm test` sans identifiants Shopify.

Las probabilidades del proveedor y el umbral de automatización deben permanecer en [0,1]; un valor inválido no puede activar un enrutamiento automático. Ejecute `npm test` sin credenciales de Shopify.
