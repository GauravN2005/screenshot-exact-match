import { useEffect, useSyncExternalStore } from "react";
import { demoStore } from "@/services/demo-store";
import type { DemoState } from "@/types";

export function useDemoStore<T = DemoState>(selector?: (state: DemoState) => T): T {
  useEffect(() => {
    demoStore.initClient();
  }, []);

  const state = useSyncExternalStore(
    (cb) => demoStore.subscribe(cb),
    () => demoStore.getState(),
    () => demoStore.getState(),
  );

  return selector ? selector(state) : (state as unknown as T);
}

export { demoStore };
