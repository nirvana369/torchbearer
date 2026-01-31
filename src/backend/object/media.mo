import Map "mo:core/Map";
import Types "mo:core/Types";
import Nat "mo:core/Nat";
import T "types";

module {

    public class MediaManager(map : Types.Map<Nat, T.MediaItem>) {
        
        public func getMediaById(id : Nat) : ?T.MediaItem {
            Map.get(map, Nat.compare, id);
        };

        public func addMedia(id : Nat, media : T.MediaItem) : () {
           Map.add(map, Nat.compare, id, media);
        };

        public func deleteMedia(id : Nat) : Bool {
           Map.delete(map, Nat.compare, id);
        };

        public func updateMedia(id : Nat, media : T.MediaItem) : () {
           Map.add(map, Nat.compare, id, media);
        };

    };
};