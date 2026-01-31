import Map "mo:core/Map";
import Types "mo:core/Types";
import Nat "mo:core/Nat";
import T "types";
import Array "mo:core/Array";

module {
    public class ProductManager(map : Types.Map<Nat, T.Product>) {
        
        public func getProductById(id : Nat) : ?T.Product {
            Map.get(map, Nat.compare, id);
        };

        public func addProduct(id : Nat, product : T.Product) : () {
           Map.add(map, Nat.compare, id, product);
        };

        public func deleteProduct(id : Nat) : Bool {
           Map.delete(map, Nat.compare, id);
        };

        public func updateProduct(id : Nat, product : T.Product) : () {
           Map.add(map, Nat.compare, id, product);
        };

        public func getListProduct(offset : Nat, limit : Nat) : [(Nat, T.Product)] {
            let iter = Array.fromIter(Map.entries(map));
            let products = Array.sliceToArray<(Nat, T.Product)>(iter, offset, limit);
            products;
        };
    };
}