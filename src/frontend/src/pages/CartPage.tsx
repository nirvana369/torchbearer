import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCart } from '../contexts/CartContext';
import { useSubmitOrder, useGetProductPriceVisibility } from '../hooks/useQueries';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart();
  const submitOrder = useSubmitOrder();
  const { data: showPrices = true } = useGetProductPriceVisibility();
  
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmitOrder = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const cartItems = items.map(item => ({
        product: item.product,
        quantity: BigInt(item.quantity)
      }));

      await submitOrder.mutateAsync({
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        items: cartItems
      });

      toast.success('Đơn hàng đã được gửi thành công!');
      setShowOrderDialog(false);
      clearCart();
      setFormData({ name: '', email: '', phone: '', message: '' });
      navigate({ to: '/' });
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Có lỗi xảy ra khi gửi đơn hàng');
    }
  };

  const handleRemoveItem = (productName: string) => {
    setItemToRemove(productName);
    setShowRemoveDialog(true);
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      removeFromCart(itemToRemove);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    }
    setShowRemoveDialog(false);
    setItemToRemove(null);
  };

  const confirmClearCart = () => {
    clearCart();
    toast.success('Đã xóa toàn bộ giỏ hàng');
    setShowClearDialog(false);
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 min-h-screen bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
              <h1 className="text-3xl font-bold mb-4">Giỏ hàng trống</h1>
              <p className="text-foreground/70 mb-8">
                Bạn chưa có sản phẩm nào trong giỏ hàng
              </p>
              <Button onClick={() => navigate({ to: '/product' })}>
                Xem sản phẩm
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

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
              Tiếp tục mua sắm
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Giỏ hàng của bạn
            </h1>
            <p className="text-xl text-foreground/70">
              {getTotalItems()} sản phẩm
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const imageUrl = item.product.imageUrl.startsWith('/')
                  ? item.product.imageUrl
                  : `/assets/generated/${item.product.imageUrl}`;
                const itemTotal = Number(item.product.price) * item.quantity;

                return (
                  <Card key={item.product.name}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/generated/wine-bottles-premium.dim_800x600.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{item.product.name}</h3>
                          <p className="text-foreground/70 text-sm mb-3 line-clamp-2">
                            {item.product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product.name, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    updateQuantity(item.product.name, val);
                                  }
                                }}
                                className="w-16 text-center"
                                min="1"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product.name, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {showPrices && (
                              <div className="text-right">
                                <p className="text-sm text-foreground/60">
                                  {Number(item.product.price).toLocaleString('vi-VN')} VNĐ
                                </p>
                                <p className="font-semibold text-primary">
                                  {itemTotal.toLocaleString('vi-VN')} VNĐ
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.product.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Tổng đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/70">Số lượng:</span>
                      <span>{getTotalItems()} sản phẩm</span>
                    </div>
                    {showPrices && (
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Tổng cộng:</span>
                        <span className="text-primary">{getTotalPrice().toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setShowOrderDialog(true)}
                  >
                    Gửi đơn hàng
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowClearDialog(true)}
                  >
                    Xóa giỏ hàng
                  </Button>
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
            <Button onClick={handleSubmitOrder} disabled={submitOrder.isPending}>
              {submitOrder.isPending ? 'Đang gửi...' : 'Xác nhận đặt hàng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Cart Confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa giỏ hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearCart}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Item Confirmation */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
