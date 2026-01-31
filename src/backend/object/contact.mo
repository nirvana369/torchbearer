import Map "mo:core/Map";
import Types "mo:core/Types";
import Nat "mo:core/Nat";
import T "types";

module {
    public class ContactLocationManager(map : Types.Map<Nat, T.ContactLocation>) {
        
        public func getContactLocationById(id : Nat) : ?T.ContactLocation {
            Map.get(map, Nat.compare, id);
        };

        public func addContactLocation(id : Nat, location : T.ContactLocation) : () {
           Map.add(map, Nat.compare, id, location);
        };

        public func deleteContactLocation(id : Nat) : Bool {
           Map.delete(map, Nat.compare, id);
        };

        public func updateContactLocation(id : Nat, location : T.ContactLocation) : () {
           Map.add(map, Nat.compare, id, location);
        };

    };
};