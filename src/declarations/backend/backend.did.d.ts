import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AboutMediaSection {
  'title' : string,
  'description' : string,
  'mediaUrl' : string,
  'mediaType' : string,
}
export interface AboutSection {
  'mainDescription' : string,
  'mediaSections' : Array<AboutMediaSection>,
  'introductoryHeading' : string,
}
export interface AdminEntry { 'principalId' : string }
export interface Article {
  'id' : bigint,
  'updateTime' : bigint,
  'title' : string,
  'content' : Array<ArticleContent>,
  'publishTime' : bigint,
}
export interface ArticleContent {
  'title' : string,
  'description' : string,
  'mediaUrl' : string,
  'mediaType' : string,
}
export interface CartItem { 'quantity' : bigint, 'product' : Product }
export interface Category { 'id' : bigint, 'name' : string }
export interface ContactLocation {
  'id' : bigint,
  'name' : string,
  'email' : string,
  'address' : string,
  'isHeadOffice' : boolean,
  'mapUrl' : string,
  'phone' : string,
}
export interface ContentSection {
  'title' : string,
  'content' : string,
  'mediaUrl' : string,
}
export interface CustomerMessage {
  'id' : bigint,
  'name' : string,
  'email' : string,
  'message' : string,
  'timestamp' : bigint,
  'phone' : string,
}
export interface FloatingBubbleConfig {
  'backgroundColor' : string,
  'hotlineNumberOverride' : string,
  'icon' : string,
  'isEnabled' : boolean,
}
export interface FooterData {
  'links' : Array<string>,
  'socialMedia' : Array<string>,
  'copyright' : string,
}
export interface IconLink { 'id' : bigint, 'icon' : string, 'link' : string }
export interface MediaContent { 'url' : string, 'mediaType' : string }
export interface MediaItem {
  'id' : bigint,
  'url' : string,
  'description' : string,
  'uploadTimestamp' : bigint,
  'caption' : string,
  'mediaType' : string,
}
export interface Order {
  'id' : bigint,
  'customerName' : string,
  'status' : OrderStatus,
  'customerPhone' : string,
  'totalAmount' : bigint,
  'timestamp' : bigint,
  'items' : Array<OrderItem>,
  'customerEmail' : string,
}
export interface OrderItem {
  'quantity' : bigint,
  'totalPrice' : bigint,
  'product' : Product,
}
export type OrderStatus = { 'cancelled' : null } |
  { 'pending' : null } |
  { 'completed' : null };
