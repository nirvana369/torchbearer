import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetIconLinks, useUpdateIconLinks } from '../../hooks/useQueries';
import { Plus, Trash2, Save } from 'lucide-react';
import { SiFacebook, SiInstagram, SiX, SiYoutube, SiLinkedin } from 'react-icons/si';
import { toast } from 'sonner';
import type { IconLink } from '../../backend';

const iconOptions = [
  { value: 'facebook', label: 'Facebook', Icon: SiFacebook },
  { value: 'instagram', label: 'Instagram', Icon: SiInstagram },
  { value: 'x', label: 'X (Twitter)', Icon: SiX },
  { value: 'youtube', label: 'YouTube', Icon: SiYoutube },
  { value: 'linkedin', label: 'LinkedIn', Icon: SiLinkedin },
];

export default function IconLinksEditor() {
  const { data: links, isLoading } = useGetIconLinks();
  const updateLinks = useUpdateIconLinks();

  const [localLinks, setLocalLinks] = useState<IconLink[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when data loads
  useState(() => {
    if (links && !hasChanges) {
      setLocalLinks(links);
    }
  });

  const handleAddLink = () => {
    const newLink: IconLink = {
      icon: 'facebook',
      link: '',
    };
    setLocalLinks([...localLinks, newLink]);
    setHasChanges(true);
  };

  const handleRemoveLink = (index: number) => {
    const updated = localLinks.filter((_, i) => i !== index);
    setLocalLinks(updated);
    setHasChanges(true);
  };

  const handleUpdateLink = (index: number, field: keyof IconLink, value: string) => {
    const updated = [...localLinks];
    updated[index] = { ...updated[index], [field]: value };
    setLocalLinks(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateLinks.mutateAsync(localLinks);
      toast.success('Đã cập nhật liên kết thành công');
      setHasChanges(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra: ' + (error as Error).message);
    }
  };

  const handleRevert = () => {
    if (links) {
      setLocalLinks(links);
      setHasChanges(false);
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý Liên kết Mạng xã hội</CardTitle>
            <CardDescription>
              Thêm, sửa, xóa các liên kết mạng xã hội
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleRevert}>
                Hoàn tác
              </Button>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || updateLinks.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateLinks.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {localLinks.map((link, index) => {
          const iconOption = iconOptions.find((opt) => opt.value === link.icon);
          const Icon = iconOption?.Icon || SiFacebook;

          return (
            <Card key={index} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label>Mạng xã hội</Label>
                      <select
                        value={link.icon}
                        onChange={(e) => handleUpdateLink(index, 'icon', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        {iconOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={link.link}
                        onChange={(e) => handleUpdateLink(index, 'link', e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLink(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button onClick={handleAddLink} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Thêm liên kết mới
        </Button>
      </CardContent>
    </Card>
  );
}
