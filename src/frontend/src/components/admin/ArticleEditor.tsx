import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useGetArticles,
  useGetTotalArticleCount,
  useAddArticle,
  useUpdateArticle,
  useDeleteArticle,
} from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, ImageIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Article, ArticleContent } from 'declarations/backend/backend.did';

interface ArticleFormState {
  title: string;
  content: ArticleContent[];
}

const ITEMS_PER_PAGE = 10;

const layoutOptions = [
  { 
    value: "1", 
    label: 'Văn bản trên - Ảnh dưới', 
    description: 'Tiêu đề và mô tả ở trên, hình ảnh ở dưới'
  },
  { 
    value: "2", 
    label: 'Ảnh trái - Văn bản phải', 
    description: 'Hình ảnh bên trái, nội dung văn bản bên phải'
  },
  { 
    value: "3", 
    label: 'Văn bản trái - Ảnh phải', 
    description: 'Nội dung văn bản bên trái, hình ảnh bên phải'
  },
  { 
    value: "4", 
    label: 'Toàn màn hình với overlay', 
    description: 'Ảnh nền toàn màn hình với văn bản overlay căn trái'
  },
  { 
    value: "5", 
    label: 'Toàn màn hình căn giữa', 
    description: 'Ảnh nền toàn màn hình với văn bản overlay căn giữa dưới cùng'
  },
];

