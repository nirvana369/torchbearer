import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useCart } from '../contexts/CartContext';
import { useGetProducts, useSubmitOrder, useGetProductPriceVisibility } from '../hooks/useQueries';
import { ArrowLeft, Plus, Minus, ShoppingCart, Phone, MessageCircle, Mail, Wine, Grape, Thermometer, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderPage() {
  const navigate = useNavigate();
  const params = useParams({ from: '/order/$productId' });
  const productId = decodeURIComponent(params.productId);
  
  const { data: productsData, isLoading } = useGetProducts();
  const { data: showPrices = true } = useGetProductPriceVisibility();
  const { addToCart } = useCart();
  const submitOrder = useSubmitOrder();
  
  const [quantity, setQuantity] = useState(1);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const product = productsData?.find(([id]) => id.toString() === productId)?.[1];
  const relatedProducts = productsData?.filter(([id]) => id.toString() !== productId).slice(0, 4) || [];

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng`);
  };

  const handleDirectOrder = async () => {
    if (!product) return;
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await submitOrder.mutateAsync({
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        items: [{
          product,
          quantity: BigInt(quantity)
        }]
      });

      toast.success('Đơn hàng đã được gửi thành công!');
      setShowOrderDialog(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
      navigate({ to: '/' });
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Có lỗi xảy ra khi gửi đơn hàng');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-foreground/60">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 min-h-screen bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <h1 className="text-3xl font-bold mb-4">Không tìm thấy sản phẩm</h1>
              <Button onClick={() => navigate({ to: '/product' })}>
                Quay lại trang sản phẩm
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const imageUrl = product.imageUrl.startsWith('/')
    ? product.imageUrl
    : `/assets/generated/${product.imageUrl}`;
  const totalPrice = Number(product.price) * quantity;

  // Mock data for demonstration - in production, this would come from backend
  const flavorProfile = {
    sweetness: 45,
    tannins: 70,
    body: 65,
    acidity: 55,
    alcohol: 13.5
  };

  const productInfo = {
    vintage: '2021',
    grapeVariety: 'Pinot Noir',
    region: 'Tasmania, Australia',
    capacity: '750ml',
    alcoholContent: '13.5%',
    servingTemp: '16-18°C'
  };

  const pairings = [
    { name: 'Thịt đỏ', icon: '🥩', nameEn: 'Red Meat' },
    { name: 'Phô mai', icon: '🧀', nameEn: 'Cheese' },
    { name: 'Hải sản', icon: '🦞', nameEn: 'Seafood' },
    { name: 'Nấm', icon: '🍄', nameEn: 'Mushrooms' }
  ];

  const mainFlavors = [
    { name: 'Cherry', icon: '🍒', nameVi: 'Anh đào' },
    { name: 'Oak', icon: '🌳', nameVi: 'Gỗ sồi' },
    { name: 'Pepper', icon: '🌶️', nameVi: 'Tiêu' },
    { name: 'Vanilla', icon: '🌼', nameVi: 'Vani' }
  ];

  const accessories = [
    { name: 'Túi vải Canvas cao cấp', price: 50000, image: '/assets/generated/wine-accessories.dim_800x600.jpg' },
    { name: 'Hộp quà tặng sang trọng', price: 120000, image: '/assets/generated/wine-accessories.dim_800x600.jpg' },
    { name: 'Dụng cụ mở rượu chuyên nghiệp', price: 180000, image: '/assets/generated/wine-accessories.dim_800x600.jpg' }
  ];

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/product' })}
              className="mb-4 text-foreground/70 hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại sản phẩm
            </Button>
          </div>

          {/* Main Product Section - Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Left Column - Media Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted shadow-xl">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain p-8"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/generated/luxury-wine-bottle.dim_600x800.jpg';
                  }}
                />
              </div>
              {/* Thumbnail Gallery - placeholder for future enhancement */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted/30 border-2 border-transparent hover:border-primary cursor-pointer transition-colors">
                    <img
                      src={imageUrl}
                      alt={`${product.name} view ${i}`}
                      className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/generated/wine-bottles-premium.dim_800x600.jpg';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="space-y-6">
              {/* Product Summary */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-3 text-foreground">{product.name}</h1>
                <p className="text-lg text-foreground/60 mb-4">Premium Tasmanian Wine</p>
                
                {/* Classification Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.categories && product.categories.length > 0 && (
                    product.categories.map((catId) => (
                      <Badge key={catId.id} variant="outline" className="px-3 py-1 text-sm">
                        {catId.name}
                      </Badge>
                    ))
                  )}
                  <Badge variant="secondary" className="px-3 py-1 text-sm bg-accent/20 text-accent-foreground">Medium</Badge>
                  <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary">Premium</Badge>
                  <Badge variant="secondary" className="px-3 py-1 text-sm bg-secondary/20 text-secondary-foreground">Magnum</Badge>
                </div>

                {showPrices && (
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-4xl font-bold text-primary">
                      {Number(product.price).toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xl text-foreground/60">VNĐ</span>
                  </div>
                )}

                <p className="text-foreground/70 leading-relaxed mb-6">
                  {product.description}
                </p>
              </div>

              <Separator />

              {/* Flavor Profile Visualization */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Wine className="h-5 w-5 text-primary" />
                  Hương vị / Flavor Profile
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-foreground/70">Độ ngọt / Sweetness</span>
                      <span className="text-sm font-medium">{flavorProfile.sweetness}%</span>
                    </div>
                    <Progress value={flavorProfile.sweetness} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-foreground/70">Tannin</span>
                      <span className="text-sm font-medium">{flavorProfile.tannins}%</span>
                    </div>
                    <Progress value={flavorProfile.tannins} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-foreground/70">Độ đậm / Body</span>
                      <span className="text-sm font-medium">{flavorProfile.body}%</span>
                    </div>
                    <Progress value={flavorProfile.body} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-foreground/70">Độ chua / Acidity</span>
                      <span className="text-sm font-medium">{flavorProfile.acidity}%</span>
                    </div>
                    <Progress value={flavorProfile.acidity} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-foreground/70">Nồng độ cồn / Alcohol</span>
                      <span className="text-sm font-medium">{flavorProfile.alcohol}%</span>
                    </div>
                    <Progress value={(flavorProfile.alcohol / 15) * 100} className="h-2" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Product Information Table */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Thông tin sản phẩm / Product Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-foreground/60">Vintage</p>
                      <p className="font-medium">{productInfo.vintage}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Grape className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-foreground/60">Grape Variety</p>
                      <p className="font-medium">{productInfo.grapeVariety}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-foreground/60">Region</p>
                      <p className="font-medium">{productInfo.region}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Wine className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-foreground/60">Capacity</p>
                      <p className="font-medium">{productInfo.capacity}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Wine className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-foreground/60">Alcohol Content</p>
                      <p className="font-medium">{productInfo.alcoholContent}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Thermometer className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-foreground/60">Serving Temp</p>
                      <p className="font-medium">{productInfo.servingTemp}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Wine Pairing Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Kết hợp món ăn / Food Pairing</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {pairings.map((pairing, idx) => (
                    <Card key={idx} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="text-4xl mb-2">{pairing.icon}</div>
                        <p className="text-sm font-medium">{pairing.name}</p>
                        <p className="text-xs text-foreground/60">{pairing.nameEn}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Main Flavors Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Hương vị chính / Main Flavors</h3>
                <div className="flex flex-wrap gap-3">
                  {mainFlavors.map((flavor, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border hover:border-primary transition-colors">
                      <span className="text-2xl">{flavor.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium">{flavor.name}</p>
                        <p className="text-xs text-foreground/60">{flavor.nameVi}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Quantity Selector & Actions */}
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-base mb-3 block">Số lượng / Quantity</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-10 w-10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            setQuantity(val);
                          }
                        }}
                        className="w-20 text-center text-lg font-semibold"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-10 w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {showPrices && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg text-foreground/70">Tổng cộng / Total:</span>
                        <span className="text-3xl font-bold text-primary">
                          {totalPrice.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Call-to-Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="lg"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Thêm vào giỏ hàng / Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      size="lg"
                      onClick={() => setShowOrderDialog(true)}
                    >
                      Đặt hàng ngay / Order Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Support Box */}
              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg">Hỗ trợ khách hàng / Customer Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Phone className="mr-2 h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">Hotline</p>
                      <p className="text-sm text-foreground/60">+84 904 117 789</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <MessageCircle className="mr-2 h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">Live Chat</p>
                      <p className="text-sm text-foreground/60">Trò chuyện trực tuyến</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Mail className="mr-2 h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">Email</p>
                      <p className="text-sm text-foreground/60">contact@torchbearerwine.com</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Accessories Section */}
          <div className="mb-16">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="accessories" className="border rounded-lg px-6">
                <AccordionTrigger className="text-2xl font-semibold hover:no-underline">
                  Phụ kiện đi kèm / Wine Accessories
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    {accessories.map((accessory, idx) => (
                      <Card key={idx} className="hover:shadow-lg transition-shadow">
                        <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
                          <img
                            src={accessory.image}
                            alt={accessory.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/generated/wine-accessories.dim_800x600.jpg';
                            }}
                          />
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">{accessory.name}</h4>
                          {showPrices && (
                            <p className="text-lg font-bold text-primary mb-3">
                              {accessory.price.toLocaleString('vi-VN')} VNĐ
                            </p>
                          )}
                          <Button variant="outline" size="sm" className="w-full">
                            Thêm vào giỏ
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Related Products Carousel */}
          {relatedProducts.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">Sản phẩm liên quan / Related Products</h2>
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {relatedProducts.map(([id, relatedProduct]) => {
                    const relatedImageUrl = relatedProduct.imageUrl.startsWith('/')
                      ? relatedProduct.imageUrl
                      : `/assets/generated/${relatedProduct.imageUrl}`;
                    
                    return (
                      <CarouselItem key={id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                        <Card 
                          className="cursor-pointer hover:shadow-xl transition-shadow"
                          onClick={() => navigate({ to: `/order/${encodeURIComponent(id.toString())}` })}
                        >
                          <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted">
                            <img
                              src={relatedImageUrl}
                              alt={relatedProduct.name}
                              className="w-full h-full object-contain p-4"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/generated/wine-bottles-premium.dim_800x600.jpg';
                              }}
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-2">{relatedProduct.name}</h3>
                            {relatedProduct.categories && relatedProduct.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {relatedProduct.categories.slice(0, 2).map((catId) => (
                                  <Badge key={catId.id} variant="outline" className="text-xs">
                                    {catId.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {showPrices && (
                              <p className="text-xl font-bold text-primary mb-3">
                                {Number(relatedProduct.price).toLocaleString('vi-VN')} VNĐ
                              </p>
                            )}
                            <Button variant="outline" size="sm" className="w-full">
                              Xem chi tiết
                            </Button>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-0" />
                <CarouselNext className="right-0" />
              </Carousel>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin đặt hàng / Order Information</DialogTitle>
            <DialogDescription>
              Vui lòng điền thông tin để hoàn tất đơn hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Họ và tên / Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại / Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+84 123 456 789"
              />
            </div>
            <div>
              <Label htmlFor="message">Ghi chú / Notes</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Ghi chú thêm về đơn hàng..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              Hủy / Cancel
            </Button>
            <Button onClick={handleDirectOrder} disabled={submitOrder.isPending}>
              {submitOrder.isPending ? 'Đang gửi...' : 'Xác nhận đặt hàng / Confirm Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