export interface PairingFood {
  'id' : bigint,
  'name' : string,
  'description' : string,
  'imageUrl' : string,
}
export interface Product {
  'id' : bigint,
  'categories' : Array<Category>,
  'tasting' : Array<TastingNote>,
  'name' : string,
  'description' : string,
  'imageUrl' : string,
  'price' : bigint,
  'paring' : Array<PairingFood>,
}
export interface SerializableAdminCMSData {
  'media' : Array<MediaContent>,
  'aboutSection' : ContentSection,
  'heroSection' : ContentSection,
  'contacts' : Array<ContactLocation>,
  'floatingBubbleConfig' : FloatingBubbleConfig,
  'teamMembers' : Array<TeamMember>,
  'iconLinks' : Array<IconLink>,
  'products' : Array<Product>,
  'footer' : FooterData,
  'header' : ContentSection,
}
export interface TastingNote {
  'id' : bigint,
  'name' : string,
  'description' : string,
  'imageUrl' : string,
}
export interface TeamMember {
  'id' : bigint,
  'bio' : string,
  'name' : string,
  'role' : string,
  'imageUrl' : string,
}
export interface UserProfile {
  'id' : bigint,
  'principal' : string,
  'name' : string,
  'role' : string,
  'email' : string,
}
export interface _SERVICE {
  'addAdmin' : ActorMethod<[string], undefined>,
  'addArticleItem' : ActorMethod<[string, Array<ArticleContent>], undefined>,
  'addCategory' : ActorMethod<[string], undefined>,
  'addContact' : ActorMethod<[ContactLocation], undefined>,
  'addMediaItem' : ActorMethod<[string, string, string, string], undefined>,
  'addProduct' : ActorMethod<[Product], undefined>,
  'cancelOrder' : ActorMethod<[bigint], undefined>,
  'deleteArticleItem' : ActorMethod<[bigint], boolean>,
  'deleteCategory' : ActorMethod<[bigint], boolean>,
  'deleteContact' : ActorMethod<[bigint], boolean>,
  'deleteCustomerMessage' : ActorMethod<[bigint], boolean>,
  'deleteMediaItem' : ActorMethod<[bigint], boolean>,
  'deleteOrder' : ActorMethod<[bigint], boolean>,
  'deleteProduct' : ActorMethod<[bigint], boolean>,
  'getAboutSection' : ActorMethod<[], AboutSection>,
  'getAdminCMSData' : ActorMethod<[], SerializableAdminCMSData>,
  'getAdmins' : ActorMethod<[], Array<AdminEntry>>,
  'getAllCustomerMessages' : ActorMethod<[], Array<[bigint, CustomerMessage]>>,
  'getArticleById' : ActorMethod<[bigint], [] | [Article]>,
  'getArticlePage' : ActorMethod<[bigint], Array<Article>>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCategories' : ActorMethod<[], Array<[bigint, Category]>>,
  'getContacts' : ActorMethod<[], Array<ContactLocation>>,
  'getCustomerMessages' : ActorMethod<[bigint], Array<CustomerMessage>>,
  'getFloatingBubbleConfig' : ActorMethod<[], FloatingBubbleConfig>,
  'getFooterData' : ActorMethod<[], FooterData>,
  'getHeadOfficeContact' : ActorMethod<[], [] | [ContactLocation]>,
  'getHeader' : ActorMethod<[], ContentSection>,
  'getHeroSection' : ActorMethod<[], ContentSection>,
  'getIconLinks' : ActorMethod<[], Array<IconLink>>,
  'getMediaItems' : ActorMethod<[bigint], Array<MediaItem>>,
  'getMediaPage' : ActorMethod<[bigint], Array<MediaItem>>,
  'getOrderById' : ActorMethod<[bigint], [] | [Order]>,
  'getOrders' : ActorMethod<[bigint], Array<Order>>,
  'getProductByName' : ActorMethod<[string], [] | [Product]>,
  'getProductPriceVisibility' : ActorMethod<[], boolean>,
  'getProducts' : ActorMethod<[], Array<[bigint, Product]>>,
  'getProductsByCategory' : ActorMethod<[string], Array<Product>>,
  'getTeamMembers' : ActorMethod<[], Array<TeamMember>>,
  'getTotalArticleCount' : ActorMethod<[], bigint>,
  'getTotalMediaCount' : ActorMethod<[], bigint>,
  'getTotalMessageCount' : ActorMethod<[], bigint>,
  'getTotalOrderCount' : ActorMethod<[], bigint>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'ping' : ActorMethod<[], string>,
  'removeAdmin' : ActorMethod<[Principal], undefined>,
  'resetToDefault' : ActorMethod<[], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'setHeadOffice' : ActorMethod<[bigint], undefined>,
  'submitCustomerMessage' : ActorMethod<[CustomerMessage], undefined>,
  'submitOrder' : ActorMethod<
    [string, string, string, Array<CartItem>],
    undefined
  >,
  'updateAboutSection' : ActorMethod<[AboutSection], undefined>,
  'updateArticleItem' : ActorMethod<
    [bigint, string, Array<ArticleContent>],
    undefined
  >,
  'updateCategory' : ActorMethod<[Category], undefined>,
  'updateContact' : ActorMethod<[ContactLocation], undefined>,
  'updateFloatingBubbleConfig' : ActorMethod<[FloatingBubbleConfig], undefined>,
  'updateFooterData' : ActorMethod<[FooterData], undefined>,
  'updateHeader' : ActorMethod<[ContentSection], undefined>,
  'updateHeroSection' : ActorMethod<[ContentSection], undefined>,
  'updateIconLinks' : ActorMethod<[Array<IconLink>], undefined>,
  'updateMedia' : ActorMethod<[Array<MediaItem>], undefined>,
  'updateMediaItem' : ActorMethod<[bigint, string, string, string], undefined>,
  'updateOrderStatus' : ActorMethod<[bigint, OrderStatus], undefined>,
  'updateProduct' : ActorMethod<[Product], undefined>,
  'updateProductPriceVisibility' : ActorMethod<[boolean], undefined>,
  'updateTeamMembers' : ActorMethod<[Array<TeamMember>], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
