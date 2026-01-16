import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGetProcessSteps, useUpdateProcessSteps } from '../../hooks/useQueries';
import { Plus, Trash2, Save, MoveUp, MoveDown } from 'lucide-react';
import { toast } from 'sonner';
import type { ProcessStep } from '../../backend';

export default function ProcessEditor() {
  const { data: steps, isLoading } = useGetProcessSteps();
  const updateSteps = useUpdateProcessSteps();

  const [localSteps, setLocalSteps] = useState<ProcessStep[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when data loads
  useState(() => {
    if (steps && !hasChanges) {
      setLocalSteps(steps);
    }
  });

  const handleAddStep = () => {
    const newStep: ProcessStep = {
      stepTitle: '',
      description: '',
      mediaUrl: '',
    };
    setLocalSteps([...localSteps, newStep]);
    setHasChanges(true);
  };

  const handleRemoveStep = (index: number) => {
    const updated = localSteps.filter((_, i) => i !== index);
    setLocalSteps(updated);
    setHasChanges(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localSteps];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLocalSteps(updated);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === localSteps.length - 1) return;
    const updated = [...localSteps];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setLocalSteps(updated);
    setHasChanges(true);
  };

  const handleUpdateStep = (index: number, field: keyof ProcessStep, value: string) => {
    const updated = [...localSteps];
    updated[index] = { ...updated[index], [field]: value };
    setLocalSteps(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSteps.mutateAsync(localSteps);
      toast.success('Đã cập nhật quy trình thành công');
      setHasChanges(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra: ' + (error as Error).message);
    }
  };

  const handleRevert = () => {
    if (steps) {
      setLocalSteps(steps);
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
            <CardTitle>Quản lý Quy trình</CardTitle>
            <CardDescription>
              Chỉnh sửa các bước trong quy trình sản xuất
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleRevert}>
                Hoàn tác
              </Button>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || updateSteps.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateSteps.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {localSteps.map((step, index) => (
          <Card key={index} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Bước {index + 1}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === localSteps.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStep(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Tiêu đề bước</Label>
                <Input
                  value={step.stepTitle}
                  onChange={(e) => handleUpdateStep(index, 'stepTitle', e.target.value)}
                  placeholder="Ví dụ: Thu hoạch nho"
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={step.description}
                  onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                  placeholder="Mô tả chi tiết về bước này..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>URL hình ảnh</Label>
                <Input
                  value={step.mediaUrl}
                  onChange={(e) => handleUpdateStep(index, 'mediaUrl', e.target.value)}
                  placeholder="/assets/generated/grape-harvest.dim_800x600.jpg"
                />
                {step.mediaUrl && (
                  <img
                    src={step.mediaUrl}
                    alt="Preview"
                    className="h-24 w-auto rounded border object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={handleAddStep} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Thêm bước mới
        </Button>
      </CardContent>
    </Card>
  );
}
