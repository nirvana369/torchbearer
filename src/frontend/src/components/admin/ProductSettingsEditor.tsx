import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGetProductPriceVisibility, useUpdateProductPriceVisibility } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function ProductSettingsEditor() {
  const { data: showPrices, isLoading } = useGetProductPriceVisibility();
  const updatePriceVisibility = useUpdateProductPriceVisibility();

  const handleTogglePriceVisibility = async () => {
    try {
      await updatePriceVisibility.mutateAsync(!showPrices);
      toast.success(
        showPrices 
          ? 'Đã ẩn giá sản phẩm trên trang web' 
          : 'Đã hiển thị giá sản phẩm trên trang web'
      );
    } catch (error) {
      console.error('Error updating price visibility:', error);
      toast.error('Có lỗi xảy ra khi cập nhật cài đặt');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt sản phẩm</CardTitle>
          <CardDescription>Đang tải...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt sản phẩm</CardTitle>
        <CardDescription>
          Quản lý cài đặt hiển thị và hành vi của sản phẩm trên trang web
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Visibility Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              {showPrices ? (
                <Eye className="h-5 w-5 text-primary" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <Label htmlFor="price-visibility" className="text-base font-semibold cursor-pointer">
                Hiển thị giá sản phẩm
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {showPrices 
                ? 'Giá sản phẩm đang được hiển thị trên trang chủ, trang sản phẩm, và giỏ hàng'
                : 'Giá sản phẩm đang bị ẩn trên toàn bộ trang web. Bộ lọc giá cũng sẽ bị ẩn.'
              }
            </p>
          </div>
          <Switch
            id="price-visibility"
            checked={showPrices}
            onCheckedChange={handleTogglePriceVisibility}
            disabled={updatePriceVisibility.isPending}
          />
        </div>

        {/* Status Indicator */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-2 w-2 rounded-full ${showPrices ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="font-medium">
              Trạng thái hiện tại: {showPrices ? 'Hiển thị giá' : 'Ẩn giá'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {showPrices 
              ? 'Khách hàng có thể xem giá sản phẩm và lọc theo khoảng giá'
              : 'Khách hàng không thể xem giá sản phẩm và bộ lọc giá bị ẩn'
            }
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleTogglePriceVisibility}
            disabled={updatePriceVisibility.isPending}
            variant={showPrices ? 'outline' : 'default'}
            className="w-full"
          >
            {updatePriceVisibility.isPending ? (
              'Đang cập nhật...'
            ) : showPrices ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Ẩn giá sản phẩm
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Hiển thị giá sản phẩm
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
