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
import { useCart } from '../contexts/CartContext';
import { useGetProducts, useSubmitOrder, useGetProductPriceVisibility } from '../hooks/useQueries';
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
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

  const product = productsData?.find(([name]) => name === productId)?.[1];

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng`);
    navigate({ to: '/cart' });
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

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/product' })}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại sản phẩm
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/generated/wine-bottles-premium.dim_800x600.jpg';
                  }}
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                {product.categories && product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.categories.map((catId) => (
                      <Badge key={catId} variant="outline">
                        {catId}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-foreground/70 text-lg leading-relaxed">
                  {product.description}
                </p>
              </div>

              <Card>
                {showPrices && (
                  <CardHeader>
                    <CardTitle className="text-3xl text-primary">
                      {Number(product.price).toLocaleString('vi-VN')} VNĐ
                    </CardTitle>
                  </CardHeader>
                )}
                <CardContent className="space-y-6">
                  {/* Quantity Selector */}
                  <div>
                    <Label className="text-base mb-3 block">Số lượng</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
                        className="w-24 text-center text-lg"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Total Price */}
                  {showPrices && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg text-foreground/70">Tổng cộng:</span>
                        <span className="text-2xl font-bold text-primary">
                          {totalPrice.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Thêm vào giỏ hàng
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={() => setShowOrderDialog(true)}
                    >
                      Gửi đơn hàng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin đặt hàng</DialogTitle>
            <DialogDescription>
              Vui lòng điền thông tin để hoàn tất đơn hàng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Họ và tên *</Label>
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
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+84 123 456 789"
              />
            </div>
            <div>
              <Label htmlFor="message">Ghi chú</Label>
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
              Hủy
            </Button>
            <Button onClick={handleDirectOrder} disabled={submitOrder.isPending}>
              {submitOrder.isPending ? 'Đang gửi...' : 'Xác nhận đặt hàng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
