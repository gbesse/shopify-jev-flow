import { handleAction } from './server.js';
const body = JSON.stringify({ decisionId: 'demo-return-42', policy: 'returns-v1', subject: { orderId: 'gid://shopify/Order/42', amount: 149, reason: 'size mismatch', customerOrders: 3 } });
console.log(JSON.stringify(await handleAction(body, {}, { fixture: true, store: {} }), null, 2));
