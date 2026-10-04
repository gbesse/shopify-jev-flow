import { createHmac, timingSafeEqual } from 'node:crypto';

export const MODEL = 'jev-1.13.0';
export const OUTCOMES = ['auto_approve', 'manual_review', 'reject'];

export function verifyShopifyHmac(rawBody, received, secret) {
  if (!secret || !received) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
  const a = Buffer.from(expected); const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function buildRequest(input) {
  if (!input?.decisionId || !input?.subject || typeof input.subject !== 'object') throw new TypeError('decisionId and subject are required');
  return {
    model: MODEL,
    state: { policy: input.policy ?? 'default', subject: input.subject },
    questions: {
      route: {
        type: 'choice',
        instructions: 'Route this Shopify event using only the supplied subject and policy. Prefer manual review whenever material evidence is missing.',
        criteria: Object.fromEntries(OUTCOMES.map(value => [value, null]))
      },
      confidence_to_automate: {
        type: 'noul',
        instructions: 'Is the evidence sufficient to apply the selected route automatically without a merchant reviewing it?'
      }
    }
  };
}

export function normalizeDecision(response, { minConfidence = 0.8 } = {}) {
  const route = response?.answers?.route;
  const confidenceAnswer = response?.answers?.confidence_to_automate;
  if (route?.type !== 'choice' || !OUTCOMES.includes(route.choice)) throw new TypeError('Provider returned an invalid route');
  if (confidenceAnswer?.type !== 'noul' || !Number.isFinite(confidenceAnswer.noul)) throw new TypeError('Provider returned invalid confidence');
  const probability = Number(route.probabilities?.[route.choice] ?? route.confidence ?? 0);
  const reviewRequired = route.choice === 'manual_review' || probability < minConfidence || confidenceAnswer.noul < minConfidence;
  return { route: reviewRequired ? 'manual_review' : route.choice, proposedRoute: route.choice, confidence: Math.min(probability, confidenceAnswer.noul), reviewRequired };
}

export function fakeResponse(input) {
  const amount = Number(input.subject.amount ?? 0);
  const proposed = amount > 500 ? 'manual_review' : 'auto_approve';
  return { model: MODEL, answers: { route: { type: 'choice', choice: proposed, probabilities: { [proposed]: 0.92 } }, confidence_to_automate: { type: 'noul', noul: proposed === 'auto_approve' ? 0.9 : 0.62 } }, usage: { input_tokens: 36 } };
}
