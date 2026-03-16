export const idlFactory = ({ IDL }) => {
  const ArticleContent = IDL.Record({
    'title' : IDL.Text,
    'description' : IDL.Text,
    'mediaUrl' : IDL.Text,
    'mediaType' : IDL.Text,
  });
  const ContactLocation = IDL.Record({
    'id' : IDL.Nat,
    'name' : IDL.Text,
    'email' : IDL.Text,
    'address' : IDL.Text,
    'isHeadOffice' : IDL.Bool,
    'mapUrl' : IDL.Text,
    'phone' : IDL.Text,
  });
  const Category = IDL.Record({ 'id' : IDL.Nat, 'name' : IDL.Text });
  const TastingNote = IDL.Record({
    'id' : IDL.Nat,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'imageUrl' : IDL.Text,
  });
  const PairingFood = IDL.Record({
    'id' : IDL.Nat,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'imageUrl' : IDL.Text,
  });
  const Product = IDL.Record({
    'id' : IDL.Nat,
    'categories' : IDL.Vec(Category),
    'tasting' : IDL.Vec(TastingNote),
    'name' : IDL.Text,
    'description' : IDL.Text,
    'imageUrl' : IDL.Text,
    'price' : IDL.Nat,
    'paring' : IDL.Vec(PairingFood),
  });
  const AboutMediaSection = IDL.Record({
    'title' : IDL.Text,
    'description' : IDL.Text,
    'mediaUrl' : IDL.Text,
    'mediaType' : IDL.Text,
  });
  const AboutSection = IDL.Record({
    'mainDescription' : IDL.Text,
    'mediaSections' : IDL.Vec(AboutMediaSection),
    'introductoryHeading' : IDL.Text,
  });
  const MediaContent = IDL.Record({ 'url' : IDL.Text, 'mediaType' : IDL.Text });
  const ContentSection = IDL.Record({
    'title' : IDL.Text,
    'content' : IDL.Text,
    'mediaUrl' : IDL.Text,
  });
  const FloatingBubbleConfig = IDL.Record({
    'backgroundColor' : IDL.Text,
    'hotlineNumberOverride' : IDL.Text,
    'icon' : IDL.Text,
    'isEnabled' : IDL.Bool,
  });
  const TeamMember = IDL.Record({
    'id' : IDL.Nat,
    'bio' : IDL.Text,
    'name' : IDL.Text,
    'role' : IDL.Text,
    'imageUrl' : IDL.Text,
  });
  const IconLink = IDL.Record({
    'id' : IDL.Nat,
    'icon' : IDL.Text,
    'link' : IDL.Text,
  });
  const FooterData = IDL.Record({
    'links' : IDL.Vec(IDL.Text),
    'socialMedia' : IDL.Vec(IDL.Text),
    'copyright' : IDL.Text,
  });
  const SerializableAdminCMSData = IDL.Record({
    'media' : IDL.Vec(MediaContent),
    'aboutSection' : ContentSection,
    'heroSection' : ContentSection,
    'contacts' : IDL.Vec(ContactLocation),
    'floatingBubbleConfig' : FloatingBubbleConfig,
    'teamMembers' : IDL.Vec(TeamMember),
    'iconLinks' : IDL.Vec(IconLink),
    'products' : IDL.Vec(Product),
    'footer' : FooterData,
    'header' : ContentSection,
  });
  const AdminEntry = IDL.Record({ 'principalId' : IDL.Text });
  const CustomerMessage = IDL.Record({
    'id' : IDL.Nat,
    'name' : IDL.Text,
    'email' : IDL.Text,
    'message' : IDL.Text,
    'timestamp' : IDL.Int,
    'phone' : IDL.Text,
  });
  const Article = IDL.Record({
    'id' : IDL.Nat,
    'updateTime' : IDL.Int,
    'title' : IDL.Text,
    'content' : IDL.Vec(ArticleContent),
    'publishTime' : IDL.Int,
  });
  const UserProfile = IDL.Record({
    'id' : IDL.Nat,
    'principal' : IDL.Text,
    'name' : IDL.Text,
    'role' : IDL.Text,
    'email' : IDL.Text,
  });
  const MediaItem = IDL.Record({
    'id' : IDL.Nat,
    'url' : IDL.Text,
    'description' : IDL.Text,
    'uploadTimestamp' : IDL.Int,
    'caption' : IDL.Text,
    'mediaType' : IDL.Text,
  });
  const OrderStatus = IDL.Variant({
    'cancelled' : IDL.Null,
    'pending' : IDL.Null,
    'completed' : IDL.Null,
  });
  const OrderItem = IDL.Record({
    'quantity' : IDL.Nat,
    'totalPrice' : IDL.Nat,
    'product' : Product,
  });
  const Order = IDL.Record({
    'id' : IDL.Nat,
    'customerName' : IDL.Text,
    'status' : OrderStatus,
    'customerPhone' : IDL.Text,
    'totalAmount' : IDL.Nat,
    'timestamp' : IDL.Int,
    'items' : IDL.Vec(OrderItem),
    'customerEmail' : IDL.Text,
  });
  const CartItem = IDL.Record({ 'quantity' : IDL.Nat, 'product' : Product });
  return IDL.Service({
    'addAdmin' : IDL.Func([IDL.Text], [], []),
    'addArticleItem' : IDL.Func([IDL.Text, IDL.Vec(ArticleContent)], [], []),
    'addCategory' : IDL.Func([IDL.Text], [], []),
    'addContact' : IDL.Func([ContactLocation], [], []),
    'addMediaItem' : IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [], []),
    'addProduct' : IDL.Func([Product], [], []),
    'cancelOrder' : IDL.Func([IDL.Nat], [], []),
    'deleteArticleItem' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteCategory' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteContact' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteCustomerMessage' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteMediaItem' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteOrder' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteProduct' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getAboutSection' : IDL.Func([], [AboutSection], ['query']),
    'getAdminCMSData' : IDL.Func([], [SerializableAdminCMSData], ['query']),
    'getAdmins' : IDL.Func([], [IDL.Vec(AdminEntry)], ['query']),
    'getAllCustomerMessages' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat, CustomerMessage))],
        ['query'],
      ),
    'getArticleById' : IDL.Func([IDL.Nat], [IDL.Opt(Article)], ['query']),
    'getArticlePage' : IDL.Func([IDL.Nat], [IDL.Vec(Article)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCategories' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat, Category))],
        ['query'],
      ),
    'getContacts' : IDL.Func([], [IDL.Vec(ContactLocation)], ['query']),
    'getCustomerMessages' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(CustomerMessage)],
        ['query'],
      ),
    'getFloatingBubbleConfig' : IDL.Func([], [FloatingBubbleConfig], ['query']),
    'getFooterData' : IDL.Func([], [FooterData], ['query']),
    'getHeadOfficeContact' : IDL.Func(
        [],
        [IDL.Opt(ContactLocation)],
        ['query'],
      ),
    'getHeader' : IDL.Func([], [ContentSection], ['query']),
    'getHeroSection' : IDL.Func([], [ContentSection], ['query']),
    'getIconLinks' : IDL.Func([], [IDL.Vec(IconLink)], ['query']),
    'getMediaItems' : IDL.Func([IDL.Nat], [IDL.Vec(MediaItem)], ['query']),
    'getMediaPage' : IDL.Func([IDL.Nat], [IDL.Vec(MediaItem)], ['query']),
    'getOrderById' : IDL.Func([IDL.Nat], [IDL.Opt(Order)], ['query']),
    'getOrders' : IDL.Func([IDL.Nat], [IDL.Vec(Order)], ['query']),
    'getProductByName' : IDL.Func([IDL.Text], [IDL.Opt(Product)], ['query']),
    'getProductPriceVisibility' : IDL.Func([], [IDL.Bool], ['query']),
    'getProducts' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat, Product))],
        ['query'],
      ),
    'getProductsByCategory' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(Product)],
        ['query'],
      ),
    'getTeamMembers' : IDL.Func([], [IDL.Vec(TeamMember)], ['query']),
    'getTotalArticleCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalMediaCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalMessageCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalOrderCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'ping' : IDL.Func([], [IDL.Text], []),
    'removeAdmin' : IDL.Func([IDL.Principal], [], []),
    'resetToDefault' : IDL.Func([], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'setHeadOffice' : IDL.Func([IDL.Nat], [], []),
    'submitCustomerMessage' : IDL.Func([CustomerMessage], [], []),
    'submitOrder' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Vec(CartItem)],
        [],
        [],
      ),
    'updateAboutSection' : IDL.Func([AboutSection], [], []),
    'updateArticleItem' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Vec(ArticleContent)],
        [],
        [],
      ),
    'updateCategory' : IDL.Func([Category], [], []),
    'updateContact' : IDL.Func([ContactLocation], [], []),
    'updateFloatingBubbleConfig' : IDL.Func([FloatingBubbleConfig], [], []),
    'updateFooterData' : IDL.Func([FooterData], [], []),
    'updateHeader' : IDL.Func([ContentSection], [], []),
    'updateHeroSection' : IDL.Func([ContentSection], [], []),
    'updateIconLinks' : IDL.Func([IDL.Vec(IconLink)], [], []),
    'updateMedia' : IDL.Func([IDL.Vec(MediaItem)], [], []),
    'updateMediaItem' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text, IDL.Text],
        [],
        [],
      ),
    'updateOrderStatus' : IDL.Func([IDL.Nat, OrderStatus], [], []),
    'updateProduct' : IDL.Func([Product], [], []),
    'updateProductPriceVisibility' : IDL.Func([IDL.Bool], [], []),
    'updateTeamMembers' : IDL.Func([IDL.Vec(TeamMember)], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
