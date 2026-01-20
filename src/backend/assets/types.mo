import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Bool "mo:core/Bool";
import Text "mo:core/Text";

module {
    
    public type IDMapType = {
        #single : Nat; // single id
        #multiple : [Nat]; // multiple ids
    };

    // Database section
    public type IDMappingEntity = {
        id : IDMapType;
        user_id : Nat;
    };

    public type BadgeEntity = {
        id : Nat;
        user_id : Nat;
        name : Text;
        description : Text;
        icon : Text; // URL to the badge icon
        created_at : Int;
        updated_at : Int;
    };

    public type KeyEntity = {
        id : Nat;
        user_id : Nat;
        public_key : Blob; // Public key of the user
        private_key : Blob; // Private key of the user
        created_at : Int;
        updated_at : Int;
    };

    public type ProfileEntity = {
        id : Nat;
        user_id : Nat;
        name : Text;
        description : ?Text;
        email : ?Text;
        avatar : ?Text;
        created_at : Int;
        updated_at : Int;
    };

    public type UserAuthEntity = {
        id : Nat;
        user_id : Nat;
        principal : ?Principal; // Principal of the user
        created_at : Int;
    };

    public type WalletEntity = {
        id : Nat;
        user_id : Nat;
        address : Text;
        seed : Blob;
        balance : Nat;
        updated_at : Int;
    };

    public type FeatureEntity = {
        user : ?UserAuthEntity;
        wallet : ?WalletEntity;
        profile : ?ProfileEntity;
        badge : ?BadgeEntity;
        key : ?KeyEntity; // Key management
    };
    // End database section

    // don't change this order -> state stored in database
    public let UserFeatureIndex = {
        User  = 0;
        Wallet = 1;
        Profile = 2;
        Badge = 3;
        Key = 4; // Key management
        // when a canister done a task -> get owner of the canister 
        // -> get user principal -> get mapping user id -> add reward transaction to block
        Size = 5; // Total number of fields
    };

    public type UserFeatureId = [Nat];

    public type TaskState = {
        #created : Nat; // Task created
        #inProgress : Nat; // Task in progress
        #completed : Nat; // Task completed
        #remove : Nat; // Task failed
    };

    public type TaskType = {
        #feedback : GenericValue; // Feedback task
        #bugReport : GenericValue; // Bug report task
        #findChunk : GenericValue; // File chunk retrieval task
        #dataVerification : GenericValue; // Data verification task -> find node based on hash then verify all chunks existed
        #fileUploadSuccessfully : GenericValue; // miner need verify #fileUploadSuccessfully task -> if ok -> reward
        // -> call manager update state file to ready
    };

    public type Task = {
        var id : Nat; // Unique task ID
        var userId : Nat; // User ID of the task creator
        var taskType : TaskType; // Type of the task
        var info : Text; // Information about the task
        var state : TaskState; // Current state of the task
        var createdAt : Int; // Timestamp when the task was created
    };

    public type GenericValue = { 
        blob : Blob; 
        text : Text; 
        nat : Nat;
        int : Int;
        array : [GenericValue]; 
        dictionary : [(Text, GenericValue)]; 
    };

    public type StorageCommand = {
        #Put : (Text, GenericValue);
        #Get : Text;
        #Delete : Text;
        #Migrate : [Text]; // List of node IDs to migrate data to
    };

    // public type LOG_LEVEL = {
    //     // log level for notification
    //     #MANAGER;
    //     #NOTIFICATION;
    //     // dev
    //     #DEBUG;
    //     #INFO;
    //     #WARNING;
    //     #ERROR;
    // };


    public type File_R = {
        header : Blob;  // metadata of file - use from_candid to decode
        data : Blob;
    };

    public type FileState = {
        #ready;
        #empty;
    };
    public type FileData = {
        #metadata : FileInfo;
        #chunk : FileChunk;
    };

    public type File = {
        data : FileData;
        hash : Text;
        userId : Nat;
        // signature : [Blob]; -> to verify file owner by signed hash
    };

    public type FileInfo = {
        name : Text;
        chunks : [Text];
        size : Nat;
        state : FileState;
        lastTimeUpdate : Int;
    };

    public type FileChunk = {
        id : Nat;
        data : Blob;
    };

    // public type StorageInterface = actor  {
    //     putFile : shared (key : Text, file : File) -> async Result.Result<(), Text>;
    //     getFile : shared (key : Text) -> async Result.Result<File, Text>;
    //     deleteFile : shared (Text) -> async Result.Result<(), Text>;
    //     // putChunk : shared (key : Text, chunk : FileChunk) -> async Result.Result<(), Text>;
    //     // getChunk : shared (key : Text) -> async Result.Result<FileChunk, Text>;
    //     // deleteChunk : shared (key : Text) -> async Result.Result<(), Text>;
    //     migrate : shared (nodes : [Text]) -> async Result.Result<(), Text>;
    //     migrateState: shared (nodes : [Text]) -> async Result.Result<Text, Text>;
    //     // whoami : query () -> async Text;
    // };

    public type StorageInterface = actor  {
        putFile : shared (key : Text, file : File_R) -> async Result.Result<(), Text>;
        getFile : shared (key : Text) -> async Result.Result<File_R, Text>;
        deleteFile : shared (Text) -> async Result.Result<(), Text>;
        // putChunk : shared (key : Text, chunk : FileChunk) -> async Result.Result<(), Text>;
        // getChunk : shared (key : Text) -> async Result.Result<FileChunk, Text>;
        // deleteChunk : shared (key : Text) -> async Result.Result<(), Text>;
        migrate : shared (nodes : [Text]) -> async Result.Result<(), Text>;
        migrateState: shared (nodes : [Text]) -> async Result.Result<Text, Text>;
        // whoami : query () -> async Text;
    };

    public type FileRegistry = actor {
        eventHandler : query (Event) -> async ();
        idGenChunk : shared () -> async (Nat);
        updateFileState : shared (Nat, Nat, FileState) -> async ();
    };

    public type Event = {
        // event control file & chunk state
        #UpdateFileState : (Nat, Nat, FileState);   //  #UpdateFileTreeState(FileTreeId, FileId); -> update state file to ready
        #DeleteChunk : (Text, Nat); // canister id, chunkid
        // event control roles
        #SyncRole : [(Principal, Roles)];
    };

    public type Roles = {
        #superadmin; // level 1
        #admin;      // 2
        #storage;    // 3
        #user;       // 4
        #anonymous;  // 5
    };

    //HTTP
    public type HeaderField = (Text, Text);
    public type HttpResponse = {
        status_code: Nat16;
        headers: [HeaderField];
        body: Blob;
        streaming_strategy: ?HttpStreamingStrategy;
        upgrade : ?Bool;
    };
    public type HttpRequest = {
        method : Text;
        url : Text;
        headers : [HeaderField];
        body : Blob;
    };
    public type HttpStreamingCallbackToken =  {
        content_encoding: Text;
        index: Nat;
        key: Text;
        sha256: ?Blob;
    };

    public type HttpStreamingStrategy = {
        #Callback: {
            callback: shared query (HttpStreamingCallbackToken) -> async (HttpStreamingCallbackResponse);
            token: HttpStreamingCallbackToken;
        };
    };

    public type HttpStreamingCallbackResponse = {
        body: Blob;
        token: ?HttpStreamingCallbackToken;
    };
    
}