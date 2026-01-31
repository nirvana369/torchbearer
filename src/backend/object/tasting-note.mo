import Map "mo:core/Map";
import Types "mo:core/Types";
import Nat "mo:core/Nat";
import T "types";

module {
    public class TastingNoteManager(map : Types.Map<Nat, T.TastingNote>) {
        
        public func getTastingNoteById(id : Nat) : ?T.TastingNote {
            Map.get(map, Nat.compare, id);
        };

        public func addTastingNote(id : Nat, note : T.TastingNote) : () {
           Map.add(map, Nat.compare, id, note);
        };

        public func deleteTastingNote(id : Nat) : Bool {
           Map.delete(map, Nat.compare, id);
        };

        public func updateTastingNote(id : Nat, note : T.TastingNote) : () {
           Map.add(map, Nat.compare, id, note);
        };

    };
};