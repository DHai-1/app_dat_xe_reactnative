import { isPushForAccount, pushKey, type PushDestination, type PushEnvelope, type PushRole } from './contracts';

/** Taps wait through login/session restoration and router mounting. No timer guesses. */
export function createPushOpenCoordinator(adapter: {
  session: () => { id: number; role: PushRole } | null;
  ready: () => boolean;
  resolve: (event: PushEnvelope) => Promise<PushDestination>;
  navigate: (destination: PushDestination) => void;
  acknowledge: (event: PushEnvelope) => Promise<void>;
  error: (error: unknown, retry: () => void) => void;
}) {
  let pending: PushEnvelope | null = null;
  let running = false;
  let generation = 0;
  const handled = new Set<string>();
  const drain = async () => {
    const session = adapter.session();
    if (running || !pending || !session || !adapter.ready()) return;
    const event = pending;
    const version = generation;
    if (!isPushForAccount(event, session.role, session.id) || handled.has(pushKey(event))) {
      pending = null;
      await adapter.acknowledge(event).catch(() => {});
      return;
    }
    running = true;
    try {
      const destination = await adapter.resolve(event);
      const current = adapter.session();
      if (version !== generation || !current || current.id !== session.id || current.role !== session.role || !adapter.ready()) return;
      adapter.navigate(destination);
      handled.add(pushKey(event));
      if (handled.size > 100) handled.delete(handled.values().next().value!);
      if (pending === event) pending = null;
      await adapter.acknowledge(event).catch(() => {});
    } catch (error) {
      if (version === generation) adapter.error(error, () => { void drain(); });
    } finally {
      running = false;
      const current = adapter.session();
      if (pending && (pending !== event || (current && current.id !== session.id))) void drain();
    }
  };
  return {
    enqueue: (event: PushEnvelope) => {
      if (handled.has(pushKey(event))) return;
      pending = event;
      void drain();
    },
    drain,
    clear: () => { generation++; pending = null; },
  };
}
