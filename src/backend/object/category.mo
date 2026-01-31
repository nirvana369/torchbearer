import Map "mo:core/Map";
import Types "mo:core/Types";
import Nat "mo:core/Nat";
import T "types";

module {
    public class CategoryManager(map : Types.Map<Nat, T.Category>) {
        
        public func getCategoryById(id : Nat) : ?T.Category {
            Map.get(map, Nat.compare, id);
        };

        public func addCategory(id : Nat, category : T.Category) : () {
           Map.add(map, Nat.compare, id, category);
        };

        public func deleteCategory(id : Nat) : Bool {
           Map.delete(map, Nat.compare, id);
        };

        public func updateCategory(id : Nat, category : T.Category) : () {
           Map.add(map, Nat.compare, id, category);
        };

    };
};