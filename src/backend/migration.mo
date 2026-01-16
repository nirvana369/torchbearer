import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import AdminCMS "admin-cms";

module {
  type OldIconLink = {
    icon : Text;
    link : Text;
  };

  type OldMediaItem = {
    id : Nat;
    url : Text;
    caption : Text;
    description : Text;
    uploadTimestamp : Int;
    mediaType : Text;
  };

  type OldCategory = {
    id : Text;
    name : Text;
    description : Text;
  };

  type OldProduct = {
    name : Text;
    description : Text;
    imageUrl : Text;
    price : Nat;
    categories : [Text];
  };

  type OldCartItem = {
    product : OldProduct;
    quantity : Nat;
  };

  type OldOrderItem = {
    product : OldProduct;
    quantity : Nat;
    totalPrice : Nat;
  };

  type OldOrder = {
    id : Nat;
    customerName : Text;
    customerEmail : Text;
    customerPhone : Text;
    items : [OldOrderItem];
    totalAmount : Nat;
    timestamp : Int;
    status : OldOrderStatus;
  };

  type OldOrderStatus = {
    #pending;
    #completed;
    #cancelled;
  };

  type OldContactLocation = {
    name : Text;
    address : Text;
    phone : Text;
    email : Text;
    mapUrl : Text;
    isHeadOffice : Bool;
  };

  type OldUserProfile = {
    name : Text;
    email : Text;
    role : Text;
  };

  type OldFloatingBubbleConfig = {
    backgroundColor : Text;
    icon : Text;
    hotlineNumberOverride : ?Text;
    isEnabled : Bool;
  };

  type OldProcessStep = {
    stepTitle : Text;
    description : Text;
    mediaUrl : Text;
  };

  type OldTeamMember = {
    name : Text;
    role : Text;
    imageUrl : Text;
    bio : Text;
  };

  type OldCustomerMessage = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    message : Text;
    timestamp : Int;
  };

  type OldAboutMediaSection = {
    title : Text;
    description : Text;
    mediaUrl : Text;
  };

  type OldAboutSection = {
    introductoryHeading : Text;
    mainDescription : Text;
    mediaSections : [OldAboutMediaSection];
    processSteps : [OldProcessStep];
    teamMembers : [OldTeamMember];
  };

  type OldContentSection = {
    title : Text;
    content : Text;
    mediaUrl : Text;
  };

  type OldFooterData = {
    copyright : Text;
    links : [Text];
    socialMedia : [Text];
  };

  type OldSerializableAdminCMSData = {
    header : OldContentSection;
    footer : OldFooterData;
    iconLinks : [OldIconLink];
    heroSection : OldContentSection;
    aboutSection : OldContentSection;
    products : [(Text, OldProduct)];
    processSteps : [OldProcessStep];
    teamMembers : [OldTeamMember];
    media : [AdminCMS.MediaContent];
    contacts : [OldContactLocation];
    floatingBubbleConfig : OldFloatingBubbleConfig;
  };

  type OldAdminEntry = {
    principalId : Text;
  };

  type OldActor = {
    adminCms : AdminCMS.AdminCMSData;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    categories : Map.Map<Text, OldCategory>;
    products : Map.Map<Text, OldProduct>;
    orders : Map.Map<Nat, OldOrder>;
    nextOrderId : Nat;
    floatingBubbleConfig : OldFloatingBubbleConfig;
    aboutSection : OldAboutSection;
    customerMessages : Map.Map<Nat, OldCustomerMessage>;
    nextMessageId : Nat;
    nextMediaId : Nat;
    mediaItems : Map.Map<Nat, OldMediaItem>;
  };

  type NewActor = {
    adminCms : AdminCMS.AdminCMSData;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    categories : Map.Map<Text, OldCategory>;
    products : Map.Map<Text, OldProduct>;
    orders : Map.Map<Nat, OldOrder>;
    nextOrderId : Nat;
    floatingBubbleConfig : OldFloatingBubbleConfig;
    aboutSection : OldAboutSection;
    customerMessages : Map.Map<Nat, OldCustomerMessage>;
    nextMessageId : Nat;
    nextMediaId : Nat;
    mediaItems : Map.Map<Nat, OldMediaItem>;
    showProductPrices : Bool;
  };

  public func run(old : OldActor) : NewActor {
    { old with showProductPrices = true };
  };
};
