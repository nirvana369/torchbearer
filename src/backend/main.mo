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
import T "object/types";
import { ObjectCRUD } "generic";
import AdminCms "admin-cms";

// import Migration "migration";

// (with migration = Migration.run)
persistent actor {
  
  var nextMessageId = 1;
  var nextMediaId = 1;
  var nextOrderId = 1;
  var nextProductId = 1;
  var nextCategoryId = 1;
  var nextContactId = 1;
  var nextUserId = 1;
  var nextTeamMemberId = 1;
  var nextIconLinkId = 1;

  var showProductPrices = true;
  
  let userProfiles = Map.empty<Principal, T.UserProfile>();
  let categories = Map.empty<Nat, T.Category>();
  let products = Map.empty<Nat, T.Product>();
  let orders = Map.empty<Nat, T.Order>();
  let customerMessages = Map.empty<Nat, T.CustomerMessage>();
  let mediaItems = Map.empty<Nat, T.MediaItem>();
  let contentSections = Map.empty<Text, T.ContentSection>();
  let iconLinks = Map.empty<Nat, T.IconLink>();

  transient let userManager = ObjectCRUD<Principal, T.UserProfile>(userProfiles, Principal.compare);
  transient let productManager = ObjectCRUD<Nat, T.Product>(products, Nat.compare);
  transient let categoryManager = ObjectCRUD<Nat, T.Category>(categories, Nat.compare);
  transient let mediaManager = ObjectCRUD<Nat, T.MediaItem>(mediaItems, Nat.compare);
  transient let orderManager = ObjectCRUD<Nat, T.Order>(orders, Nat.compare);
  transient let customerMessageManager = ObjectCRUD<Nat, T.CustomerMessage>(customerMessages, Nat.compare);
  transient let contactManager = ObjectCRUD<Nat, T.ContactLocation>(Map.empty<Nat, T.ContactLocation>(), Nat.compare);
  transient let teamMemberManager = ObjectCRUD<Nat, T.TeamMember>(Map.empty<Nat, T.TeamMember>(), Nat.compare);
  transient let contentSectionManager = ObjectCRUD<Text, T.ContentSection>(contentSections, Text.compare);
  transient let iconLinkManager = ObjectCRUD<Nat, T.IconLink>(iconLinks, Nat.compare);

  let HERO_SECTION_KEY : Text = "hero_section";
  let ABOUT_SECTION_KEY : Text = "about_section";
  let HEADER_SECTION_KEY : Text = "header_section";

  let accessControlState = AccessControl.initState();

  var floatingBubbleConfig : T.FloatingBubbleConfig = {
    backgroundColor = "#FFA500";
    icon = "phone";
    hotlineNumberOverride = ?"";
    isEnabled = true;
  };
  var footerData : T.FooterData = AdminCMS.getFooter();
  var aboutSection : T.AboutSection = {
    introductoryHeading = "Khám phá câu chuyện và hành trình của chúng tôi";
    mainDescription = "Chúng tôi tự hào về di sản và hành trình của mình, kết hợp giữa truyền thống và sáng tạo để tạo ra sản phẩm độc đáo.";
    mediaSections = [
      {
        title = "Cơ sở sản xuất hiện đại";
        description = "Kết hợp công nghệ tiên tiến với kỹ thuật truyền thống.";
        mediaUrl = "wine.jpg";
      },
      {
        title = "Cam kết chất lượng";
        description = "Mỗi chai rượu là sự kết tinh của tâm huyết và đam mê.";
        mediaUrl = "wine.jpg";
      },
    ];
  };

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
  public query ({ caller }) func getCallerUserProfile() : async ?T.UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their profile");
    };
    userManager.read(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?T.UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userManager.read(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : T.UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userManager.create(caller, {profile with id = nextUserId; principal = caller; });
    nextUserId += 1;
  };

  // Public Query Endpoints - No authorization required (accessible to guests for public pages)
  public query func getHeroSection() : async T.ContentSection {
    switch (contentSectionManager.read(HERO_SECTION_KEY)) {
      case (null) AdminCms.getHeroSection();
      case (?hero) hero;
    };
  };

  public query func getAboutSection() : async T.AboutSection {
    aboutSection;
  };

  public query func getTeamMembers() : async [T.TeamMember] {
    teamMemberManager.getAllValues();
  };

  public query func getFooterData() : async T.FooterData {
    footerData;
  };

  public query func getHeader() : async T.ContentSection {
    switch (contentSectionManager.read(HEADER_SECTION_KEY)) {
      case (null) AdminCms.getHeader();
      case (?header) header;
    };
  };

  public query func getIconLinks() : async [T.IconLink] {
    iconLinkManager.getAllValues();
  };

  public query func getContacts() : async [T.ContactLocation] {
    contactManager.getAllValues();
  };

  public query func getHeadOfficeContact() : async ?T.ContactLocation {
    let r = contactManager.filter(
      func(_id, contact) { contact.isHeadOffice }
    );
    if (r.size() == 0) {
      return null;
    };
    ?r[0].1;
  };

  public query func getFloatingBubbleConfig() : async T.FloatingBubbleConfig {
    floatingBubbleConfig;
  };

  public query func getCategories() : async [(Nat, T.Category)] {
    categoryManager.getAll();
  };


  // Media Gallery - Public viewing (no authentication required for frontend /media page)
  public query func getMediaItems(page : Nat) : async [T.MediaItem] {
    mediaManager.getListValues(page * 10, 10);
  };

  public query func getTotalMediaCount() : async Nat {
    mediaManager.size();
  };

  public query func getMediaPage(page : Nat) : async [T.MediaItem] {
    mediaManager.getListValues(page * 10, 10);
  };

  // Media CRUD - Requires authentication (admin CMS operations)
  public shared ({ caller }) func addMediaItem(url : Text, caption : Text, description : Text, mediaType : Text) : async () {
    requireUserPermission(caller);
    let newMediaItem : T.MediaItem = {
      id = nextMediaId;
      url;
      caption;
      description;
      uploadTimestamp = 0;
      mediaType;
    };
    mediaManager.create(nextMediaId, newMediaItem);
    nextMediaId += 1;
  };

  public shared ({ caller }) func updateMediaItem(id : Nat, url : Text, caption : Text, description : Text) : async () {
    requireUserPermission(caller);
    switch (mediaManager.read(id)) {
      case (null) { Runtime.trap("Media item not found") };
      case (?mediaItem) {
        let updatedItem = {
          mediaItem with
          url;
          caption;
          description;
        };
        mediaManager.update(id, updatedItem);
      };
    };
  };

  public shared ({ caller }) func deleteMediaItem(id : Nat) : async (Bool) {
    requireUserPermission(caller);
    if (not mediaManager.isExist(id)) {
      Runtime.trap("Media item not found");
    };
    mediaManager.delete(id);
  };

  // Admin CMS Data - Requires authentication
  public query ({ caller }) func getAdminCMSData() : async T.SerializableAdminCMSData {
    requireUserPermission(caller);

    {
      header = switch (contentSectionManager.read(HEADER_SECTION_KEY)) {
          case (null) AdminCms.getHeader();
          case (?header) header;
      };
      footer = footerData;
      iconLinks = iconLinkManager.getAllValues();
      heroSection = switch (contentSectionManager.read(HERO_SECTION_KEY)) {
          case (null) AdminCms.getHeroSection();
          case (?hero) hero;
      };
      aboutSection = switch (contentSectionManager.read(ABOUT_SECTION_KEY)) {
          case (null) AdminCms.getAboutSection();
          case (?about) about;
      };
      products = productManager.getAllValues();
      teamMembers = teamMemberManager.getAllValues();
      media = mediaManager.getAllValues();
      contacts = contactManager.getAllValues();
      floatingBubbleConfig = floatingBubbleConfig;
    };
  };

  // Order Management - Viewing requires authentication (contains sensitive customer data)
  public query ({ caller }) func getOrders(page : Nat) : async [T.Order] {
    requireUserPermission(caller);
    orderManager.getListValues(page * 10, 10);
  };

  public query ({ caller }) func getTotalOrderCount() : async Nat {
    orderManager.size();
  };

  public query ({ caller }) func getOrderById(id : Nat) : async ?T.Order {
    requireUserPermission(caller);
    orderManager.read(id);
  };

  // Order Submission - No authentication required (guest checkout allowed)
  public shared ({ caller }) func submitOrder(customerName : Text, customerEmail : Text, customerPhone : Text, items : [T.CartItem]) : async () {
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
    let newOrder : T.Order = {
      id = nextOrderId;
      customerName;
      customerEmail;
      customerPhone;
      items = orderItems;
      totalAmount;
      timestamp = 0;
      status = #pending;
    };
    orderManager.create(nextOrderId, newOrder);
    nextOrderId += 1;
  };

  // Order Status Management - Requires authentication
  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : T.OrderStatus) : async () {
    requireUserPermission(caller);
    switch (orderManager.read(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status };
        orderManager.update(orderId, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func cancelOrder(orderId : Nat) : async () {
    requireUserPermission(caller);
    switch (orderManager.read(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status = #cancelled };
        orderManager.update(orderId, updatedOrder);
      };
    };
  };

  // Customer Message Management - Submission by anyone (guest contact forms), viewing requires authentication
  public shared ({ caller }) func submitCustomerMessage(message : T.CustomerMessage) : async () {
    let msg = { message with id = nextMessageId };
    customerMessageManager.create(nextMessageId, msg);
    nextMessageId += 1;
  };

  public query ({ caller }) func getCustomerMessages(page : Nat) : async [T.CustomerMessage] {
    requireUserPermission(caller);
    customerMessageManager.getListValues(page * 10, 10);
  };

  public query ({ caller }) func getTotalMessageCount() : async Nat {
    requireUserPermission(caller);
    customerMessageManager.size();
  };

  public query ({ caller }) func getAllCustomerMessages() : async [(Nat, T.CustomerMessage)] {
    requireUserPermission(caller);
    customerMessageManager.getAll();
  };

  // Category Management - Requires authentication
  public shared ({ caller }) func addCategory(name : Text) : async () {
    requireUserPermission(caller);
    let filter = categoryManager.filter(
      func(_id, category) {
        Text.equal(category.name, name);
      }
    );
    if (filter.size() > 0) {
      Runtime.trap("Category with this ID already exists");
    };
    categoryManager.create(nextCategoryId, {
      id = nextCategoryId;
      name;
    });
    nextCategoryId += 1;
  };

  public shared ({ caller }) func updateCategory(category : T.Category) : async () {
    requireUserPermission(caller);
    switch (categoryManager.read(category.id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?c) {
        categoryManager.update(category.id, category);
      };
    };
  };

  public shared ({ caller }) func deleteCategory(categoryId : Nat) : async (Bool) {
    requireUserPermission(caller);
    if (categoryManager.isExist(categoryId) == false) {
      Runtime.trap("Category not found");
    };
    categoryManager.delete(categoryId);
  };

  // Product Management - Requires authentication
  public shared ({ caller }) func addProduct(product : T.Product) : async () {
    requireUserPermission(caller);
    productManager.create(nextProductId, { product with id = nextProductId });
    nextProductId += 1;
  };

  public shared ({ caller }) func updateProduct(product : T.Product) : async () {
    requireUserPermission(caller);
    switch (productManager.read(product.id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) {
        productManager.update(product.id, product);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async (Bool) {
    requireUserPermission(caller);
    productManager.delete(id);
  };

  public query func getProducts() : async [(Nat, T.Product)] {
    productManager.getAll();
  };

  public query func getProductByName(name : Text) : async ?T.Product {
    let r = productManager.filter(
      func(_name, product) {
        Text.equal(product.name, name);
      }
    );
    if (r.size() == 0) {
      return null;
    };
    ?r[0].1;
  };

  public query func getProductsByCategory(categoryId : Text) : async [T.Product] {
    let r = productManager.filter(
      func(_id, product) {
        Array.find(product.categories, func(cat) { Text.equal(cat.name, categoryId) }) != null;
      }
    );
    Array.map<(Nat, T.Product), T.Product>(r, func(_k, v) { v });
  };

  // Admin CMS Update Endpoints - Require user permission
  public shared ({ caller }) func updateHeroSection(hero : T.ContentSection) : async () {
    requireUserPermission(caller);
    contentSectionManager.update(HERO_SECTION_KEY, hero);
  };

  public shared ({ caller }) func updateTeamMembers(members : [T.TeamMember]) : async () {
    requireUserPermission(caller);
    ignore Array.map(members,
      func(member) {
        if (member.id <= 0) {
          teamMemberManager.update(nextTeamMemberId, {member with id = nextTeamMemberId});
          nextTeamMemberId += 1;
        } else {
          teamMemberManager.update(member.id, member);
        };
      }
    );
  };

  public shared ({ caller }) func updateFooterData(footer : T.FooterData) : async () {
    requireUserPermission(caller);
    footerData := footer;
  };

  public shared ({ caller }) func updateHeader(header : T.ContentSection) : async () {
    requireUserPermission(caller);
    contentSectionManager.update(HEADER_SECTION_KEY, header);
  };

  public shared ({ caller }) func updateIconLinks(links : [T.IconLink]) : async () {
    requireUserPermission(caller);
    ignore Array.map(links,
      func(link) {
        if (link.id <= 0) {
          iconLinkManager.update(nextIconLinkId, {link with id = nextIconLinkId});
          nextIconLinkId += 1;
        } else {
          iconLinkManager.update(link.id, link);
        };
      }
    );
  };

  public shared ({ caller }) func updateMedia(media : [T.MediaItem]) : async () {
    requireUserPermission(caller);
    ignore Array.map(media,
      func(item) {
        mediaManager.update(item.id, item);
      }
    );
  };

  // Contact Management - Requires authentication
  public shared ({ caller }) func addContact(newContact : T.ContactLocation) : async () {
    requireUserPermission(caller);
    contactManager.create(nextContactId, { newContact with id = nextContactId });
    nextContactId += 1;
  };

  public shared ({ caller }) func updateContact(updatedContact : T.ContactLocation) : async () {
    requireUserPermission(caller);
    switch (contactManager.read(updatedContact.id)) {
      case (null) { Runtime.trap("Contact not found") };
      case (?c) {
        contactManager.update(updatedContact.id, updatedContact);
      };
    };
  };

  public shared ({ caller }) func deleteContact(id : Nat) : async (Bool) {
    requireUserPermission(caller);
    contactManager.delete(id);
  };

  public shared ({ caller }) func setHeadOffice(id : Nat) : async () {
    requireUserPermission(caller);
    ignore Array.map(contactManager.getAllValues(),
      func(contact) {
        let isHeadOffice = if (contact.id == id) { true } else { false };
        let updatedContact = { contact with isHeadOffice };
        contactManager.update(contact.id, updatedContact);
      }
    );
  };

  // Floating Bubble Configuration - Requires authentication
  public shared ({ caller }) func updateFloatingBubbleConfig(config : T.FloatingBubbleConfig) : async () {
    requireUserPermission(caller);
    floatingBubbleConfig := config;
  };

  // About Section Management - Requires authentication
  public shared ({ caller }) func updateAboutSection(about : T.AboutSection) : async () {
    requireUserPermission(caller);
    aboutSection := about;
  };

  // Reset to Default - Requires authentication
  public shared ({ caller }) func resetToDefault() : async () {
    requireUserPermission(caller);
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
          mediaUrl = "wine.jpg";
        },
      ];
    };
  };

  // Admin Management - Requires admin permission
  public query ({ caller }) func getAdmins() : async [T.AdminEntry] {
    requireAdminPermission(caller);

    var adminList : [T.AdminEntry] = [];

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
    Principal.toText(caller);
  };
};
