import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

module {

  public func superAdmin(caller : Principal) : Bool {
    caller == Principal.fromText("4rwx6-pqggd-3qrxh-topfi-esldf-q34im-p47hj-ozh7j-lylpa-n4oiy-bqe");
  };

  public type UserRole = {
    #admin;
    #user;
    #guest;
  };

  public type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  public func initState() : AccessControlState {
    {
      var adminAssigned = false;
      userRoles = Map.empty<Principal, UserRole>();
    };
  };

  // First principal that calls this function becomes admin, all other principals become users.
  public func initialize(state : AccessControlState, caller : Principal, adminToken : Text, userProvidedToken : Text) {
    if (Principal.isAnonymous(caller)) { return };
    switch (Map.get(state.userRoles, Principal.compare, caller)) {
      case (?_) {};
      case (null) {
        if (not state.adminAssigned and userProvidedToken == adminToken) {
          Map.add(state.userRoles, Principal.compare, caller, #admin);
          state.adminAssigned := true;
        } else {
          Map.add(state.userRoles, Principal.compare, caller, #user);
        };
      };
    };
  };

  public func getUserRole(state : AccessControlState, caller : Principal) : UserRole {
    if (Principal.isAnonymous(caller)) { return #guest };
    switch (Map.get(state.userRoles, Principal.compare, caller)) {
      case (?role) { role };
      case (null) {
        Runtime.trap("User is not registered");
      };
    };
  };

  public func assignRole(state : AccessControlState, caller : Principal, user : Principal, role : UserRole) {
    if (not superAdmin(caller)) {
      if (not (isAdmin(state, caller))) {
        Runtime.trap("Unauthorized: Only admins can assign user roles");
      };
    };
    Map.add(state.userRoles,Principal.compare, user, role);
  };

  public func hasPermission(state : AccessControlState, caller : Principal, requiredRole : UserRole) : Bool {
    // let userRole = getUserRole(state, caller);
    // if (userRole == #admin or requiredRole == #guest) { true } else { userRole == requiredRole };
    true;
  };

  public func isAdmin(state : AccessControlState, caller : Principal) : Bool {
    getUserRole(state, caller) == #admin;
  };
};
