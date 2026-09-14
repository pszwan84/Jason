import { createEvaluationHandlers } from '../../../lib/evaluation/service.ts';

// Values are resolved server-side per request. No client imports of this module.
const handlers = createEvaluationHandlers({ env: () => process.env });
export const GET = handlers.GET;
export const POST = handlers.POST;
