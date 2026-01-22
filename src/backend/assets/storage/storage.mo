import Types "types";
import RBAC "roles";
import Profiler "./profiler";

import Cycles "mo:core/Cycles";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Array "mo:core/Array";
import Text "mo:core/Text";
// import DS "./consistent_hash";
import Map "mo:core/Map";
import Blob "mo:core/Blob";
import List "mo:core/List";
import Time "mo:core/Time";

shared ({caller}) persistent actor class FileStorage() = this {
    
    // =========================================================================
    // CONSTANTS AND CONFIGURATION
    // =========================================================================
    
    /// Default chunk size (2MB)
    transient var CHUNK_SIZE = 2_000_000;
    
    /// Version identifier
    transient let version = "FileStorage - v0.1.1";
    
    // =========================================================================
    // STATE VARIABLES
    // =========================================================================
    
    /// Total data size stored in canister (in bytes)
    var totalCanisterDataSize = 0;
    
    /// Stable storage for files
    /**
    *   
    *   1.Key: FileList -> list [file_name]
    *   2.Key: file_name -> Types.FileInfo -> [chunk_hash]
    *   3.Key: chunk_hash -> FileChunk
    **/
    let fileStore = Map.empty<Text, Types.File_R>();
    
    /// Role-based access control system
    transient let rm : RBAC.Role = RBAC.init(Principal.toText(caller), []);
    
    /// Performance profiler
    transient let profiler = Profiler.Profiler("FileStorage");

    var fileList = Array.empty<Text>();
    let upcomingChunkUpload = Map.empty<Text, (Text, Int)>();

    let NANO_SECOND = 1_000_000_000;
    
    // =========================================================================
    // ERROR TYPES
    // =========================================================================
    
    type Error = {
        #PermissionDenied;
        #FileNotFound;
        #NotFileOwner;
        #NodeNotFound;
        #StorageFull;
        #InvalidTask;
        #NetworkError : Text;
    };
    
    // =========================================================================
    // INTERNAL HELPER FUNCTIONS
    // =========================================================================
    
    /// Validates if caller has appropriate permissions
    private func _validCaller(caller : Principal) : Bool {
        switch (rm.verify(Principal.toText(caller))) {
            case (null or ?#anonymous or ?#user) false;
            case (_) true;
        };
    };

    public shared ({caller}) func listFiles() : async [Text] {
        fileList
    };

    public shared ({caller}) func clean(isRemove : Bool) : async Result.Result<[(Text, (Text, Int))], Text> {
        if (not _validCaller(caller)) {
            return #err "Permission invalid";
        };

        let res = Map.entries(upcomingChunkUpload);
        if (isRemove) {
            let timeNow = Time.now() / NANO_SECOND;
            let files = Map.empty<Text, Bool>();
            for ((chunkHash, (fileName, timestamp)) in res) {
                if (timeNow - timestamp > 3600) { // upload is not successfully in 1 hour
                    ignore Map.delete(upcomingChunkUpload, Text.compare, chunkHash);
                    Map.add(files, Text.compare, fileName, true);
                };
            };

            for ((fileName, _) in Map.entries(files)) {
                switch (Map.get(fileStore, Text.compare, fileName)) {
                    case (null) { };
                    case (?file) {
                        let f : ?Types.FileInfo = from_candid(file.header);
                        switch (f) {
                            case (null) { 
                                // invalid file info, delete the file
                                ignore Map.delete(fileStore, Text.compare, fileName);
                            };
                            case (?finfo) {
                                var count = 0;
                                label LOOP for (hash in finfo.chunks.vals()) {
                                    switch (Map.get(fileStore, Text.compare, hash)) {
                                        case (null) {
                                            break LOOP;
                                        };
                                        case (_) {
                                            count += 1;
                                        };
                                    };
                                };

                                if (count != finfo.chunks.size()) {
                                    // incomplete file, delete it
                                    for (hash in finfo.chunks.vals()) {
                                        ignore Map.delete(fileStore, Text.compare, hash);
                                    };
                                };
                            };
                        };
                    };
                };
            };

            fileList := Array.filter(fileList, func (x) {
                switch (Map.get(files, Text.compare, x)) {
                    case (null) true;
                    case (?rm) rm;
                };
            });
        };
        #ok (Array.fromIter(res));
    };

    /// Stores a file in the storage system
    public shared ({caller}) func registerUploadFile(key : Text, file : Types.FileInfo) : async Result.Result<(), Text> {
        if (not _validCaller(caller)) {
            return #err "Permission invalid";
        };

        ignore clean(true);

        let p = profiler.push("putFile");
        fileList := Array.flatten<Text>([fileList, [key]]);

        let secondNow = Time.now() / NANO_SECOND;
        for (hash in file.chunks.vals()) {
            Map.add(upcomingChunkUpload, Text.compare, hash, (key, secondNow));
        };

        let f : Types.File_R = {
            header = to_candid(file);
            data = Blob.empty();
        };
        
        let size = f.header.size() + f.data.size();
        // Check storage capacity
        
        Map.add(fileStore, Text.compare, key, f);
        totalCanisterDataSize += size;
        
        profiler.pop(p);
        #ok(())
    };
    // =========================================================================
    // FILE OPERATIONS (CRUD)
    // =========================================================================
    
    /// Stores a file in the storage system
    public shared ({caller}) func putFile(key : Text, fileData : Types.FileChunk) : async Result.Result<(), Text> {
        switch (Map.get(upcomingChunkUpload, Text.compare, key)) {
            case (null) {
                return #err "Chunk upload not registered!"
            };
            case (_) ();
        };
        
        let p = profiler.push("putFile");

        let file : Types.File_R = {
            header = Blob.empty();
            data = to_candid(fileData);
        };
        
        let size = file.header.size() + file.data.size();
        // Check storage capacity
        
        Map.add(fileStore, Text.compare, key, file);

        ignore Map.delete(upcomingChunkUpload, Text.compare, key);
        totalCanisterDataSize += size;
        
        profiler.pop(p);
        #ok(())
    };
    
    /// Retrieves a file from storage
    public query ({caller}) func getFileInfo(key : Text) : async Result.Result<Types.FileInfo, Text> {
        let p = profiler.push("getFile");
        
        switch (Map.get(fileStore, Text.compare, key)) {
            case (null) { 
                profiler.pop(p);
                #err "File not found!" 
            };
            case (?file) {
                let header : ?Types.FileInfo = from_candid(file.header);
                profiler.pop(p);
                switch(header) {
                    case (?h) #ok (h);
                    case (null) #err "File can't deserialized";
                };
            };
        };
    };

    public query ({caller}) func getFileChunk(hash : Text) : async Result.Result<Types.FileChunk, Text> {
        let p = profiler.push("getFile");
        
        switch (Map.get(fileStore, Text.compare, hash)) {
            case (null) { 
                profiler.pop(p);
                #err "File not found!" 
            };
            case (?file) {
                let chunk : ?Types.FileChunk = from_candid(file.data);
                
                profiler.pop(p);
                switch(chunk) {
                    case (?c) #ok (c);
                    case (null) #err "File can't deserialized";
                };
            };
        };
    };
    
    /// Checks if file exists
    public query ({caller}) func isExisted(key : Text) : async Result.Result<Bool, Text> {
        let p = profiler.push("isExisted");
        let exists = switch(Map.get(fileStore, Text.compare, key)) {case (null) false; case (?_) true; };
        profiler.pop(p);
        #ok(exists)
    };
    
    /// Deletes a file from storage
    public shared ({caller}) func deleteFile(key : Text) : async Result.Result<(Bool), Text> {
        let p = profiler.push("deleteFile");
        if (not _validCaller(caller)) {
            return #err "Permission invalid";
        };
        switch (Map.get(fileStore, Text.compare, key)) {
            case (null) { 
                profiler.pop(p);
                #err "File not exist!" 
            };
            case (?file) {
                let res = Map.delete(fileStore, Text.compare, key);
                if (res == true) {
                    let file_size = file.header.size() + file.data.size();
                    if (totalCanisterDataSize >= file_size) {
                        totalCanisterDataSize -= file_size;
                    };
                };
                profiler.pop(p);
                #ok((res));
            };
        };
    };
    
    // =========================================================================
    // CANISTER MANAGEMENT
    // =========================================================================
    
    /// Returns canister ID
    public shared(msg) func getCanisterId() : async Text {
        Principal.toText(Principal.fromActor(this))
    };
    
    
    /// Returns storage information
    public func getStorageInfo() : async {mem: Text; cycle: Text} {
        {
            mem = Nat.toText(totalCanisterDataSize / 1_000_000) # " MB";
            cycle = Nat.toText(Cycles.balance() / 1_000_000_000_000) # " T cycles"
        }
    };
    
    /// Changes chunk size configuration
    public shared ({caller}) func changeChunkSize(size : Nat) : async Result.Result<(), Text> {
        if (not _validCaller(caller)) {
            return #err "Permission invalid";
        };
        
        CHUNK_SIZE := size;
        #ok(())
    };

    
    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================
    
    public shared ({caller}) func addAdmins(admins : [Principal]) : async ([(Text, Types.Roles)]) {
        rm.setAdmins(Array.map<Principal, Text>(admins, func (p) { Principal.toText(p) }));
        rm.getRoles()
    };

    /// Returns caller's principal
    public query ({caller}) func whoami() : async Text {
        Principal.toText(caller)
    };
    
    /// Returns RBAC roles
    public query func getRoles() : async [(Text, Types.Roles)] {
        rm.getRoles()
    };
    
    /// Returns profiler data
    public func getProfiler() : async [Profiler.ProfileResult] {
        profiler.get()
    };
    
    /// Returns version information
    public func getVersion() : async Text {
        version
    };
    
    // =========================================================================
    // PLACEHOLDER FOR FUTURE IMPLEMENTATION
    // =========================================================================
    
    public shared ({caller}) func watcherCallback() : async Result.Result<(), Text> {
        if (_validCaller(caller)) {
            // Implementation for watcher callback
            #ok(())
        } else {
            #err "Permission invalid"
        }
    };
};