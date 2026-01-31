import Map "mo:core/Map";
import Types "mo:core/Types";
import Nat "mo:core/Nat";
import T "types";

module {

    public class PairingFoodManager(map : Types.Map<Nat, T.PairingFood>) {
        
        public func getPairingFoodById(id : Nat) : ?T.PairingFood {
            Map.get(map, Nat.compare, id);
        };

        public func addPairingFood(id : Nat, food : T.PairingFood) : () {
           Map.add(map, Nat.compare, id, food);
        };

        public func deletePairingFood(id : Nat) : Bool {
           Map.delete(map, Nat.compare, id);
        };

        public func updatePairingFood(id : Nat, food : T.PairingFood) : () {
           Map.add(map, Nat.compare, id, food);
        };

    };
};