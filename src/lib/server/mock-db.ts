import { createDefaultState } from "@/lib/state";
import type { AppState } from "@/lib/types";

declare global {
  var __newstartMockState: AppState | undefined;
}

function stateRef() {
  globalThis.__newstartMockState ??= createDefaultState();
  return globalThis.__newstartMockState;
}

export function getMockState() {
  return stateRef();
}

export function setMockState(nextState: AppState) {
  globalThis.__newstartMockState = nextState;
  return globalThis.__newstartMockState;
}

export function resetMockState() {
  globalThis.__newstartMockState = createDefaultState();
  return globalThis.__newstartMockState;
}
