import Map "mo:core/Map";

module {

  public type IconLink = {
    id : Nat;
    icon : Text;
    link : Text;
  };

  public type MediaItem = {
    id : Nat;
    url : Text;
    caption : Text;
    description : Text;
    uploadTimestamp : Int;
    mediaType : Text;
  };

  public type Category = {
    id : Nat;
    name : Text;
  };

  public type TastingNote = {
    id : Nat;
    name : Text;
    imageUrl : Text;
    description : Text;
  };

  public type PairingFood = {
    id : Nat;
    name : Text;
    imageUrl : Text;
    description : Text;
  };

  public type Product = {
    id : Nat;
    name : Text;
    description : Text;
    imageUrl : Text;
    price : Nat;
    categories : [Category];
    tasting : [TastingNote];
    paring : [PairingFood];
  };

  public type CartItem = {
    product : Product;
    quantity : Nat;
  };

  public type OrderItem = {
    product : Product;
    quantity : Nat;
    totalPrice : Nat;
  };

  public type Order = {
    id : Nat;
    customerName : Text;
    customerEmail : Text;
    customerPhone : Text;
    items : [OrderItem];
    totalAmount : Nat;
    timestamp : Int;
    status : OrderStatus;
  };

  public type OrderStatus = {
    #pending;
    #completed;
    #cancelled;
  };

  public type ContactLocation = {
    id : Nat;
    name : Text;
    address : Text;
    phone : Text;
    email : Text;
    mapUrl : Text;
    isHeadOffice : Bool;
  };

  public type UserProfile = {
    id : Nat;
    name : Text;
    principal : Principal;
    email : Text;
    role : Text;
  };

  public type FloatingBubbleConfig = {
    backgroundColor : Text;
    icon : Text;
    hotlineNumberOverride : ?Text;
    isEnabled : Bool;
  };

  // public type ProcessStep = {
  //   stepTitle : Text;
  //   description : Text;
  //   mediaUrl : Text;
  // };

  public type TeamMember = {
    id : Nat;
    name : Text;
    role : Text;
    imageUrl : Text;
    bio : Text;
  };

  public type CustomerMessage = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    message : Text;
    timestamp : Int;
  };

  public type AboutMediaSection = {
    title : Text;
    description : Text;
    mediaUrl : Text;
  };

  public type AboutSection = {
    introductoryHeading : Text;
    mainDescription : Text;
    mediaSections : [AboutMediaSection];
    // processSteps : [ProcessStep];
    // teamMembers : [TeamMember];
  };

  public type ContentSection = {
    title : Text;
    content : Text;
    mediaUrl : Text;
  };

  public type FooterData = {
    copyright : Text;
    links : [Text];
    socialMedia : [Text];
  };

  public type SerializableAdminCMSData = {
    header : ContentSection;
    footer : FooterData;
    iconLinks : [IconLink];
    heroSection : ContentSection;
    aboutSection : ContentSection;
    products : [Product];
    // processSteps : [ProcessStep];
    teamMembers : [TeamMember];
    media : [MediaContent];
    contacts : [ContactLocation];
    floatingBubbleConfig : FloatingBubbleConfig;
  };
  

  public type AdminCMSData = {
    header : ContentSection;
    footer : FooterData;
    iconLinks : [IconLink];
    heroSection : ContentSection;
    aboutSection : ContentSection;
    products : Map.Map<Nat, Product>;
    // processSteps : [ProcessStep];
    teamMembers : [TeamMember];
    contacts : [ContactLocation];
    media : [MediaContent];
  };

  public type AdminEntry = {
    principalId : Text;
  };

  public type MediaContent = {
    url : Text;
    mediaType : Text;
  };
};