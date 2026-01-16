import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
// import MixinAuthorization "authorization/MixingAuthorization";
import AdminCMS "admin-cms";
import AccessControl "authorization/access-control";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

// import Migration "migration";

// (with migration = Migration.run)
persistent actor {
  type IconLink = {
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
    id : Text;
    name : Text;
    description : Text;
  };

  public type Product = {
    name : Text;
    description : Text;
    imageUrl : Text;
    price : Nat;
    categories : [Text];
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
    name : Text;
    address : Text;
    phone : Text;
    email : Text;
    mapUrl : Text;
    isHeadOffice : Bool;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    role : Text;
  };

  public type FloatingBubbleConfig = {
    backgroundColor : Text;
    icon : Text;
    hotlineNumberOverride : ?Text;
    isEnabled : Bool;
  };

  public type ProcessStep = {
    stepTitle : Text;
    description : Text;
    mediaUrl : Text;
  };

  public type TeamMember = {
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
    processSteps : [ProcessStep];
    teamMembers : [TeamMember];
  };

  type ContentSection = {
    title : Text;
    content : Text;
    mediaUrl : Text;
  };

  type FooterData = {
    copyright : Text;
    links : [Text];
    socialMedia : [Text];
  };

  type SerializableAdminCMSData = {
    header : ContentSection;
    footer : FooterData;
    iconLinks : [IconLink];
    heroSection : ContentSection;
    aboutSection : ContentSection;
    products : [(Text, Product)];
    processSteps : [ProcessStep];
    teamMembers : [TeamMember];
    media : [AdminCMS.MediaContent];
    contacts : [ContactLocation];
    floatingBubbleConfig : FloatingBubbleConfig;
  };

  public type AdminEntry = {
    principalId : Text;
  };

  let accessControlState = AccessControl.initState();
  // include MixinAuthorization(accessControlState);

  var adminCms : AdminCMS.AdminCMSData = AdminCMS.init();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let categories = Map.empty<Text, Category>();
  let products = Map.empty<Text, Product>();
  let orders = Map.empty<Nat, Order>();
  var nextOrderId = 0;
  var floatingBubbleConfig : FloatingBubbleConfig = {
    backgroundColor = "#FFA500";
    icon = "phone";
    hotlineNumberOverride = ?"";
    isEnabled = true;
  };
  var aboutSection : AboutSection = {
    introductoryHeading = "Khám phá câu chuyện và hành trình của chúng tôi";
    mainDescription = "Chúng tôi tự hào về di sản và hành trình của mình, kết hợp giữa truyền thống và sáng tạo để tạo ra sản phẩm độc đáo.";
    mediaSections = [
      {
        title = "Cơ sở sản xuất hiện đại";
        description = "Kết hợp công nghệ tiên tiến với kỹ thuật truyền thống.";
        mediaUrl = "wine-cellar.jpg";
      },
      {
        title = "Cam kết chất lượng";
        description = "Mỗi chai rượu là sự kết tinh của tâm huyết và đam mê.";
        mediaUrl = "vineyard.jpg";
      },
    ];
    processSteps = [
      {
        stepTitle = "Quy trình sản xuất";
        description = "Các bước làm rượu chuyên nghiệp và kiểm soát chất lượng.";
        mediaUrl = "wine-making.jpg";
      },
    ];
    teamMembers = [
      {
        name = "Nguyễn Thị Lan";
        role = "Chuyên gia thử rượu";
        imageUrl = "sommelier-female.png";
        bio = "Chuyên gia thử rượu với kinh nghiệm 15 năm.";
      },
      {
        name = "Lê Văn Hòa";
        role = "Nhà sản xuất rượu";
        imageUrl = "winemaker-male.jpg";
        bio = "Nhà sản xuất rượu nổi tiếng với 20 năm kinh nghiệm.";
      },
    ];
  };

  let customerMessages = Map.empty<Nat, CustomerMessage>();
  var nextMessageId = 0;

  var nextMediaId = 0;
  let mediaItems = Map.empty<Nat, MediaItem>();

  var showProductPrices = true;

  func requireUserPermission(caller : Principal) : () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
  };

  func requireAdminPermission(caller : Principal) : () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // User Profile System - Requires authentication
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their profile");
    };
    Map.get(userProfiles, Principal.compare, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    Map.get(userProfiles, Principal.compare, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    Map.add(userProfiles, Principal.compare, caller, profile);
  };

  // Public Query Endpoints - No authorization required (accessible to guests for public pages)
  public query func getHeroSection() : async ContentSection {
    adminCms.heroSection;
  };

  public query func getAboutSection() : async AboutSection {
    aboutSection;
  };

  public query func getProcessSteps() : async [ProcessStep] {
    adminCms.processSteps;
  };

  public query func getTeamMembers() : async [TeamMember] {
    adminCms.teamMembers;
  };

  public query func getFooterData() : async FooterData {
    adminCms.footer;
  };

  public query func getHeader() : async ContentSection {
    adminCms.header;
  };

  public query func getIconLinks() : async [IconLink] {
    adminCms.iconLinks;
  };

  public query func getProducts() : async [(Text, Product)] {
    Iter.toArray(Map.entries(products));
  };

  public query func getProductByName(name : Text) : async ?Product {
    Map.get(products, Text.compare, name);
  };

  public query func getContacts() : async [ContactLocation] {
    adminCms.contacts;
  };

  public query func getHeadOfficeContact() : async ?ContactLocation {
    let headOffices = Array.filter(adminCms.contacts,
      func(contact) { contact.isHeadOffice }
    );
    if (headOffices.size() == 0) {
      return null;
    };
    ?headOffices[0];
  };

  public query func getFloatingBubbleConfig() : async FloatingBubbleConfig {
    floatingBubbleConfig;
  };

  public query func getCategories() : async [Category] {
    Iter.toArray(Map.values(categories));
  };

  public query func getProductsByCategory(categoryId : Text) : async [Product] {
    Iter.toArray(Map.values(Map.filter(products, Text.compare,
      func(_name, product) {
        Array.find(product.categories, func(catId) { Text.equal(catId, categoryId) }) != null;
      }
    )));
  };

  // Media Gallery - Public viewing (no authentication required for frontend /media page)
  public query func getMediaItems(page : Nat) : async [MediaItem] {
    let pageSize = 10;
    let mediaValues : [MediaItem] = Iter.toArray(Map.values(mediaItems));
    let sortedMedia = Array.sort(mediaValues,
      func(a, b) {
        Nat.compare(b.id, a.id);
      }
    );
    let startIndex = page * pageSize;
    let endIndex = startIndex + pageSize;
    if (startIndex >= sortedMedia.size()) {
      return [];
    };
    let actualEndIndex = if (endIndex > sortedMedia.size()) {
      sortedMedia.size();
    } else {
      endIndex;
    };
    Array.sliceToArray(sortedMedia, startIndex, actualEndIndex);
  };

  public query func getTotalMediaCount() : async Nat {
    Map.size(mediaItems);
  };

  public query func getMediaPage(page : Nat) : async [MediaItem] {
    let pageSize = 10;
    let startIndex = page * pageSize;
    let endIndex = startIndex + pageSize;
    Array.sliceToArray(Iter.toArray(Map.values(mediaItems)), startIndex, endIndex);
  };

  // Media CRUD - Requires authentication (admin CMS operations)
  public shared ({ caller }) func addMediaItem(url : Text, caption : Text, description : Text, mediaType : Text) : async () {
    requireUserPermission(caller);
    let newMediaItem : MediaItem = {
      id = nextMediaId;
      url;
      caption;
      description;
      uploadTimestamp = 0;
      mediaType;
    };
    Map.add(mediaItems, Nat.compare, nextMediaId, newMediaItem);
    nextMediaId += 1;
  };

  public shared ({ caller }) func updateMediaItem(id : Nat, url : Text, caption : Text, description : Text) : async () {
    requireUserPermission(caller);
    switch (Map.get(mediaItems, Nat.compare, id)) {
      case (null) { Runtime.trap("Media item not found") };
      case (?mediaItem) {
        let updatedItem = {
          mediaItem with
          url;
          caption;
          description;
        };
        Map.add(mediaItems, Nat.compare, id, updatedItem);
      };
    };
  };

  public shared ({ caller }) func deleteMediaItem(id : Nat) : async () {
    requireUserPermission(caller);
    if (not Map.containsKey(mediaItems, Nat.compare, id)) {
      Runtime.trap("Media item not found");
    };
    Map.remove(mediaItems, Nat.compare, id);
  };

  // Admin CMS Data - Requires authentication
  public query ({ caller }) func getAdminCMSData() : async SerializableAdminCMSData {
    requireUserPermission(caller);
    {
      adminCms with products = Map.toArray(products);
      contacts = adminCms.contacts;
      floatingBubbleConfig;
    };
  };

  // Order Management - Viewing requires authentication (contains sensitive customer data)
  public query ({ caller }) func getOrders(page : Nat) : async [Order] {
    requireUserPermission(caller);
    let pageSize = 10;
    let orderValues : [Order] = Iter.toArray(Map.values(orders));
    let sortedOrders = Array.sort(orderValues,
      func(a, b) {
        Nat.compare(b.id, a.id);
      }
    );
    let startIndex = page * pageSize;
    let endIndex = startIndex + pageSize;
    if (startIndex >= sortedOrders.size()) {
      return [];
    };
    let actualEndIndex = if (endIndex > sortedOrders.size()) {
      sortedOrders.size();
    } else {
      endIndex;
    };
    Array.sliceToArray(sortedOrders, startIndex, actualEndIndex);
  };

  public query ({ caller }) func getTotalOrderCount() : async Nat {
    requireUserPermission(caller);
    Map.size(orders);
  };

  public query ({ caller }) func getOrderById(_id : Nat) : async ?Order {
    requireUserPermission(caller);
    null;
  };

  // Order Submission - No authentication required (guest checkout allowed)
  public shared ({ caller }) func submitOrder(customerName : Text, customerEmail : Text, customerPhone : Text, items : [CartItem]) : async () {
    let orderItems = Array.map(items, 
      func(cartItem) {
        {
          product = cartItem.product;
          quantity = cartItem.quantity;
          totalPrice = cartItem.product.price * cartItem.quantity;
        };
      }
    );
    let totalAmount = Array.foldLeft(orderItems, 
      0,
      func(acc, item) { acc + item.totalPrice },
    );
    let newOrder : Order = {
      id = nextOrderId;
      customerName;
      customerEmail;
      customerPhone;
      items = orderItems;
      totalAmount;
      timestamp = 0;
      status = #pending;
    };
    Map.add(orders, Nat.compare, nextOrderId, newOrder);
    nextOrderId += 1;
  };

  // Order Status Management - Requires authentication
  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderStatus) : async () {
    requireUserPermission(caller);
    switch (Map.get(orders, Nat.compare, orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status };
        Map.add(orders, Nat.compare, orderId, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func cancelOrder(orderId : Nat) : async () {
    requireUserPermission(caller);
    switch (Map.get(orders, Nat.compare, orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status = #cancelled };
        Map.add(orders, Nat.compare, orderId, updatedOrder);
      };
    };
  };

  // Customer Message Management - Submission by anyone (guest contact forms), viewing requires authentication
  public shared ({ caller }) func submitCustomerMessage(message : CustomerMessage) : async () {
    Map.add(customerMessages, Nat.compare, nextMessageId, { message with id = nextMessageId });
    nextMessageId += 1;
  };

  public query ({ caller }) func getCustomerMessages(page : Nat) : async [CustomerMessage] {
    requireUserPermission(caller);
    let pageSize = 10;
    let startIndex = page * pageSize;
    let endIndex = startIndex + pageSize;
    Array.sliceToArray(Iter.toArray(Map.values(customerMessages)), startIndex, endIndex);
  };

  public query ({ caller }) func getTotalMessageCount() : async Nat {
    requireUserPermission(caller);
    Map.size(customerMessages);
  };

  public query ({ caller }) func getAllCustomerMessages() : async [(Nat, CustomerMessage)] {
    requireUserPermission(caller);
    Iter.toArray(Map.entries(customerMessages));
  };

  // Category Management - Requires authentication
  public shared ({ caller }) func addCategory(category : Category) : async () {
    requireUserPermission(caller);
    if (Map.containsKey(categories, Text.compare, category.id)) {
      Runtime.trap("Category with this ID already exists");
    };
    Map.add(categories, Text.compare, category.id, category);
  };

  public shared ({ caller }) func updateCategory(category : Category) : async () {
    requireUserPermission(caller);
    if (not Map.containsKey(categories, Text.compare, category.id)) {
      Runtime.trap("Category not found");
    };
    Map.add(categories, Text.compare, category.id, category);
  };

  public shared ({ caller }) func deleteCategory(categoryId : Text) : async () {
    requireUserPermission(caller);
    if (not Map.containsKey(categories, Text.compare, categoryId)) {
      Runtime.trap("Category not found");
    };
    Map.remove(categories, Text.compare, categoryId);
  };

  // Product Management - Requires authentication
  public shared ({ caller }) func addProduct(product : Product) : async () {
    requireUserPermission(caller);
    Map.add(products, Text.compare, product.name, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    requireUserPermission(caller);
    if (not Map.containsKey(products, Text.compare, product.name)) {
      Runtime.trap("Product not found");
    };
    Map.add(products, Text.compare, product.name, product);
  };

  public shared ({ caller }) func deleteProduct(name : Text) : async () {
    requireUserPermission(caller);
    Map.remove(products, Text.compare, name);
  };

  // Admin CMS Update Endpoints - Require user permission
  public shared ({ caller }) func updateHeroSection(hero : ContentSection) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with heroSection = hero
    };
  };

  public shared ({ caller }) func updateProcessSteps(steps : [ProcessStep]) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with processSteps = steps
    };
  };

  public shared ({ caller }) func updateTeamMembers(members : [TeamMember]) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with teamMembers = members
    };
  };

  public shared ({ caller }) func updateFooterData(footer : FooterData) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with footer
    };
  };

  public shared ({ caller }) func updateHeader(header : ContentSection) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with header
    };
  };

  public shared ({ caller }) func updateIconLinks(links : [IconLink]) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with iconLinks = links
    };
  };

  public shared ({ caller }) func updateMedia(media : [MediaItem]) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with media
    };
  };

  // Contact Management - Requires authentication
  public shared ({ caller }) func addContact(newContact : ContactLocation) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with contacts = Array.concat(adminCms.contacts, [newContact]);
    };
  };

  public shared ({ caller }) func updateContact(updatedContact : ContactLocation) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with contacts = Array.map(adminCms.contacts,
        func(contact) {
          if (Text.equal(contact.name, updatedContact.name)) {
            updatedContact;
          } else {
            contact;
          };
        }
      );
    };
  };

  public shared ({ caller }) func deleteContact(contactName : Text) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with contacts = Array.filter(adminCms.contacts,
        func(contact) { not Text.equal(contact.name, contactName) }
      );
    };
  };

  public shared ({ caller }) func setHeadOffice(contactName : Text) : async () {
    requireUserPermission(caller);
    adminCms := {
      adminCms with contacts = Array.map(adminCms.contacts,
        func(contact) {
          if (Text.equal(contact.name, contactName)) {
            {
              contact with isHeadOffice = true;
            };
          } else {
            {
              contact with isHeadOffice = false;
            };
          };
        }
      );
    };
  };

  // Floating Bubble Configuration - Requires authentication
  public shared ({ caller }) func updateFloatingBubbleConfig(config : FloatingBubbleConfig) : async () {
    requireUserPermission(caller);
    floatingBubbleConfig := config;
  };

  // About Section Management - Requires authentication
  public shared ({ caller }) func updateAboutSection(about : AboutSection) : async () {
    requireUserPermission(caller);
    aboutSection := about;
  };

  // Reset to Default - Requires authentication
  public shared ({ caller }) func resetToDefault() : async () {
    requireUserPermission(caller);
    adminCms := AdminCMS.init();
    floatingBubbleConfig := {
      backgroundColor = "#FFA500";
      icon = "phone";
      hotlineNumberOverride = ?"";
      isEnabled = true;
    };
    aboutSection := {
      introductoryHeading = "Khám phá câu chuyện và hành trình của chúng tôi";
      mainDescription = "Bản sắc Việt với hành trình truyền thống kết hợp sáng tạo để tạo ra sản phẩm độc đáo.";
      mediaSections = [
        {
          title = "Chất lượng vượt trội";
          description = "Kết hợp truyền thống và hiện đại để mang đến sản phẩm cao cấp.";
          mediaUrl = "vineyard.jpg";
        },
      ];
      processSteps = [
        {
          stepTitle = "Quy trình nghiêm ngặt";
          description = "Các bước kiểm tra chất lượng sản xuất rượu vang.";
          mediaUrl = "wine-making.jpg";
        },
      ];
      teamMembers = [
        {
          name = "Nguyễn Thị Lan";
          role = "Chuyên gia thử rượu";
          imageUrl = "sommelier-female.png";
          bio = "Chuyên gia thử rượu hàng đầu với nhiều năm kinh nghiệm.";
        },
        {
          name = "Lê Văn Hòa";
          role = "Nhà sản xuất rượu";
          imageUrl = "winemaker-male.jpg";
          bio = "Nhà sản xuất rượu nổi tiếng trong ngành.";
        },
      ];
    };
  };

  // Admin Management - Requires admin permission
  public query ({ caller }) func getAdmins() : async [AdminEntry] {
    requireAdminPermission(caller);

    var adminList : [AdminEntry] = [];

    for ((principal, role) in Map.entries(accessControlState.userRoles)) {
      if (role == #admin) {
        adminList := Array.concat(adminList, [{
          principalId = Principal.toText(principal);
        }]);
      };
    };

    adminList;
  };

  public shared ({ caller }) func addAdmin(principal : Principal) : async () {
    requireAdminPermission(caller);
    AccessControl.assignRole(accessControlState, caller, principal, #admin);
  };

  public shared ({ caller }) func removeAdmin(principal : Principal) : async () {
    requireAdminPermission(caller);
    AccessControl.assignRole(accessControlState, caller, principal, #guest);
  };

  // Product Price Visibility - Requires authentication to update, public to query
  public query func getProductPriceVisibility() : async Bool {
    showProductPrices;
  };

  public shared ({ caller }) func updateProductPriceVisibility(showPrices : Bool) : async () {
    requireUserPermission(caller);
    showProductPrices := showPrices;
  };

  public shared ({ caller }) func ping() : async (Text) {
    "pong";
  };
};
