import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";

module {
    public class ObjectCRUD<K, V>(map : Map.Map<K, V>, keyCompare : (K, K) -> Order.Order) {

        public func create(k : K, v : V) : () {
           Map.add<K, V>(map, keyCompare, k, v);
        };

        public func read(k : K) : ?V {
            Map.get<K, V>(map, keyCompare, k);
        };

        public func update(k : K, v : V) : () {
           Map.add<K, V>(map, keyCompare, k, v);
        };

        public func delete(k : K) : Bool {
           Map.delete<K, V>(map, keyCompare, k);
        };

        public func getAll() : [(K, V)] {
            let iter = Map.entries(map);
            Array.fromIter(iter);
        };

        public func getAllValues() : [V] {
            let iter = Map.values(map);
            Array.fromIter(iter);
        };

        public func getList(offset : Nat, limit : Nat) : [(K, V)] {
            let iter = Array.fromIter(Map.entries(map));
            let list = Array.sliceToArray<(K, V)>(iter, offset, limit);
            list;
        };

        public func getListValues(offset : Nat, limit : Nat) : [V] {
            let iter = Array.fromIter(Map.values(map));
            let list = Array.sliceToArray<V>(iter, offset, limit);
            list;
        };

        public func filter(predicate : (K, V) -> Bool) : [(K, V)] {
            let mf = Map.filter<K, V>(map, keyCompare, predicate);
            let iter = Map.entries(mf);
            Array.fromIter(iter);
        };

        public func isExist(k : K) : Bool {
            Map.containsKey<K, V>(map, keyCompare, k);
        };

        public func size() : Nat {
            Map.size(map);
        };
    };
};