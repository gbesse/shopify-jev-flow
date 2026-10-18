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

## Contrôle d’adoption · Adoption check · Comprobación de adopción

[Français : essayer un cas concret](examples/adoption-check.md) · [English: try a concrete case](examples/adoption-check.md) · [Español: pruebe un caso concreto](examples/adoption-check.md).

## Bound replay receipts / Reçus de répétition liés / Recibos de repetición vinculados

EN: Replays now bind the complete input and supplied shop-domain scope to the decision ID. Changed content returns 409; different scopes cannot replay each other’s receipt. Legacy unbound receipts block for explicit migration. Per-process queues serialize updates and duplicate calls; store writes use an atomic private-file replacement. This is a local single-process ledger, not distributed exactly-once processing. Shop-domain headers define routing scope, not independent tenant authentication; HMAC remains required in live mode. Store replacement and audit append are separate operations, and external provider effects cannot be rolled back.

FR : La répétition lie désormais l’entrée complète et le domaine de boutique fourni à l’identifiant de décision. Un contenu modifié reçoit 409 ; des domaines distincts ne rejouent pas leurs reçus respectifs. Les anciens reçus sans liaison bloquent pour migration explicite. Les files du processus sérialisent modifications et doublons ; l’écriture remplace atomiquement un fichier privé. Ce journal local exige un seul processus et ne garantit pas une exécution distribuée unique. Le domaine d’en-tête définit une portée, pas une authentification de locataire indépendante ; le HMAC reste requis en mode réel. Remplacement du journal et ajout d’audit sont distincts ; les effets du fournisseur ne sont pas annulables.

ES: La repetición vincula entrada completa y dominio proporcionado al ID de decisión. Contenido cambiado devuelve 409; ámbitos distintos no reproducen recibos ajenos. Recibos antiguos sin vínculo bloquean para migración explícita. Colas por proceso serializan actualizaciones y duplicados; escrituras reemplazan atómicamente un archivo privado. Es un registro local de un solo proceso, no ejecución distribuida exactamente una vez. El dominio define ámbito, no autentica por sí solo al inquilino; HMAC sigue obligatorio en modo real. Reemplazo del registro y auditoría son operaciones separadas; efectos externos del proveedor no se pueden revertir.


FR : Un stockage de reçus doit être un objet JSON ; tableaux, valeurs primitives et instances incompatibles sont refusés avant appel fournisseur. Un reçu lié à la requête mais incomplet ou incohérent retourne `409 invalid_bound_receipt`, sans recalcul payant. Les résultats renvoyés sont détachés du stockage en mémoire. Le stockage reste local et non signé : ce contrôle de cohérence n’authentifie pas une modification malveillante du fichier et ne fournit pas de verrou multiprocessus.

EN: Receipt storage must be a JSON object; arrays, primitives and incompatible instances are rejected before provider calls. A request-bound but incomplete or inconsistent receipt returns `409 invalid_bound_receipt` without paid recomputation. Returned results are detached from in-memory storage. Storage remains local and unsigned: consistency checking does not authenticate malicious file modifications or provide multiprocess locking.

ES: El almacén de recibos debe ser un objeto JSON; rechaza arrays, valores primitivos e instancias incompatibles antes de llamar al proveedor. Un recibo vinculado a la solicitud pero incompleto o incoherente devuelve `409 invalid_bound_receipt` sin recálculo de pago. Los resultados devueltos se separan del almacenamiento en memoria. El almacenamiento sigue siendo local y sin firma: comprobar consistencia no autentica cambios maliciosos del archivo ni proporciona bloqueo multiproceso.
