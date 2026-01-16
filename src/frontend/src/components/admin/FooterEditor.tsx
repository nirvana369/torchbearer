import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGetFooterData, useUpdateFooterData } from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { FooterData } from '@/backend';

export default function FooterEditor() {
  const { data: footerData, isLoading } = useGetFooterData();
  const updateFooterMutation = useUpdateFooterData();

  const [formData, setFormData] = useState<FooterData>({
    copyright: '',
    links: [],
    socialMedia: [],
  });

  useEffect(() => {
    if (footerData) {
      setFormData(footerData);
    }
  }, [footerData]);

  const handleSave = async () => {
    try {
      await updateFooterMutation.mutateAsync(formData);
      toast.success('Đã lưu thành công!', {
        description: 'Nội dung Footer đã được cập nhật.',
      });
    } catch (error) {
      toast.error('Lỗi khi lưu', {
        description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    }
  };

  const updateSocialMedia = (index: number, value: string) => {
    const updated = [...formData.socialMedia];
    updated[index] = value;
    setFormData({ ...formData, socialMedia: updated });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa Footer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chỉnh sửa Footer (Torch Bearer Tasmania)</CardTitle>
        <CardDescription>
          Cập nhật thông tin footer và mạng xã hội
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="footer-copyright">Bản quyền</Label>
          <Input
            id="footer-copyright"
            placeholder="© 2024 Torch Bearer Tasmania. All rights reserved."
            value={formData.copyright}
            onChange={(e) => setFormData({ ...formData, copyright: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="footer-facebook">Facebook URL</Label>
          <Input
            id="footer-facebook"
            placeholder="https://facebook.com/torchbearertasmania"
            value={formData.socialMedia[0] || ''}
            onChange={(e) => updateSocialMedia(0, e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="footer-instagram">Instagram URL</Label>
          <Input
            id="footer-instagram"
            placeholder="https://instagram.com/torchbearertasmania"
            value={formData.socialMedia[1] || ''}
            onChange={(e) => updateSocialMedia(1, e.target.value)}
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={updateFooterMutation.isPending}
          className="w-full"
        >
          {updateFooterMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </CardContent>
    </Card>
  );
}
