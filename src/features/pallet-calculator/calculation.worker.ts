import { calculate, type Input } from "@/lib/pallet-engine/calculate";
self.onmessage = (event: MessageEvent<Input>) =>
  self.postMessage(calculate(event.data));
