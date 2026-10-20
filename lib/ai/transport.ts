import { AsyncLocalStorage } from "node:async_hooks";

export type ModelTransport = (url: string, init: RequestInit) => Promise<Response>;
const transport = new AsyncLocalStorage<ModelTransport>();

/** Only a trusted research worker installs this. Existing HTTP requests stay unchanged. */
export function withModelTransport<T>(dispatch: ModelTransport, work: () => T): T {
  return transport.run(dispatch, work);
}

export function modelFetch(url: string, init: RequestInit): Promise<Response> {
  // Resolve fetch at call time so the existing experiment spending guard still applies.
  return (transport.getStore() ?? ((target, options) => fetch(target, options)))(url, init);
}
