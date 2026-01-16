import { createActorHook } from "ic-use-actor";
import { canisterId, idlFactory } from "../../../declarations/backend";
import { _SERVICE } from "../../../declarations/backend/backend.did";

console.log("canisterId in actor hook:", canisterId);

export const useBackendActor = createActorHook<_SERVICE>({
  canisterId,
  idlFactory,
});