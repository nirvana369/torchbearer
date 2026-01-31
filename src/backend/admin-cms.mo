import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import T "object/types";

module {

  public func init(productsMap : Map.Map<Nat, T.Product>) : T.AdminCMSData {
    let defaultHero : T.ContentSection = {
      title = "Bản Sắc Việt";
      content = "Trải nghiệm hương vị độc đáo của rượu vang bản địa Việt Nam. Hòa quyện giữa truyền thống và hiện đại trong từng giọt rượu.";
      mediaUrl = "wine.jpg";
    };

    let defaultAbout : T.ContentSection = {
      title = "Câu Chuyện Của Chúng Tôi";
      content = "Hành trình khởi nghiệp từ những vườn nho địa phương, kết hợp phương pháp truyền thống với công nghệ hiện đại để tạo nên sản phẩm độc đáo.";
      mediaUrl = "wine.jpg";
    };


    let defaultContactLocation : T.ContactLocation = {
      id = 0;
      name = "Head Office";
      address = "123 Phố Rượu, Quận 1, Thành phố Hồ Chí Minh";
      phone = "+84 1230000000";
      email = "info@ruouvangviet.vn";
      mapUrl = "https://maps.google.com/example";
      isHeadOffice = true;
    };

    {
      header = {
        title = "Torch Bearer Tasmania";
        content = "Trải nghiệm hương vị độc đáo của rượu vang bản địa Việt Nam";
        mediaUrl = "logo.webp";
      };
      footer = {
        copyright = "© 2024 Rượu Vang Việt. All rights reserved.";
        links = ["/about", "/products", "/process", "/team", "/contact"];
        socialMedia = [
          "https://facebook.com/ruouvangviet",
          "https://instagram.com/ruouvangviet",
        ];
      };
      iconLinks = [
        { id = 0; icon = "facebook"; link = "https://facebook.com/ruouvangviet" },
        { id = 1; icon = "instagram"; link = "https://instagram.com/ruouvangviet" },
      ];
      heroSection = defaultHero;
      aboutSection = defaultAbout;
      products = productsMap;
      teamMembers = [];
      contacts = [defaultContactLocation];
      media = [];
    };
  };

  func getTranslationKeysForLanguage(_language : Text) : [Text] {
    [
      "header.title",
      "heroSection.title",
      "aboutSection.title",
      "contactInfo.address",
      "footer.copyright",
    ];
  };

  public func getTranslationKeys(language : Text) : [Text] {
    getTranslationKeysForLanguage(language);
  };

  // Public update functions for each section
  public func updateHeroSectionInternal(_ : T.ContentSection) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateAboutSectionInternal(_ : T.ContentSection) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateTeamMembersInternal(_ : [T.TeamMember]) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateFooterInternal(_ : T.FooterData) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateHeaderInternal(_ : T.ContentSection) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateIconLinksInternal(_ : [T.IconLink]) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func addProductInternal(_ : T.Product) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateMediaInternal(_ : [T.MediaContent]) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  func getVietnameseHeader() : T.ContentSection {
    {
      title = "Torch Bearer Tasmania";
      content = "Trải nghiệm hương vị độc đáo của rượu vang bản địa Việt Nam";
      mediaUrl = "logo.webp";
    };
  };

  func getVietnameseHeroSection() : T.ContentSection {
    {
      title = "Bản Sắc Việt";
      content = "Trải nghiệm hương vị độc đáo của rượu vang bản địa Việt Nam. Hòa quyện giữa truyền thống và hiện đại trong từng giọt rượu.";
      mediaUrl = "hero-vineyard.dim_1920x1080.jpg";
    };
  };

  func getVietnameseAboutSection() : T.ContentSection {
    {
      title = "Câu Chuyện Của Chúng Tôi";
      content = "Hành trình khởi nghiệp từ những vườn nho địa phương, kết hợp phương pháp truyền thống với công nghệ hiện đại để tạo nên sản phẩm độc đáo.";
      mediaUrl = "wine.jpg";
    };
  };

  func getVietnameseProducts() : [T.Product] {
    [];
  };

  func getVietnameseTeamMembers() : [T.TeamMember] {
    [
      {
        id = 0;
        name = "Hà";
        role = "Sommelier";
        imageUrl = "sommelier-female.dim_400x400.jpg";
        bio = "Chuyên gia thử rượu với kinh nghiệm 15 năm.";
      },
      {
        id = 1;
        name = "Đức";
        role = "Winemaker";
        imageUrl = "winemaker-male.dim_400x400.jpg";
        bio = "Nhà sản xuất rượu vang với đam mê tạo ra những loại rượu đặc sắc.";
      },
    ];
  };

  func getVietnameseFooter() : T.FooterData {
    {
      copyright = "© 2024 Rượu Vang Việt. All rights reserved.";
      links = ["/about", "/products", "/process", "/team", "/contact"];
      socialMedia = [
        "https://facebook.com/ruouvangviet",
        "https://instagram.com/ruouvangviet",
      ];
    };
  };

  public func getProductByName(name : Text) : ?T.Product {
    let products = Map.empty<Text, T.Product>();
    Map.get(products, Text.compare, name);
  };

  public func getHeader() : T.ContentSection {
    getVietnameseHeader();
  };

  public func getHeroSection() : T.ContentSection {
    getVietnameseHeroSection();
  };

  public func getAboutSection() : T.ContentSection {
    getVietnameseAboutSection();
  };

  public func getProducts() : [T.Product] {
    getVietnameseProducts();
  };

  public func getTeamMembers() : [T.TeamMember] {
    getVietnameseTeamMembers();
  };

  public func getContacts() : [T.ContactLocation] {
    let defaultContact : T.ContactLocation = {
      id = 0;
      name = "Head Office";
      address = "123 Phố Rượu, Quận 1, Thành phố Hồ Chí Minh";
      phone = "+84 1230000000";
      email = "info@ruouvangviet.vn";
      mapUrl = "https://maps.google.com/example";
      isHeadOffice = true;
    };
    [defaultContact];
  };

  public func getFooter() : T.FooterData {
    getVietnameseFooter();
  };

  public func getMedia() : [T.MediaContent] {
    [];
  };

  public func getIconLinks() : [T.IconLink] {
    [
      { id = 0; icon = "facebook"; link = "https://facebook.com/ruouvangviet" },
      { id = 1; icon = "instagram"; link = "https://instagram.com/ruouvangviet" },
    ];
  };
};

