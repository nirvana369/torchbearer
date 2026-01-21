import Types "types";
import Text "mo:core/Text";
import Array "mo:core/Array";

module {
    

    public func init(p : Text, admins : [Text]) : Role {
        let r = Role(p);
        r.setAdmins(admins);
        r;
    };

    public class Role(p : Text) = this {

        var superAdmin = p;
        var _admin = Array.empty<Text>();

        public func setAdmins(list : [Text]) {
            for (p in list.vals()) _admin := Array.flatten<Text>([_admin, [p]]);
        };

        public func addAdmin(admins : [Text]) {
            for (p in admins.vals()) {
                switch(Array.findIndex<Text>(_admin, func (x) { x == p})) {
                    case(null) { _admin := Array.flatten<Text>([_admin, [p]]); };
                    case(?_) { };
                };
            };
        };

        public func iterAdmins(f : (Text) -> ()) {
            for (p in _admin.vals()) {
                 f(p);
            }
        };

        public func asynIterAdmins(f : (Text) -> async ()) : async () {
            for (p in _admin.vals()) {
                await f(p);
            }
        };

        public func verify(p : Text) : ?Types.Roles {
            // if (p == "2vxsx-fae") return ?(#anonymous); //
            if (p == "2vxsx-fae") return ?(#superadmin); //
            if (p == superAdmin) return ?(#superadmin); //
            switch(Array.findIndex<Text>(_admin, func (x) { x == p})) {
                case(null) {  };
                case(?_) { return ?(#admin) };
            };
            return ?(#user);
        };

        public func getAdmins() : [Text] {
            _admin
        };


        public func setSuperAdmin(p : Text) {
            superAdmin := p;
        };

        public func getSuperAdmin() : Text {
            return superAdmin;
        };

        public func getRoles() : [(Text, Types.Roles)] {
            var buf = Array.empty<(Text, Types.Roles)>();
            buf := [(superAdmin, #superadmin)];
            iterAdmins(func (a) {
                buf := Array.flatten<(Text, Types.Roles)>([buf, [(a, #admin)]]);
            });
            buf;
        };
    };
}