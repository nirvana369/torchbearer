import Time "mo:core/Time";
import Int "mo:core/Int";
import Timer "mo:core/Timer";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Queue "mo:core/Queue";
import Array "mo:core/Array";

module {
    public type ProfilerCanister = actor {
        push : ([ProfileResult]) -> async ();
    };

    public type Profile = {
        id : Text;
        action : Text;
        start : Int;
        end : Int;
    };

    public type ProfileResult = {
        id : Text;
        count : Nat;
        avgProcTime : Int;
        totalProcTime : Int;
    };

    public class Profiler(name : Text) = this {
        // let canister : ProfilerCanister = actor (canisterId);
        var queue = Queue.empty<Profile>();
        var res = Array.empty<ProfileResult>();

        func pushProfile() : () {
            let map = Map.empty<Text, ProfileResult>();

            for (i in res.vals()) {
                Map.add(map, Text.compare, i.id, i);
            };
            res := Array.empty<ProfileResult>();

            // while (not queue.isEmpty()) {
            //     let item = queue.popFront();
            //     switch (item) {
            //         case null { };
            //         case (?p) {
            //             switch (map.get(p.0.action)) {
            //                 case null {
            //                     map.put(p.0.action, {
            //                         id = p.0.action;
            //                         count = 1;
            //                         totalProcTime = p.0.end - p.0.start;
            //                         avgProcTime = p.0.end - p.0.start;
            //                     });
            //                 };
            //                 case (?c) {
            //                     let totalProc = c.totalProcTime + (p.0.end - p.0.start);
            //                     let avgProc = totalProc / (c.count + 1);
            //                     map.put(p.0.action, {
            //                         id = p.0.action;
            //                         count = c.count + 1;
            //                         totalProcTime = totalProc;
            //                         avgProcTime = avgProc;
            //                     });
            //                 };
            //             };
            //         };
            //     };
            // };
            // for (i in map.vals()) {
            //     res.add(i);
            // }
        };

        // let timer = Timer.recurringTimer(#seconds (5), pushProfile);

        public func push(funcName : Text) : Profile {
            let t = Time.now();
            let act = name # "." # funcName;
            return {
                id = act # "." # Int.toText(t);
                action = act;
                start = t;
                end = 0;
            };
        };

        public func pop(p : Profile) {
            let obj : Profile = {
                id = p.id;
                action = p.action;
                start = p.start;
                end = Time.now();
            };
            // queue.pushBack<Profile>(obj);
        };

        public func clear() {
            res := Array.empty<ProfileResult>();
        };

        public func get() : [ProfileResult] {
            pushProfile();
            res
        };
    };
}