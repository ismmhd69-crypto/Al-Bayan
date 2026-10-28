import { AsyncLocalStorage } from "node:async_hooks";

export type ModelTransport = (url: string, init: RequestInit) => Promise<Response>;
/** Only a trusted local dispatch guard may throw this BEFORE sending anything.
 * Provider errors, aborts and missing receipts must never be converted to it. */
export class ModelDispatchRefusal extends Error {
  constructor(readonly reason: "allowance" | "billing_hold" | "contract") {
    super(`model_dispatch_refused_${reason}`); this.name = "ModelDispatchRefusal";
  }
}
const transport = new AsyncLocalStorage<ModelTransport>();
const priority = new AsyncLocalStorage<number>();
/** Internal scheduling only; never sent as provider input or visitor metadata. */
export const withModelPriority = <T>(value: number, work: () => T): T => priority.run(value, work);
export const currentModelPriority = () => priority.getStore() ?? 0;

/** Only a trusted research worker installs this. Existing HTTP requests stay unchanged. */
export function withModelTransport<T>(dispatch: ModelTransport, work: () => T): T {
  return transport.run(dispatch, work);
}

export function modelFetch(url: string, init: RequestInit): Promise<Response> {
  // Resolve fetch at call time so the existing experiment spending guard still applies.
  return (transport.getStore() ?? ((target, options) => fetch(target, options)))(url, init);
}
