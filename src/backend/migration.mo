import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Option "mo:core/Option";
import AdminCMS "admin-cms";
import T "object/types";


module {
  
  public type OldIconLink = {
    id : Nat;
    icon : Text;
    link : Text;
  };

  public type OldMediaItem = {
    id : Nat;
    url : Text;
    caption : Text;
    description : Text;
    uploadTimestamp : Int;
    mediaType : Text;
  };

  public type OldCategory = {
    id : Nat;
    name : Text;
  };

  public type OldTastingNote = {
    id : Nat;
    name : Text;
    imageUrl : Text;
    description : Text;
  };

  public type OldPairingFood = {
    id : Nat;
    name : Text;
    imageUrl : Text;
    description : Text;
  };

  public type OldProduct = {
    id : Nat;
    name : Text;
    description : Text;
    imageUrl : Text;
    price : Nat;
    categories : [OldCategory];
    tasting : [OldTastingNote];
    paring : [OldPairingFood];
  };

  public type OldCartItem = {
    product : OldProduct;
    quantity : Nat;
  };

  public type OldOrderItem = {
    product : OldProduct;
    quantity : Nat;
    totalPrice : Nat;
  };

  public type OldOrder = {
    id : Nat;
    customerName : Text;
    customerEmail : Text;
    customerPhone : Text;
    items : [OldOrderItem];
    totalAmount : Nat;
    timestamp : Int;
    status : OldOrderStatus;
  };

  public type OldOrderStatus = {
    #pending;
    #completed;
    #cancelled;
  };

  public type OldContactLocation = {
    id : Nat;
    name : Text;
    address : Text;
    phone : Text;
    email : Text;
    mapUrl : Text;
    isHeadOffice : Bool;
  };

  public type OldUserProfile = {
    id : Nat;
    name : Text;
    principal : Text;
    email : Text;
    role : Text;
  };

  public type OldFloatingBubbleConfig = {
    backgroundColor : Text;
    icon : Text;
    hotlineNumberOverride : Text;
    isEnabled : Bool;
  };

  // public type ProcessStep = {
  //   stepTitle : Text;
  //   description : Text;
  //   mediaUrl : Text;
  // };

  public type OldTeamMember = {
    id : Nat;
    name : Text;
    role : Text;
    imageUrl : Text;
    bio : Text;
  };

  public type OldCustomerMessage = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    message : Text;
    timestamp : Int;
  };

  public type OldAboutMediaSection = {
    title : Text;
    description : Text;
    mediaUrl : Text;
    mediaType : Text;
  };

  public type OldAboutSection = {
    introductoryHeading : Text;
    mainDescription : Text;
    mediaSections : [OldAboutMediaSection];
    // processSteps : [ProcessStep];
    // teamMembers : [TeamMember];
  };

  public type OldContentSection = {
    title : Text;
    content : Text;
    mediaUrl : Text;
  };

  public type OldFooterData = {
    copyright : Text;
    links : [Text];
    socialMedia : [Text];
  };

  public type OldSerializableAdminCMSData = {
    header : OldContentSection;
    footer : OldFooterData;
    iconLinks : [OldIconLink];
    heroSection : OldContentSection;
    aboutSection : OldContentSection;
    products : [OldProduct];
    // processSteps : [ProcessStep];
    teamMembers : [OldTeamMember];
    media : [OldMediaContent];
    contacts : [OldContactLocation];
    floatingBubbleConfig : OldFloatingBubbleConfig;
  };
  

  public type OldAdminCMSData = {
    header : OldContentSection;
    footer : OldFooterData;
    iconLinks : [OldIconLink];
    heroSection : OldContentSection;
    aboutSection : OldContentSection;
    products : Map.Map<Nat, OldProduct>;
    // processSteps : [ProcessStep];
    teamMembers : [OldTeamMember];
    contacts : [OldContactLocation];
    media : [OldMediaContent];
  };

  public type OldAdminEntry = {
    principalId : Text;
  };

  public type OldMediaContent = {
    url : Text;
    mediaType : Text;
  };

  // type OldSerializableAdminCMSData = {
  //   header : OldContentSection;
  //   footer : OldFooterData;
  //   iconLinks : [OldIconLink];
  //   heroSection : OldContentSection;
  //   aboutSection : OldContentSection;
  //   products : [(Text, OldProduct)];
  //   processSteps : [OldProcessStep];
  //   teamMembers : [OldTeamMember];
  //   media : [AdminCMS.MediaContent];
  //   contacts : [OldContactLocation];
  //   floatingBubbleConfig : OldFloatingBubbleConfig;
  // };

  // type OldAdminEntry = {
  //   principalId : Text;
  // };

  type NewActor = {
    nextMessageId : Nat;
    nextMediaId : Nat;
    nextOrderId : Nat;
    nextProductId : Nat;
    nextCategoryId : Nat;
    nextContactId : Nat;
    nextUserId : Nat;
    nextTeamMemberId : Nat;
    nextIconLinkId : Nat;

    showProductPrices : Bool;
    
    userProfiles : Map.Map<Principal, T.UserProfile>;
    categories : Map.Map<Nat, T.Category>;
    products : Map.Map<Nat, T.Product>;
    orders : Map.Map<Nat, T.Order>;
    customerMessages : Map.Map<Nat, T.CustomerMessage>;
    mediaItems : Map.Map<Nat, T.MediaItem>;
    contentSections : Map.Map<Text, T.ContentSection>;
    iconLinks : Map.Map<Nat, T.IconLink>;

    floatingBubbleConfig : T.FloatingBubbleConfig;
    footerData : T.FooterData;
    aboutSection : T.AboutSection;
  };

  type OldActor = {
    nextMessageId : Nat;
    nextMediaId : Nat;
    nextOrderId : Nat;
    nextProductId : Nat;
    nextCategoryId : Nat;
    nextContactId : Nat;
    nextUserId : Nat;
    nextTeamMemberId : Nat;
    nextIconLinkId : Nat;

    showProductPrices : Bool;
    
    userProfiles : Map.Map<Principal, OldUserProfile>;
    categories : Map.Map<Nat, OldCategory>;
    products : Map.Map<Nat, OldProduct>;
    orders : Map.Map<Nat, OldOrder>;
    customerMessages : Map.Map<Nat, OldCustomerMessage>;
    mediaItems : Map.Map<Nat, OldMediaItem>;
    contentSections : Map.Map<Text, OldContentSection>;
    iconLinks : Map.Map<Nat, OldIconLink>;

    floatingBubbleConfig : OldFloatingBubbleConfig;
    footerData : OldFooterData;
    aboutSection : OldAboutSection;
  };

  // type NewActor = {
  //   adminCms : AdminCMS.AdminCMSData;
  //   userProfiles : Map.Map<Principal, OldUserProfile>;
  //   categories : Map.Map<Text, OldCategory>;
  //   products : Map.Map<Text, OldProduct>;
  //   orders : Map.Map<Nat, OldOrder>;
  //   nextOrderId : Nat;
  //   floatingBubbleConfig : OldFloatingBubbleConfig;
  //   aboutSection : OldAboutSection;
  //   customerMessages : Map.Map<Nat, OldCustomerMessage>;
  //   nextMessageId : Nat;
  //   nextMediaId : Nat;
  //   mediaItems : Map.Map<Nat, OldMediaItem>;
  //   showProductPrices : Bool;
  // };

  public func run(old : OldActor) : NewActor {

    {
      nextMessageId = old.nextMessageId;
      nextMediaId = old.nextMediaId;
      nextOrderId = old.nextOrderId;
      nextProductId = old.nextProductId;
      nextCategoryId = old.nextCategoryId;
      nextContactId = old.nextContactId;
      nextUserId = old.nextUserId;
      nextTeamMemberId = old.nextTeamMemberId;
      nextIconLinkId = old.nextIconLinkId;
      showProductPrices = old.showProductPrices;
      userProfiles = old.userProfiles; // Assuming no changes needed
      categories = old.categories; // Assuming no changes needed
      products = old.products; // Assuming no changes needed
      orders = old.orders; // Assuming no changes needed
      customerMessages = old.customerMessages; // Assuming no changes needed
      mediaItems = old.mediaItems; // Assuming no changes needed
      contentSections = old.contentSections; // Assuming no changes needed
      iconLinks = old.iconLinks; // Assuming no changes needed
      floatingBubbleConfig = {
        backgroundColor = old.floatingBubbleConfig.backgroundColor;
        icon = old.floatingBubbleConfig.icon;
        hotlineNumberOverride = old.floatingBubbleConfig.hotlineNumberOverride;
        isEnabled = old.floatingBubbleConfig.isEnabled;
      };
      footerData = old.footerData; // Assuming no changes needed
      aboutSection = {
        introductoryHeading = old.aboutSection.introductoryHeading;
        mainDescription = old.aboutSection.mainDescription;
        mediaSections = old.aboutSection.mediaSections;
        // processSteps = []; // Assuming empty for migration
        // teamMembers = []; // Assuming empty for migration
      };
    };
  };
};
