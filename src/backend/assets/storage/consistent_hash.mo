// import Text "mo:core/Text";
// import Nat64 "mo:core/Nat64";
// import Bisect "mo:bisect";
// import XXHash32 "mo:xxhash";
// import Blob "mo:core/Blob";
// import Order "mo:core/Order";
// import Array "mo:core/Array";
// import Iter "mo:core/Iter";
// import Result "mo:core/Result";
// import Nat "mo:core/Nat";
// import Time "mo:core/Time";
// import Types "./types";
// import Principal "mo:core/Principal";
// import Nat32 "mo:core/Nat32";

// //  Trường hợp nếu không tìm thấy dữ liệu trong node thì broadcast all node để tìm dữ liệu đang thất lạc ở node nào và thực hiện
// //  consistent hashing & move dữ liệu đến đúng node (rơi vào trường hợp khi node được thêm mà chưa migrate dữ liệu)
// module {

//     public func xxhash(key : Text) : Nat32 {
//         let buffer = Text.encodeUtf8(key);
//         // let b = Blob.toArray(buffer);
//         // Nat64.toNat32(XXHash32.hash(b, 0));
//         XXHash32.hash(#blob buffer, null);
//     };

//     public type VirtualNode = {
//         ids : Buffer.Buffer<Text>;  // principal id
//         hash : Nat32;
//     };

//     public type UploaderResponse = {
//         #Ok : Text;
//         #Failed : Text;
//         #Ready : Text;
//         #Existed : Text;
//         #File404 : Text;
//         #Chunk404 : Text;
//         #Node404 : Text;
//         #UploadFailed : Text;
//         #VerificationFailed : Text;
//     };

//     public func mkey(k : Nat64) : Text {
//         return Nat64.toText(k);
//     };

//     let sortFunc = func <T>(arr : [T], cmp : (T, T) -> Order.Order) : [T] {
//         // need binary sort for best performance
//         Array.sort<T>(arr, cmp);
//     };

//     public class ConsistentHash() {
//         // Consistent Hashing implementation using OrderedMap
//         let map = Map.Make<Nat32>(Nat32.compare);
//         var ring : Map.Map<Nat32, VirtualNode> = map.empty<VirtualNode>();
        
//         func _checkExisted(key : Nat32, id : Text) : ?VirtualNode {
//             let listNode = switch (map.get(ring, key)) {
//                             case (?n) {
//                                 switch (Buffer.indexOf(id, n.ids, Text.equal)) {
//                                     case (?_) return null;
//                                     case (_) {
//                                         n.ids.add(id);
//                                         n.ids;
//                                     };
//                                 };
//                             };
//                             case (_) Buffer.make<Text>(id);
//                         };
//             return ?({
//                 ids = listNode;
//                 hash = key;
//             });
//         };

//         public func setNodes(ids : [Text]) : () {
//             ring := map.empty<VirtualNode>();
//             // Thêm nhiều node vào danh sách các node ảo
//             for (id in ids.vals()) {
//                 addNode(id);
//             };
//         };


//         public func addNodes(ids : [Text]) : () {
//             // Thêm nhiều node vào danh sách các node ảo
//             for (id in ids.vals()) {
//                 addNode(id);
//             };
//         };

//         public func addNode(id : Text) : () {
//             // Thêm node vào danh sách các node ảo
//             let hash = xxhash(id);
//             switch (_checkExisted(hash, id)) {
//                 case (?node) {
//                     ring := map.put(ring, hash, node);
//                 };
//                 case (_) (); // case null -> existed
//             };
//         };

//         public func get_node(id : Text) : ?VirtualNode {
//             // Tìm kiếm node trong danh sách các node ảo
//             let hash = xxhash(id);
//             let nodesHash = Iter.toArray(map.keys(ring));
//             let idx = Bisect.bisect_right<Nat32>(nodesHash, hash, null, null, Nat32.compare) ;
//             let key = nodesHash[idx % nodesHash.size()];
//             map.get(ring, key);
//         };

//         public func get_node_id(id : Text) : ?Text {
//             // Tìm kiếm node trong danh sách các node ảo
//             let hash = xxhash(id);
//             let nodesHash = Iter.toArray(map.keys(ring));
//             let idx = Bisect.bisect_right<Nat32>(nodesHash, hash, null, null, Nat32.compare) ;
//             let key = nodesHash[idx % nodesHash.size()];
//             switch (map.get(ring, key)) {
//                 case (?node) {
//                     if (node.ids.size() == 1) {
//                         return ?Buffer.first(node.ids);
//                     };
//                     // trường hợp nhiều node trong cùng một vùng hash
//                     // thì lấy node theo thứ tự vòng tròn
//                     return ?node.ids.get(Nat32.toNat(node.hash) % node.ids.size());
//                 };
//                 case (_) return null;
//             };
//         };

//         public func get_vnode_ranges() : [(Nat32, Nat32, VirtualNode)] {
//             // Trả về danh sách các vùng hash của từng virtual node
//             var ranges = Buffer.Buffer<(Nat32, Nat32, VirtualNode)>(0);
//             let nodesHash = Iter.toArray(map.entries(ring));
//             let n = nodesHash.size();
//             for (i in Iter.range(0, n - 1)) {
//                 let start = nodesHash[i];
//                 let end = nodesHash[(i + 1) % n];
//                 ranges.add(start.0, end.0, start.1);
//             };
//             return Buffer.toArray(ranges);
//         };
//     };
// }