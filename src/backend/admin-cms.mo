import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

module {
  type IconLink = {
    icon : Text;
    link : Text;
  };

  type ContentSection = {
    title : Text;
    content : Text;
    mediaUrl : Text;
  };

  type TeamMember = {
    name : Text;
    role : Text;
    imageUrl : Text;
    bio : Text;
  };

  type FooterData = {
    copyright : Text;
    links : [Text];
    socialMedia : [Text];
  };

  public type MediaContent = {
    url : Text;
    mediaType : Text;
  };

  type Product = {
    name : Text;
    description : Text;
    imageUrl : Text;
    price : Nat;
  };

  type ProcessStep = {
    stepTitle : Text;
    description : Text;
    mediaUrl : Text;
  };

  type ContactLocation = {
    name : Text;
    address : Text;
    phone : Text;
    email : Text;
    mapUrl : Text;
    isHeadOffice : Bool;
  };

  public type AdminCMSData = {
    header : ContentSection;
    footer : FooterData;
    iconLinks : [IconLink];
    heroSection : ContentSection;
    aboutSection : ContentSection;
    products : Map.Map<Text, Product>;
    processSteps : [ProcessStep];
    teamMembers : [TeamMember];
    contacts : [ContactLocation];
    media : [MediaContent];
  };

  public func init() : AdminCMSData {
    let defaultHero : ContentSection = {
      title = "Bản Sắc Việt";
      content = "Trải nghiệm hương vị độc đáo của rượu vang bản địa Việt Nam. Hòa quyện giữa truyền thống và hiện đại trong từng giọt rượu.";
      mediaUrl = "hero-vineyard.dim_1920x1080.jpg";
    };

    let defaultAbout : ContentSection = {
      title = "Câu Chuyện Của Chúng Tôi";
      content = "Hành trình khởi nghiệp từ những vườn nho địa phương, kết hợp phương pháp truyền thống với công nghệ hiện đại để tạo nên sản phẩm độc đáo.";
      mediaUrl = "vineyard-aerial.dim_1200x800.jpg";
    };

    let productsMap = Map.empty<Text, Product>();

    let product1 : Product = {
      name = "Rượu Vang Đỏ Cao Cấp";
      description = "Rượu vang đỏ cao cấp với hương vị mạnh mẽ và đậm đà, được ủ từ nho Việt Nam chất lượng cao. Thích hợp cho các bữa tiệc sang trọng.";
      imageUrl = "wine-bottles-premium.dim_800x600.jpg";
      price = 450000;
    };

    let product2 : Product = {
      name = "Rượu Vang Trắng Tinh Tế";
      description = "Rượu vang trắng nhẹ nhàng với hương thơm của hoa quả nhiệt đới. Hoàn hảo cho những buổi gặp gỡ thân mật.";
      imageUrl = "wine-pour.dim_600x800.jpg";
      price = 380000;
    };

    let product3 : Product = {
      name = "Rượu Vang Rosé Thanh Lịch";
      description = "Rượu vang rosé thanh lịch với màu hồng quyến rũ và hương vị cân bằng. Lựa chọn tuyệt vời cho mọi dịp.";
      imageUrl = "wine-tasting.dim_1024x683.jpg";
      price = 420000;
    };

    Map.add(productsMap, Text.compare, product1.name, product1);
    Map.add(productsMap, Text.compare, product2.name, product2);
    Map.add(productsMap, Text.compare, product3.name, product3);

    let defaultContactLocation : ContactLocation = {
      name = "Head Office";
      address = "123 Phố Rượu, Quận 1, Thành phố Hồ Chí Minh";
      phone = "+84 1230000000";
      email = "info@ruouvangviet.vn";
      mapUrl = "https://maps.google.com/example";
      isHeadOffice = true;
    };

    {
      header = {
        title = "KHÁM PHÁ HƯƠNG VỊ VIỆT";
        content = "Trải nghiệm hương vị độc đáo của rượu vang bản địa Việt Nam";
        mediaUrl = "wine-logo-transparent.dim_200x200.png";
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
        { icon = "facebook"; link = "https://facebook.com/ruouvangviet" },
        { icon = "instagram"; link = "https://instagram.com/ruouvangviet" },
      ];
      heroSection = defaultHero;
      aboutSection = defaultAbout;
      products = productsMap;
      processSteps = [];
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
  public func updateHeroSectionInternal(_ : ContentSection) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateAboutSectionInternal(_ : ContentSection) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateProcessStepsInternal(_ : [ProcessStep]) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateTeamMembersInternal(_ : [TeamMember]) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateFooterInternal(_ : FooterData) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateHeaderInternal(_ : ContentSection) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateIconLinksInternal(_ : [IconLink]) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func addProductInternal(_ : Product) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func updateMediaInternal(_ : [MediaContent]) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  public func addProcessStepInternal(_ : ProcessStep) : () {
    Runtime.trap("Internal functions should not be called directly");
  };

  func getVietnameseHeader() : ContentSection {
    {
      title = "KHÁM PHÁ HƯƠNG VỊ VIỆT";
      content = "Trải nghiệm hương vị độc đáo của rượu vang bản địa Việt Nam";
      mediaUrl = "wine-logo-transparent.dim_200x200.png";
    };
  };

  func getVietnameseHeroSection() : ContentSection {
    {
      title = "Bản Sắc Việt";
      content = "Trải nghiệm hương vị độc đáo của rượu vang bản địa Việt Nam. Hòa quyện giữa truyền thống và hiện đại trong từng giọt rượu.";
      mediaUrl = "hero-vineyard.dim_1920x1080.jpg";
    };
  };

  func getVietnameseAboutSection() : ContentSection {
    {
      title = "Câu Chuyện Của Chúng Tôi";
      content = "Hành trình khởi nghiệp từ những vườn nho địa phương, kết hợp phương pháp truyền thống với công nghệ hiện đại để tạo nên sản phẩm độc đáo.";
      mediaUrl = "vineyard-aerial.dim_1200x800.jpg";
    };
  };

  func getVietnameseProducts() : [Product] {
    [
      {
        name = "Rượu Vang Đỏ Cao Cấp";
        description = "Rượu vang đỏ cao cấp với hương vị mạnh mẽ và đậm đà, được ủ từ nho Việt Nam chất lượng cao. Thích hợp cho các bữa tiệc sang trọng.";
        imageUrl = "wine-bottles-premium.dim_800x600.jpg";
        price = 450000;
      },
      {
        name = "Rượu Vang Trắng Tinh Tế";
        description = "Rượu vang trắng nhẹ nhàng với hương thơm của hoa quả nhiệt đới. Hoàn hảo cho những buổi gặp gỡ thân mật.";
        imageUrl = "wine-pour.dim_600x800.jpg";
        price = 380000;
      },
      {
        name = "Rượu Vang Rosé Thanh Lịch";
        description = "Rượu vang rosé thanh lịch với màu hồng quyến rũ và hương vị cân bằng. Lựa chọn tuyệt vời cho mọi dịp.";
        imageUrl = "wine-tasting.dim_1024x683.jpg";
        price = 420000;
      },
    ];
  };

  func getVietnameseProcessSteps() : [ProcessStep] {
    [
      {
        stepTitle = "Công Đoạn Thu Hoạch";
        description = "Quá trình thu hoạch nho thủ công giúp bảo toàn chất lượng vùng thổ nhưỡng.";
        mediaUrl = "grape-harvest.dim_800x600.jpg";
      },
      {
        stepTitle = "Ủ Rượu";
        description = "Ủ rượu theo quy trình kiểm soát nghiêm ngặt đảm bảo đạt chất lượng tốt nhất.";
        mediaUrl = "wine-cellar.dim_1024x768.jpg";
      },
      {
        stepTitle = "Thử Rượu";
        description = "Chuyên gia thử rượu kiểm tra chất lượng và hương vị.";
        mediaUrl = "wine-tasting.dim_1200x800.jpg";
      },
    ];
  };

  func getVietnameseTeamMembers() : [TeamMember] {
    [
      {
        name = "Hà";
        role = "Sommelier";
        imageUrl = "sommelier-female.dim_400x400.jpg";
        bio = "Chuyên gia thử rượu với kinh nghiệm 15 năm.";
      },
      {
        name = "Đức";
        role = "Winemaker";
        imageUrl = "winemaker-male.dim_400x400.jpg";
        bio = "Nhà sản xuất rượu vang với đam mê tạo ra những loại rượu đặc sắc.";
      },
    ];
  };

  func getVietnameseFooter() : FooterData {
    {
      copyright = "© 2024 Rượu Vang Việt. All rights reserved.";
      links = ["/about", "/products", "/process", "/team", "/contact"];
      socialMedia = [
        "https://facebook.com/ruouvangviet",
        "https://instagram.com/ruouvangviet",
      ];
    };
  };

  public func getProductByName(name : Text) : ?Product {
    let products = Map.empty<Text, Product>();
    Map.get(products, Text.compare, name);
  };

  public func getHeader() : ContentSection {
    getVietnameseHeader();
  };

  public func getHeroSection() : ContentSection {
    getVietnameseHeroSection();
  };

  public func getAboutSection() : ContentSection {
    getVietnameseAboutSection();
  };

  public func getProducts() : [Product] {
    getVietnameseProducts();
  };

  public func getProcessSteps() : [ProcessStep] {
    getVietnameseProcessSteps();
  };

  public func getTeamMembers() : [TeamMember] {
    getVietnameseTeamMembers();
  };

  public func getContacts() : [ContactLocation] {
    let defaultContact : ContactLocation = {
      name = "Head Office";
      address = "123 Phố Rượu, Quận 1, Thành phố Hồ Chí Minh";
      phone = "+84 1230000000";
      email = "info@ruouvangviet.vn";
      mapUrl = "https://maps.google.com/example";
      isHeadOffice = true;
    };
    [defaultContact];
  };

  public func getFooter() : FooterData {
    getVietnameseFooter();
  };

  public func getMedia() : [MediaContent] {
    [];
  };

  public func getIconLinks() : [IconLink] {
    [
      { icon = "facebook"; link = "https://facebook.com/ruouvangviet" },
      { icon = "instagram"; link = "https://instagram.com/ruouvangviet" },
    ];
  };
};

