import Map "mo:core/Map";
import Types "mo:core/Types";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import T "types";

module {
    public class UserManager(map : Types.Map<Principal, T.UserProfile>) {
        
        public func getUserProfile(principal : Principal) : ?T.UserProfile {
            Map.get(map, Principal.compare, principal);
        };

        public func addUserProfile(principal : Principal, profile : T.UserProfile) : () {
           Map.add(map, Principal.compare, principal, profile);
        };

        public func deleteUserProfile(principal : Principal) {
           Map.remove(map, Principal.compare, principal);
        };

        public func updateUserProfile(principal : Principal, profile : T.UserProfile) {
           Map.add(map, Principal.compare, principal, profile);
        };
    };
};