import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useGetProducts, useAddProduct, useUpdateProduct, useDeleteProduct, useGetCategories } from '../../hooks/useQueries';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../../backend';

export default function ProductsEditor() {
  const { data: productsData, isLoading } = useGetProducts();
  const { data: categories } = useGetCategories();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    imageUrl: '',
    price: 0n,
    categories: [],
  });

  const products = productsData?.map(([_, product]) => product) || [];

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      price: 0n,
      categories: [],
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      price: 0n,
      categories: [],
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả sản phẩm');
      return;
    }

    try {
      if (isAdding) {
        await addProduct.mutateAsync(formData);
        toast.success('Đã thêm sản phẩm thành công');
      } else if (editingProduct) {
        await updateProduct.mutateAsync(formData);
        toast.success('Đã cập nhật sản phẩm thành công');
      }
      handleCancel();
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Unauthorized')) {
        toast.error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
      } else {
        toast.error('Có lỗi xảy ra: ' + errorMessage);
      }
      console.error('Product save error:', error);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteProduct.mutateAsync(name);
      toast.success('Đã xóa sản phẩm thành công');
      setDeleteConfirm(null);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Unauthorized')) {
        toast.error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
      } else {
        toast.error('Có lỗi xảy ra: ' + errorMessage);
      }
      console.error('Product delete error:', error);
    }
  };

  const getImagePreviewUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('/')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `/assets/generated/${url}`;
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories?.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-foreground/60">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý Sản phẩm</CardTitle>
              <CardDescription>
                Thêm, sửa, xóa các sản phẩm rượu vang. Sản phẩm sẽ hiển thị ngay trên trang chủ sau khi lưu.
              </CardDescription>
            </div>
            <Button onClick={handleAdd} disabled={isAdding || editingProduct !== null}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(isAdding || editingProduct) && (
            <Card className="mb-6 border-primary">
              <CardHeader>
                <CardTitle className="text-lg">
                  {isAdding ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên sản phẩm *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ví dụ: Rượu Vang Hảo Hạng"
                      disabled={!isAdding}
                    />
                    {!isAdding && (
                      <p className="text-xs text-foreground/60">
                        Tên sản phẩm không thể thay đổi sau khi tạo
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Giá (VNĐ) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price.toString()}
                      onChange={(e) => setFormData({ ...formData, price: BigInt(e.target.value || 0) })}
                      placeholder="450000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL hình ảnh</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="wine-bottles-premium.dim_800x600.jpg"
                  />
                  <p className="text-xs text-foreground/60">
                    Nhập tên file từ assets (ví dụ: wine-bottles-premium.dim_800x600.jpg) hoặc URL đầy đủ
                  </p>
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={getImagePreviewUrl(formData.imageUrl)}
                        alt="Preview"
                        className="h-32 w-auto rounded border object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  {!categories || categories.length === 0 ? (
                    <p className="text-sm text-foreground/60">
                      Chưa có danh mục nào. Vui lòng tạo danh mục trước.
                    </p>
                  ) : (
                    <div className="space-y-2 border rounded-md p-4">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={formData.categories.includes(category.id)}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={addProduct.isPending || updateProduct.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {addProduct.isPending || updateProduct.isPending ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={addProduct.isPending || updateProduct.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {products.length === 0 ? (
              <p className="text-center text-foreground/60 py-8">
                Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.
              </p>
            ) : (
              products.map((product) => (
                <Card key={product.name}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {product.imageUrl && (
                        <img
                          src={getImagePreviewUrl(product.imageUrl)}
                          alt={product.name}
                          className="h-24 w-24 rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-foreground/70 text-sm mt-1 line-clamp-2">{product.description}</p>
                        <p className="text-primary font-medium mt-2">
                          {Number(product.price).toLocaleString('vi-VN')} VNĐ
                        </p>
                        {product.categories && product.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {product.categories.map((catId) => (
                              <Badge key={catId} variant="secondary" className="text-xs">
                                {getCategoryName(catId)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          disabled={isAdding || editingProduct !== null || deleteProduct.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(product.name)}
                          disabled={isAdding || editingProduct !== null || deleteProduct.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm "{deleteConfirm}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