export default function ArticleEditor() {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingArticleId, setEditingArticleId] = useState<bigint | null>(null);
  const [formData, setFormData] = useState<ArticleFormState>({
    title: '',
    content: [],
  });

  const { data: articles, isLoading: articlesLoading } = useGetArticles(currentPage - 1);
  const { data: totalCount, isLoading: countLoading } = useGetTotalArticleCount();
  const addArticleMutation = useAddArticle();
  const updateArticleMutation = useUpdateArticle();
  const deleteArticleMutation = useDeleteArticle();

  const totalPages = totalCount ? Math.ceil(Number(totalCount) / ITEMS_PER_PAGE) : 0;

  const resetForm = () => {
    setFormData({ title: '', content: [] });
    setEditingArticleId(null);
  };

  const handleAddContent = () => {
    setFormData({
      ...formData,
      content: [
        ...formData.content,
        { 
          title: '', 
          description: '', 
          mediaUrl: '',
          mediaType: "1"
        },
      ],
    });
  };

  const updateContent = (index: number, field: keyof ArticleContent, value: string) => {
    const updated = [...formData.content];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, content: updated });
  };

  const removeContent = (index: number) => {
    setFormData({
      ...formData,
      content: formData.content.filter((_, i) => i !== index),
    });
  };

  const moveContent = (index: number, direction: 'up' | 'down') => {
    const contents = [...formData.content];
    if (direction === 'up' && index > 0) {
      [contents[index], contents[index - 1]] = [contents[index - 1], contents[index]];
    } else if (direction === 'down' && index < contents.length - 1) {
      [contents[index], contents[index + 1]] = [contents[index + 1], contents[index]];
    }
    setFormData({ ...formData, content: contents });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Lỗi', { description: 'Vui lòng nhập tiêu đề bài viết.' });
      return;
    }

    if (formData.content.length === 0) {
      toast.error('Lỗi', { description: 'Vui lòng thêm ít nhất một phần nội dung.' });
      return;
    }

    try {
      if (editingArticleId) {
        await updateArticleMutation.mutateAsync({
          id: editingArticleId,
          title: formData.title,
          content: formData.content,
        });
        toast.success('Cập nhật thành công!', {
          description: 'Bài viết đã được cập nhật.',
        });
      } else {
        await addArticleMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
        });
        toast.success('Thêm thành công!', {
          description: 'Bài viết mới đã được tạo.',
        });
      }
      resetForm();
      setCurrentPage(1);
    } catch (error) {
      toast.error('Lỗi khi lưu', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticleId(article.id);
    setFormData({
      title: article.title,
      content: article.content,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

    try {
      await deleteArticleMutation.mutateAsync(id);
      toast.success('Xóa thành công!', {
        description: 'Bài viết đã được xóa.',
      });
    } catch (error) {
      toast.error('Lỗi khi xóa', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    }
  };

  const renderLayoutPreview = (type: string) => {
    const previews = {
      "1": (
        <div className="space-y-3 border p-4 rounded-lg bg-white">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-100 rounded w-full"></div>
          <div className="h-3 bg-gray-100 rounded w-full"></div>
          <div className="h-32 bg-gray-300 rounded mt-3"></div>
        </div>
      ),
      "2": (
        <div className="flex space-x-3 border p-4 rounded-lg bg-white">
          <div className="w-1/2 h-32 bg-gray-300 rounded"></div>
          <div className="w-1/2 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-full"></div>
          </div>
        </div>
      ),
      "3": (
        <div className="flex space-x-3 border p-4 rounded-lg bg-white">
          <div className="w-1/2 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-full"></div>
          </div>
          <div className="w-1/2 h-32 bg-gray-300 rounded"></div>
        </div>
      ),
      "4": (
        <div className="relative border p-4 rounded-lg bg-white h-40">
          <div className="absolute inset-0 bg-gray-300 rounded"></div>
          <div className="absolute left-4 bottom-4 w-2/3 space-y-2">
            <div className="h-5 bg-white rounded w-3/4"></div>
            <div className="h-3 bg-white/80 rounded w-full"></div>
          </div>
        </div>
      ),
      "5": (
        <div className="relative border p-4 rounded-lg bg-white h-40">
          <div className="absolute inset-0 bg-gray-300 rounded"></div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 space-y-2 text-center">
            <div className="h-5 bg-white rounded w-3/4 mx-auto"></div>
            <div className="h-3 bg-white/80 rounded w-full"></div>
          </div>
        </div>
      ),
    };
    return previews[type as keyof typeof previews] || previews["1"];
  };

  if (articlesLoading || countLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">
            {editingArticleId ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
          </TabsTrigger>
          <TabsTrigger value="list">
            Danh sách bài viết ({String(totalCount || 0)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {editingArticleId ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                  </CardTitle>
                  <CardDescription>
                    {editingArticleId
                      ? 'Cập nhật thông tin bài viết'
                      : 'Thêm bài viết mới với nhiều phần nội dung'}
                  </CardDescription>
                </div>
                {editingArticleId && (
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Hủy chỉnh sửa
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title Section */}
              <div className="space-y-2">
                <Label htmlFor="article-title">Tiêu đề bài viết *</Label>
                <Input
                  id="article-title"
                  placeholder="Ví dụ: Hành trình sản xuất rượu vang tại Tasmania"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="text-lg"
                />
              </div>

              {/* Content Sections */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Phần nội dung bài viết</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.content.length} phần
                  </span>
                </div>

                {formData.content.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-semibold text-lg mb-2">
                      Chưa có phần nội dung nào
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Thêm phần nội dung đầu tiên để bắt đầu
                    </p>
                    <Button onClick={handleAddContent}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm phần nội dung
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formData.content.map((section, index) => (
                      <div key={index} className="p-6 border rounded-lg space-y-4 bg-card">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <h4 className="font-semibold">
                              {section.title || `Phần ${index + 1}`}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveContent(index, 'up')}
                                disabled={index === 0}
                                title="Di chuyển lên"
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveContent(index, 'down')}
                                disabled={index === formData.content.length - 1}
                                title="Di chuyển xuống"
                              >
                                ↓
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContent(index)}
                              className="text-destructive hover:text-destructive"
                              title="Xóa phần này"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                          {/* Left Column */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`content-title-${index}`}>
                                Tiêu đề phần *
                              </Label>
                              <Input
                                id={`content-title-${index}`}
                                placeholder="Ví dụ: Vườn nho của chúng tôi"
                                value={section.title}
                                onChange={(e) =>
                                  updateContent(index, 'title', e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`content-description-${index}`}>
                                Mô tả chi tiết *
                              </Label>
                              <Textarea
                                id={`content-description-${index}`}
                                placeholder="Nội dung chi tiết về phần này..."
                                rows={5}
                                value={section.description}
                                onChange={(e) =>
                                  updateContent(index, 'description', e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`content-url-${index}`}>
                                URL hình ảnh/video *
                              </Label>
                              <Input
                                id={`content-url-${index}`}
                                placeholder="wine-cellar.jpg hoặc https://..."
                                value={section.mediaUrl}
                                onChange={(e) =>
                                  updateContent(index, 'mediaUrl', e.target.value)
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Có thể sử dụng đường dẫn tương đối hoặc URL đầy đủ
                              </p>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Bố cục hiển thị</Label>
                              <Select
                                value={section.mediaType || "1"}
                                onValueChange={(value) =>
                                  updateContent(index, 'mediaType', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn bố cục" />
                                </SelectTrigger>
                                <SelectContent>
                                  {layoutOptions.map((layout) => (
                                    <SelectItem
                                      key={layout.value}
                                      value={layout.value}
                                    >
                                      {layout.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {section.mediaType && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {
                                    layoutOptions.find(
                                      (l) => l.value === section.mediaType
                                    )?.description
                                  }
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>Xem trước bố cục</Label>
                              <div className="p-4 bg-muted/30 rounded-lg">
                                {renderLayoutPreview(section.mediaType || "1")}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Xem trước hình ảnh</Label>
                              {section.mediaUrl ? (
                                <div className="relative h-48 rounded-lg overflow-hidden border">
                                  <img
                                    src={
                                      section.mediaUrl.startsWith('http')
                                        ? section.mediaUrl
                                        : `/assets/${section.mediaUrl}`
                                    }
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = '/assets/image.png';
                                    }}
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                                    {section.mediaUrl}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                                  <div className="text-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                      Chưa có hình ảnh
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleAddContent}
                    variant="outline"
                    className="w-full max-w-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm phần nội dung mới
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="font-semibold">Tổng quan</div>
                  <div className="text-sm text-muted-foreground">
                    • Tiêu đề: {formData.title ? '✓' : '✗'} • {formData.content.length}{' '}
                    phần nội dung
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {editingArticleId && (
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="flex-1 sm:flex-none"
                    >
                      Hủy
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={
                      addArticleMutation.isPending ||
                      updateArticleMutation.isPending
                    }
                    className="flex-1 sm:flex-none"
                    size="lg"
                  >
                    {addArticleMutation.isPending ||
                    updateArticleMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Đang lưu...
                      </>
                    ) : editingArticleId ? (
                      'Cập nhật bài viết'
                    ) : (
                      'Tạo bài viết mới'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Danh sách bài viết</CardTitle>
                  <CardDescription>
                    Quản lý các bài viết trên trang web
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    resetForm();
                    document.querySelector('[value="editor"]')?.dispatchEvent(new Event('click', { bubbles: true }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Bài viết mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!articles || articles.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">
                    Chưa có bài viết nào
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tạo bài viết đầu tiên để bắt đầu
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <div
                      key={Number(article.id)}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-lg">
                            {article.title}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>
                              📝 {article.content.length} phần nội dung
                            </span>
                            <span>
                              📅{' '}
                              {new Date(
                                Number(article.publishTime) / 1000000
                              ).toLocaleDateString('vi-VN')}
                            </span>
                            <span>
                              🔄{' '}
                              {new Date(
                                Number(article.updateTime) / 1000000
                              ).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.content[0]?.description ||
                              'Không có mô tả'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(article)}
                            className="flex items-center gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(article.id)}
                            className="text-destructive hover:text-destructive flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
