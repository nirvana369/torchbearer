import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetMediaItems, useAddMediaItem, useUpdateMediaItem, useDeleteMediaItem } from '../../hooks/useQueries';
import { Plus, Trash2, Save, Image, Video, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MediaItem } from '../../backend';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function MediaEditor() {
  const { data: mediaItems, isLoading } = useGetMediaItems(0);
  const addMediaItem = useAddMediaItem();
  const updateMediaItem = useUpdateMediaItem();
  const deleteMediaItem = useDeleteMediaItem();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const [newMedia, setNewMedia] = useState({
    url: '',
    caption: '',
    description: '',
    mediaType: 'image',
  });

  const [editMedia, setEditMedia] = useState({
    url: '',
    caption: '',
    description: '',
  });

  const handleAddMedia = async () => {
    if (!newMedia.url.trim()) {
      toast.error('Vui lòng nhập URL');
      return;
    }

    try {
      await addMediaItem.mutateAsync({
        url: newMedia.url,
        caption: newMedia.caption,
        description: newMedia.description,
        mediaType: newMedia.mediaType,
      });
      toast.success('Đã thêm media thành công');
      setIsAddDialogOpen(false);
      setNewMedia({
        url: '',
        caption: '',
        description: '',
        mediaType: 'image',
      });
    } catch (error) {
      toast.error('Có lỗi xảy ra: ' + (error as Error).message);
    }
  };

  const handleEditMedia = async () => {
    if (!editingItem) return;

    if (!editMedia.url.trim()) {
      toast.error('Vui lòng nhập URL');
      return;
    }

    try {
      await updateMediaItem.mutateAsync({
        id: editingItem.id,
        url: editMedia.url,
        caption: editMedia.caption,
        description: editMedia.description,
      });
      toast.success('Đã cập nhật media thành công');
      setIsEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra: ' + (error as Error).message);
    }
  };

  const handleDeleteMedia = async (id: bigint) => {
    if (!confirm('Bạn có chắc chắn muốn xóa media này?')) {
      return;
    }

    try {
      await deleteMediaItem.mutateAsync(id);
      toast.success('Đã xóa media thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra: ' + (error as Error).message);
    }
  };

  const openEditDialog = (item: MediaItem) => {
    setEditingItem(item);
    setEditMedia({
      url: item.url,
      caption: item.caption,
      description: item.description,
    });
    setIsEditDialogOpen(true);
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý Thư viện Media</CardTitle>
              <CardDescription>
                Quản lý hình ảnh và video cho website
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm media mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mediaItems && mediaItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaItems.map((item) => (
                <Card key={item.id.toString()} className="border-2">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.mediaType === 'image' ? (
                          <Image className="h-4 w-4 text-primary" />
                        ) : (
                          <Video className="h-4 w-4 text-primary" />
                        )}
                        <span className="text-sm font-medium capitalize">
                          {item.mediaType}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMedia(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {item.mediaType === 'image' && item.url && (
                      <img
                        src={`/assets/generated/${item.url}`}
                        alt={item.caption || 'Media preview'}
                        className="w-full h-32 rounded border object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}

                    <div className="space-y-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.caption || 'Không có tiêu đề'}
                      </p>
                      {item.description && (
                        <p className="text-xs text-foreground/60 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-foreground/40">
                        URL: {item.url}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground/60">
              Chưa có media nào. Nhấn "Thêm media mới" để bắt đầu.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Media Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Media Mới</DialogTitle>
            <DialogDescription>
              Thêm hình ảnh hoặc video vào thư viện
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select
                value={newMedia.mediaType}
                onValueChange={(value) =>
                  setNewMedia({ ...newMedia, mediaType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Hình ảnh</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                value={newMedia.url}
                onChange={(e) =>
                  setNewMedia({ ...newMedia, url: e.target.value })
                }
                placeholder="wine-bottles-premium.dim_800x600.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={newMedia.caption}
                onChange={(e) =>
                  setNewMedia({ ...newMedia, caption: e.target.value })
                }
                placeholder="Nhập tiêu đề..."
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={newMedia.description}
                onChange={(e) =>
                  setNewMedia({ ...newMedia, description: e.target.value })
                }
                placeholder="Nhập mô tả..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAddMedia}
              disabled={addMediaItem.isPending}
            >
              {addMediaItem.isPending ? 'Đang thêm...' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Media Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Media</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin media
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                value={editMedia.url}
                onChange={(e) =>
                  setEditMedia({ ...editMedia, url: e.target.value })
                }
                placeholder="wine-bottles-premium.dim_800x600.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={editMedia.caption}
                onChange={(e) =>
                  setEditMedia({ ...editMedia, caption: e.target.value })
                }
                placeholder="Nhập tiêu đề..."
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={editMedia.description}
                onChange={(e) =>
                  setEditMedia({ ...editMedia, description: e.target.value })
                }
                placeholder="Nhập mô tả..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleEditMedia}
              disabled={updateMediaItem.isPending}
            >
              {updateMediaItem.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
