import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetHeroSection, useUpdateHeroSection } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import type { ContentSection } from '@/backend';

export default function HeroEditor() {
  const { data: heroSection, isLoading } = useGetHeroSection();
  const updateHeroMutation = useUpdateHeroSection();

  const [formData, setFormData] = useState<ContentSection>({
    title: '',
    content: '',
    mediaUrl: '',
  });

  // Multi-image state (frontend-only until backend is updated)
  const [heroImages, setHeroImages] = useState<string[]>([
    'hero-vineyard.dim_1920x1080.jpg',
    'wine.jpg',
    'wine-cellar.dim_1024x768.jpg',
  ]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [slideshowTiming, setSlideshowTiming] = useState<number>(5000);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Update form when data is loaded
  useEffect(() => {
    if (heroSection) {
      setFormData(heroSection);
      // If backend has a single image, use it as the first image
      if (heroSection.mediaUrl) {
        setHeroImages([heroSection.mediaUrl]);
      }
    }
  }, [heroSection]);

  // Auto-advance preview slideshow
  useEffect(() => {
    if (heroImages.length <= 1 || videoUrl) return;

    const interval = setInterval(() => {
      setCurrentPreviewIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000); // Faster preview

    return () => clearInterval(interval);
  }, [heroImages.length, videoUrl]);

  const handleSave = async () => {
    try {
      // For now, save the first image to the backend
      // When backend is updated, this will save all images
      const dataToSave = {
        ...formData,
        mediaUrl: heroImages[0] || formData.mediaUrl,
      };
      
      await updateHeroMutation.mutateAsync(dataToSave);
      toast.success('Đã lưu thành công!', {
        description: 'Nội dung Hero section đã được cập nhật.',
      });
    } catch (error) {
      toast.error('Lỗi khi lưu', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    }
  };

  const addImage = () => {
    if (heroImages.length < 3) {
      setHeroImages([...heroImages, '']);
    } else {
      toast.error('Giới hạn', {
        description: 'Chỉ có thể thêm tối đa 3 hình ảnh.',
      });
    }
  };

  const removeImage = (index: number) => {
    if (heroImages.length > 1) {
      setHeroImages(heroImages.filter((_, i) => i !== index));
    } else {
      toast.error('Lỗi', {
        description: 'Phải có ít nhất 1 hình ảnh.',
      });
    }
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...heroImages];
    newImages[index] = value;
    setHeroImages(newImages);
  };

  const moveImageUp = (index: number) => {
    if (index > 0) {
      const newImages = [...heroImages];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      setHeroImages(newImages);
    }
  };

  const moveImageDown = (index: number) => {
    if (index < heroImages.length - 1) {
      const newImages = [...heroImages];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      setHeroImages(newImages);
    }
  };

  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPreviewImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/assets/hero-vineyard.dim_1920x1080.jpg';
    return imageUrl.startsWith('http')
      ? imageUrl
      : `/assets/${imageUrl}`;
  };

  const currentPreviewImage = videoUrl 
    ? videoUrl 
    : getPreviewImageUrl(heroImages[currentPreviewIndex] || heroImages[0]);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa Hero Section</CardTitle>
            <CardDescription>
              Cập nhật nội dung và hình ảnh slideshow cho phần hero (Torch Bearer Tasmania)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero-title">Tiêu đề chính</Label>
              <Input
                id="hero-title"
                placeholder="Vì cuộc sống là những trải nghiệm phi thường"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-content">Taglines / Nội dung phụ</Label>
              <Textarea
                id="hero-content"
                placeholder="#xlife #torchbearer #Tmoment #người cầm đuốc"
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Video URL (Ưu tiên hơn hình ảnh)</Label>
              <Input
                placeholder="https://... (để trống nếu dùng slideshow hình ảnh)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nếu có video, slideshow hình ảnh sẽ không hiển thị
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={updateHeroMutation.isPending}
              className="w-full"
            >
              {updateHeroMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Xem trước</CardTitle>
            <CardDescription>
              {videoUrl ? 'Video sẽ hiển thị' : `Slideshow ${heroImages.length} hình ảnh`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 rounded-lg overflow-hidden">
              {videoUrl ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Video: {videoUrl}</p>
                </div>
              ) : (
                <>
                  {heroImages.map((image, index) => (
                    <img
                      key={index}
                      src={getPreviewImageUrl(image)}
                      alt={`Preview ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                        index === currentPreviewIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/hero-vineyard.dim_1920x1080.jpg';
                      }}
                    />
                  ))}
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-background/50 flex items-center justify-center">
                <div className="text-center space-y-2 px-4">
                  <h3 className="text-2xl font-bold text-foreground">
                    {formData.title || 'Tiêu đề'}
                  </h3>
                  <p className="text-sm text-accent font-semibold">
                    {formData.content || 'Taglines'}
                  </p>
                </div>
              </div>
              {!videoUrl && heroImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {heroImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentPreviewIndex 
                          ? 'bg-primary w-8' 
                          : 'bg-primary/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hình ảnh Slideshow (Tối đa 3)</CardTitle>
              <CardDescription>
                Quản lý các hình ảnh cho slideshow hero section
              </CardDescription>
            </div>
            <Button
              onClick={addImage}
              disabled={heroImages.length >= 3}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm hình
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Thời gian chuyển ảnh (giây)</Label>
            <Input
              type="number"
              min="2"
              max="10"
              value={slideshowTiming / 1000}
              onChange={(e) => setSlideshowTiming(Number(e.target.value) * 1000)}
            />
            <p className="text-xs text-muted-foreground">
              Thời gian hiển thị mỗi hình ảnh trước khi chuyển sang hình tiếp theo
            </p>
          </div>

          {heroImages.map((image, index) => (
            <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Label>Hình ảnh {index + 1}</Label>
                <Input
                  placeholder="hero-vineyard.dim_1920x1080.jpg hoặc https://..."
                  value={image}
                  onChange={(e) => updateImage(index, e.target.value)}
                />
                {image && (
                  <img
                    src={getPreviewImageUrl(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/hero-vineyard.dim_1920x1080.jpg';
                    }}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => moveImageUp(index)}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => moveImageDown(index)}
                  disabled={index === heroImages.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeImage(index)}
                  disabled={heroImages.length === 1}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
