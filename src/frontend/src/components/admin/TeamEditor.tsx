import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGetTeamMembers, useUpdateTeamMembers } from '../../hooks/useQueries';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { TeamMember } from '../../backend';

export default function TeamEditor() {
  const { data: members, isLoading } = useGetTeamMembers();
  const updateMembers = useUpdateTeamMembers();

  const [localMembers, setLocalMembers] = useState<TeamMember[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when data loads
  useState(() => {
    if (members && !hasChanges) {
      setLocalMembers(members);
    }
  });

  const handleAddMember = () => {
    const newMember: TeamMember = {
      name: '',
      role: '',
      imageUrl: '',
      bio: '',
    };
    setLocalMembers([...localMembers, newMember]);
    setHasChanges(true);
  };

  const handleRemoveMember = (index: number) => {
    const updated = localMembers.filter((_, i) => i !== index);
    setLocalMembers(updated);
    setHasChanges(true);
  };

  const handleUpdateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...localMembers];
    updated[index] = { ...updated[index], [field]: value };
    setLocalMembers(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMembers.mutateAsync(localMembers);
      toast.success('Đã cập nhật đội ngũ thành công');
      setHasChanges(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra: ' + (error as Error).message);
    }
  };

  const handleRevert = () => {
    if (members) {
      setLocalMembers(members);
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
            <CardTitle>Quản lý Đội ngũ</CardTitle>
            <CardDescription>
              Thêm, sửa, xóa thành viên trong đội ngũ
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleRevert}>
                Hoàn tác
              </Button>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || updateMembers.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMembers.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {localMembers.map((member, index) => (
            <Card key={index} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Thành viên {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Tên</Label>
                  <Input
                    value={member.name}
                    onChange={(e) => handleUpdateMember(index, 'name', e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vai trò</Label>
                  <Input
                    value={member.role}
                    onChange={(e) => handleUpdateMember(index, 'role', e.target.value)}
                    placeholder="Ví dụ: Sommelier"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tiểu sử</Label>
                  <Textarea
                    value={member.bio}
                    onChange={(e) => handleUpdateMember(index, 'bio', e.target.value)}
                    placeholder="Giới thiệu ngắn về thành viên..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL ảnh đại diện</Label>
                  <Input
                    value={member.imageUrl}
                    onChange={(e) => handleUpdateMember(index, 'imageUrl', e.target.value)}
                    placeholder="/assets/sommelier-female.dim_400x400.jpg"
                  />
                  {member.imageUrl && (
                    <img
                      src={member.imageUrl}
                      alt="Preview"
                      className="h-24 w-24 rounded-full border object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={handleAddMember} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Thêm thành viên mới
        </Button>
      </CardContent>
    </Card>
  );
}
