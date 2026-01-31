import Map "mo:core/Map";
import Types "mo:core/Types";
import Nat "mo:core/Nat";
import T "types";

module {
    public class CustomerManager(map : Types.Map<Nat, T.CustomerMessage>) {
        
        public func getCustomerById(id : Nat) : ?T.CustomerMessage {
            Map.get(map, Nat.compare, id);
        };

        public func addCustomer(id : Nat, customer : T.CustomerMessage) : () {
           Map.add(map, Nat.compare, id, customer);
        };

        public func deleteCustomer(id : Nat) : Bool {
           Map.delete(map, Nat.compare, id);
        };

        public func updateCustomer(id : Nat, customer : T.CustomerMessage) : () {
           Map.add(map, Nat.compare, id, customer);
        };

    };
};