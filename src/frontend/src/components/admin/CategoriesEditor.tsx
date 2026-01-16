import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useGetCategories, useAddCategory, useUpdateCategory, useDeleteCategory, useGetProducts } from '../../hooks/useQueries';
import { Plus, Edit, Trash2, Save, X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '../../backend';

export default function CategoriesEditor() {
  const { data: categories, isLoading } = useGetCategories();
  const { data: productsData } = useGetProducts();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<Category>({
    id: '',
    name: '',
    description: '',
  });

  const products = productsData?.map(([_, product]) => product) || [];

  // Count products in each category
  const getCategoryProductCount = (categoryId: string): number => {
    return products.filter(product => 
      product.categories.includes(categoryId)
    ).length;
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData(category);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingCategory(null);
    setFormData({
      id: '',
      name: '',
      description: '',
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingCategory(null);
    setFormData({
      id: '',
      name: '',
      description: '',
    });
  };

  const generateId = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả danh mục');
      return;
    }

    try {
      const categoryData = {
        ...formData,
        id: isAdding ? generateId(formData.name) : formData.id,
      };

      if (isAdding) {
        await addCategory.mutateAsync(categoryData);
        toast.success('Đã thêm danh mục thành công');
      } else if (editingCategory) {
        await updateCategory.mutateAsync(categoryData);
        toast.success('Đã cập nhật danh mục thành công');
      }
      handleCancel();
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Unauthorized')) {
        toast.error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
      } else if (errorMessage.includes('already exists')) {
        toast.error('Danh mục này đã tồn tại');
      } else {
        toast.error('Có lỗi xảy ra: ' + errorMessage);
      }
      console.error('Category save error:', error);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const productCount = getCategoryProductCount(categoryId);
    if (productCount > 0) {
      toast.error(`Không thể xóa danh mục này vì có ${productCount} sản phẩm đang sử dụng`);
      setDeleteConfirm(null);
      return;
    }

    try {
      await deleteCategory.mutateAsync(categoryId);
      toast.success('Đã xóa danh mục thành công');
      setDeleteConfirm(null);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Unauthorized')) {
        toast.error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
      } else {
        toast.error('Có lỗi xảy ra: ' + errorMessage);
      }
      console.error('Category delete error:', error);
    }
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
              <CardTitle>Quản lý Danh mục</CardTitle>
              <CardDescription>
                Thêm, sửa, xóa các danh mục sản phẩm. Danh mục được sử dụng để phân loại và lọc sản phẩm.
              </CardDescription>
            </div>
            <Button onClick={handleAdd} disabled={isAdding || editingCategory !== null}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm danh mục
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(isAdding || editingCategory) && (
            <Card className="mb-6 border-primary">
              <CardHeader>
                <CardTitle className="text-lg">
                  {isAdding ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên danh mục *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Vang Đỏ"
                  />
                  {isAdding && formData.name && (
                    <p className="text-xs text-foreground/60">
                      ID sẽ được tạo tự động: {generateId(formData.name)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả chi tiết về danh mục..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={addCategory.isPending || updateCategory.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {addCategory.isPending || updateCategory.isPending ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={addCategory.isPending || updateCategory.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {!categories || categories.length === 0 ? (
              <p className="text-center text-foreground/60 py-8">
                Chưa có danh mục nào. Nhấn "Thêm danh mục" để bắt đầu.
              </p>
            ) : (
              categories.map((category) => {
                const productCount = getCategoryProductCount(category.id);
                return (
                  <Card key={category.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Tag className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                          <p className="text-foreground/70 text-sm mt-1">{category.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-foreground/60">ID: {category.id}</p>
                            <p className="text-xs text-foreground/60">
                              {productCount} sản phẩm
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            disabled={isAdding || editingCategory !== null || deleteCategory.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm(category.id)}
                            disabled={isAdding || editingCategory !== null || deleteCategory.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && getCategoryProductCount(deleteConfirm) > 0 ? (
                <>
                  Danh mục này đang được sử dụng bởi {getCategoryProductCount(deleteConfirm)} sản phẩm. 
                  Vui lòng xóa hoặc chuyển các sản phẩm sang danh mục khác trước khi xóa danh mục này.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>Hủy</AlertDialogCancel>
            {deleteConfirm && getCategoryProductCount(deleteConfirm) === 0 && (
              <AlertDialogAction
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteCategory.isPending}
              >
                {deleteCategory.isPending ? 'Đang xóa...' : 'Xóa'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
