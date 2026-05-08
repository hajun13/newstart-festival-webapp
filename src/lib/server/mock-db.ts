import { createDefaultState } from "@/lib/state";
import type { AppState } from "@/lib/types";

let state: AppState = createDefaultState();

export function getMockState() {
  return state;
}

export function setMockState(nextState: AppState) {
  state = nextState;
  return state;
}

export function resetMockState() {
  state = createDefaultState();
  return state;
}
