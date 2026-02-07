import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAboutSection, useUpdateAboutSection } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Plus, Trash2, LayoutGrid, LayoutList, ImageIcon } from 'lucide-react';
import type { AboutSection, AboutMediaSection } from '@/backend';

export default function AboutEditor() {
  const { data: aboutSection, isLoading } = useGetAboutSection();
  const updateAboutMutation = useUpdateAboutSection();

  const [formData, setFormData] = useState<AboutSection>({
    introductoryHeading: '',
    mainDescription: '',
    mediaSections: [],
    processSteps: [],
    teamMembers: [],
  });

  // Layout options with descriptions
  const layoutOptions = [
    { 
      value: "1", 
      label: 'Văn bản trên - Ảnh dưới', 
      icon: <LayoutList className="h-4 w-4" />,
      description: 'Tiêu đề và mô tả ở trên, hình ảnh ở dưới'
    },
    { 
      value: "2", 
      label: 'Ảnh trái - Văn bản phải', 
      icon: <ImageIcon className="h-4 w-4" />,
      description: 'Hình ảnh bên trái, nội dung văn bản bên phải'
    },
    { 
      value: "3", 
      label: 'Văn bản trái - Ảnh phải', 
      icon: <ImageIcon className="h-4 w-4 rotate-180" />,
      description: 'Nội dung văn bản bên trái, hình ảnh bên phải'
    },
    { 
      value: "4", 
      label: 'Toàn màn hình với overlay', 
      icon: <LayoutGrid className="h-4 w-4" />,
      description: 'Ảnh nền toàn màn hình với văn bản overlay căn trái'
    },
    { 
      value: "5", 
      label: 'Toàn màn hình căn giữa', 
      icon: <LayoutGrid className="h-4 w-4" />,
      description: 'Ảnh nền toàn màn hình với văn bản overlay căn giữa dưới cùng'
    },
  ];

  // Update form when data is loaded
  useEffect(() => {
    if (aboutSection) {
      setFormData(aboutSection);
    }
  }, [aboutSection]);

  const handleSave = async () => {
    try {
      await updateAboutMutation.mutateAsync(formData);
      toast.success('Đã lưu thành công!', {
        description: 'Nội dung trang Giới thiệu đã được cập nhật.',
      });
    } catch (error) {
      toast.error('Lỗi khi lưu', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    }
  };

  const addMediaSection = () => {
    setFormData({
      ...formData,
      mediaSections: [
        ...formData.mediaSections,
        { 
          title: '', 
          description: '', 
          mediaUrl: '',
          mediaType: "1" // Default to layout type 1
        },
      ],
    });
  };

  const updateMediaSection = (index: number, field: keyof AboutMediaSection, value: string | number) => {
    const updated = [...formData.mediaSections];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, mediaSections: updated });
  };

  const removeMediaSection = (index: number) => {
    setFormData({
      ...formData,
      mediaSections: formData.mediaSections.filter((_, i) => i !== index),
    });
  };

  // Move section up/down in order
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...formData.mediaSections];
    if (direction === 'up' && index > 0) {
      [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
    } else if (direction === 'down' && index < sections.length - 1) {
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
    }
    setFormData({ ...formData, mediaSections: sections });
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
    return previews[type as keyof typeof previews] || previews[1];
  };

  if (isLoading) {
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
      <Tabs defaultValue="intro" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="intro">Nội dung chính</TabsTrigger>
          <TabsTrigger value="media">Phần media</TabsTrigger>
        </TabsList>

        <TabsContent value="intro" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nội dung giới thiệu (Torch Bearer Tasmania)</CardTitle>
                <CardDescription>
                  Chỉnh sửa tiêu đề và mô tả chính của trang Giới thiệu (hỗ trợ song ngữ Việt-Anh)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="intro-heading">Tiêu đề giới thiệu</Label>
                  <Input
                    id="intro-heading"
                    placeholder="Doanh nghiệp Người Cầm Đuốc"
                    value={formData.introductoryHeading}
                    onChange={(e) =>
                      setFormData({ ...formData, introductoryHeading: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="main-description">Mô tả chính (Việt & English)</Label>
                  <Textarea
                    id="main-description"
                    placeholder="Với trang trại rượu được thành lập từ năm 1994..."
                    rows={10}
                    value={formData.mainDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, mainDescription: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Hỗ trợ nội dung song ngữ Việt-Anh. Nội dung bilingual sẽ hiển thị trong các phần riêng biệt trên trang About.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xem trước</CardTitle>
                <CardDescription>Nội dung sẽ hiển thị như thế này</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
                  <h2 className="text-2xl font-bold text-foreground">
                    {formData.introductoryHeading || 'Tiêu đề giới thiệu'}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {formData.mainDescription || 'Mô tả chính về công ty'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Các phần media</CardTitle>
                  <CardDescription>
                    Quản lý các phần nội dung với hình ảnh/video và bố cục động
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formData.mediaSections.length} phần media
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.mediaSections.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Chưa có phần media nào</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Thêm phần media đầu tiên để bắt đầu
                  </p>
                  <Button onClick={addMediaSection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm phần media đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.mediaSections.map((section, index) => (
                    <div key={index} className="p-6 border rounded-lg space-y-6 bg-card">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                                #{index + 1}
                              </span>
                              <h4 className="font-semibold">
                                {section.title || `Phần media ${index + 1}`}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                {layoutOptions.find(l => l.value === section.mediaType)?.icon}
                                <span className="ml-1">
                                  {layoutOptions.find(l => l.value === section.mediaType)?.label}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(index, 'up')}
                              disabled={index === 0}
                              title="Di chuyển lên"
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(index, 'down')}
                              disabled={index === formData.mediaSections.length - 1}
                              title="Di chuyển xuống"
                            >
                              ↓
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMediaSection(index)}
                            className="text-destructive hover:text-destructive"
                            title="Xóa phần này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`title-${index}`}>Tiêu đề *</Label>
                            <Input
                              id={`title-${index}`}
                              placeholder="Ví dụ: Vườn nho của chúng tôi ở Tasmania"
                              value={section.title}
                              onChange={(e) =>
                                updateMediaSection(index, 'title', e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`description-${index}`}>Mô tả *</Label>
                            <Textarea
                              id={`description-${index}`}
                              placeholder="Mô tả chi tiết về phần này..."
                              rows={4}
                              value={section.description}
                              onChange={(e) =>
                                updateMediaSection(index, 'description', e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`mediaUrl-${index}`}>URL media *</Label>
                            <Input
                              id={`mediaUrl-${index}`}
                              placeholder="wine-cellar.jpg hoặc https://..."
                              value={section.mediaUrl}
                              onChange={(e) =>
                                updateMediaSection(index, 'mediaUrl', e.target.value)
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Có thể sử dụng đường dẫn tương đối (wine.jpg) hoặc URL đầy đủ
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Bố cục hiển thị</Label>
                            <Select
                              value={section.mediaType || "1"}
                              onValueChange={(value) =>
                                updateMediaSection(index, 'mediaType', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn bố cục" />
                              </SelectTrigger>
                              <SelectContent>
                                {layoutOptions.map((layout) => (
                                  <SelectItem key={layout.value} value={layout.value.toString()}>
                                    <div className="flex items-center">
                                      <span className="mr-2">{layout.icon}</span>
                                      {layout.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {section.mediaType && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {layoutOptions.find(l => l.value === section.mediaType)?.description}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Xem trước bố cục</Label>
                            <div className="p-4 bg-muted/30 rounded-lg">
                              {renderLayoutPreview(section.mediaType || 1)}
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
                                    e.currentTarget.src = '/assets/wine.jpg';
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
                                  <p className="text-sm text-muted-foreground">Chưa có hình ảnh</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-xs text-muted-foreground">
                          <strong>Mẹo:</strong> Các bố cục 4 và 5 sẽ hiển thị toàn màn hình trên mobile.
                          Bố cục 2 và 3 sẽ chuyển thành ngăn xếp trên mobile.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button onClick={addMediaSection} variant="outline" className="w-full max-w-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm phần media mới
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Section */}
          {formData.mediaSections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Xem trước trực tiếp</CardTitle>
                <CardDescription>
                  Các phần media sẽ hiển thị như thế này trên trang web
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {layoutOptions.map((layout) => (
                      <div key={layout.value} className="text-center">
                        <div className="mb-2 p-4 border rounded-lg">
                          {renderLayoutPreview(layout.value)}
                        </div>
                        <div className="text-sm font-medium">{layout.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {formData.mediaSections.filter(s => s.mediaType === layout.value).length} phần
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {formData.mediaSections.map((section, index) => {
                      const isFullWidth = section.mediaType === "4" || section.mediaType === "5";
                      return (
                        <div 
                          key={index} 
                          className={`p-6 bg-muted/10 rounded-lg border ${isFullWidth ? '' : 'max-w-4xl'}`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="font-mono text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                                #{index + 1}
                              </div>
                              <div>
                                <div className="font-semibold">{section.title || `Phần ${index + 1}`}</div>
                                <div className="text-xs text-muted-foreground flex items-center">
                                  <span className="mr-2">
                                    {layoutOptions.find(l => l.value === section.mediaType)?.icon}
                                  </span>
                                  {layoutOptions.find(l => l.value === section.mediaType)?.label}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {isFullWidth ? 'Toàn màn hình' : 'Cột đôi'}
                            </div>
                          </div>
                          
                          {section.mediaUrl ? (
                            <div className="relative rounded overflow-hidden mb-4">
                              <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                                <div className="text-center">
                                  <ImageIcon className="h-12 w-12 text-primary/50 mb-2 mx-auto" />
                                  <div className="text-sm text-primary/70">Hình ảnh: {section.mediaUrl}</div>
                                </div>
                              </div>
                              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {layoutOptions.find(l => l.value === section.mediaType)?.label}
                              </div>
                            </div>
                          ) : (
                            <div className="h-48 bg-muted/30 rounded flex items-center justify-center mb-4">
                              <div className="text-center text-muted-foreground">
                                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                Chưa có hình ảnh
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted/50 rounded w-full"></div>
                            <div className="h-3 bg-muted/50 rounded w-2/3"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="font-semibold">Tổng quan thay đổi</div>
              <div className="text-sm text-muted-foreground">
                • {formData.mediaSections.length} phần media • {formData.introductoryHeading ? 'Có' : 'Chưa có'} tiêu đề • {formData.mainDescription ? 'Có' : 'Chưa có'} mô tả
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={updateAboutMutation.isPending}
              className="w-full sm:w-auto"
              size="lg"
            >
              {updateAboutMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang lưu...
                </>
              ) : (
                'Lưu tất cả thay đổi'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}