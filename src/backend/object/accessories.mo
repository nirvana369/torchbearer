// import Map "mo:core/Map";
// import Types "mo:core/Types";
// import Nat "mo:core/Nat";
// import T "types";

// module {
//     public class AccessoriesManager(map : Types.Map<Nat, T.Accessories>) {
        
//         public func getAccessoriesById(id : Nat) : ?T.Accessories {
//             Map.get(map, Nat.compare, id);
//         };

//         public func addAccessories(id : Nat, accessories : T.Accessories) : () {
//            Map.add(map, Nat.compare, id, accessories);
//         };

//         public func deleteAccessories(id : Nat) : Bool {
//            Map.delete(map, Nat.compare, id);
//         };

//         public func updateAccessories(id : Nat, accessories : T.Accessories) : () {
//            Map.add(map, Nat.compare, id, accessories);
//         };

//     };
// };