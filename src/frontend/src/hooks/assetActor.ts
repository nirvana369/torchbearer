import { createActorHook } from "ic-use-actor";
import { canisterId, idlFactory } from "../../../declarations/assets";
import { _SERVICE } from "../../../declarations/assets/assets.did";

console.log("canisterId in actor hook:", canisterId);

export const useAssetBackendActor = createActorHook<_SERVICE>({
  canisterId,
  idlFactory,
});