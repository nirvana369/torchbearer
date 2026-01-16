import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetAboutSection, useUpdateAboutSection } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
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
        { title: '', description: '', mediaUrl: '' },
      ],
    });
  };

  const updateMediaSection = (index: number, field: keyof AboutMediaSection, value: string) => {
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
              <CardTitle>Các phần media</CardTitle>
              <CardDescription>
                Quản lý các phần nội dung với hình ảnh/video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.mediaSections.map((section, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Phần media {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMediaSection(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Tiêu đề</Label>
                      <Input
                        placeholder="Tiêu đề phần này..."
                        value={section.title}
                        onChange={(e) =>
                          updateMediaSection(index, 'title', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mô tả</Label>
                      <Textarea
                        placeholder="Mô tả ngắn..."
                        rows={3}
                        value={section.description}
                        onChange={(e) =>
                          updateMediaSection(index, 'description', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL media</Label>
                      <Input
                        placeholder="wine-cellar.dim_1024x768.jpg hoặc https://..."
                        value={section.mediaUrl}
                        onChange={(e) =>
                          updateMediaSection(index, 'mediaUrl', e.target.value)
                        }
                      />
                      {section.mediaUrl && (
                        <div className="relative h-32 rounded overflow-hidden mt-2">
                          <img
                            src={
                              section.mediaUrl.startsWith('http')
                                ? section.mediaUrl
                                : `/assets/${section.mediaUrl}`
                            }
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                '/assets/wine.jpg';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button onClick={addMediaSection} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Thêm phần media
              </Button>
            </CardContent>
          </Card>

          {formData.mediaSections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Xem trước các phần media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {formData.mediaSections.map((section, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-2">
                      {section.mediaUrl && (
                        <div className="relative h-32 rounded overflow-hidden">
                          <img
                            src={
                              section.mediaUrl.startsWith('http')
                                ? section.mediaUrl
                                : `/assets/${section.mediaUrl}`
                            }
                            alt={section.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                '/assets/wine.jpg';
                            }}
                          />
                        </div>
                      )}
                      <h4 className="font-semibold text-sm">
                        {section.title || `Phần ${index + 1}`}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {section.description || 'Chưa có mô tả'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleSave}
            disabled={updateAboutMutation.isPending}
            className="w-full"
            size="lg"
          >
            {updateAboutMutation.isPending ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
