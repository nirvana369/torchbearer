import { useState } from 'react';
import { useGetAdmins, useAddAdmin, useRemoveAdmin } from '../../hooks/useQueries';
import { useInternetIdentity } from "./../../hooks/useInternetIdentity";
import { Principal } from '@dfinity/principal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Shield, UserPlus, Trash2, Crown } from 'lucide-react';

export default function AdminManagementEditor() {
  const { identity } = useInternetIdentity();
  const { data: admins, isLoading } = useGetAdmins();
  const addAdminMutation = useAddAdmin();
  const removeAdminMutation = useRemoveAdmin();

  const [newPrincipalId, setNewPrincipalId] = useState('');
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null);

  const currentUserPrincipal = identity?.getPrincipal().toString() || '';
  const superAdmin = admins && admins.length > 0 ? admins[0].principalId : '';

  const handleAddAdmin = async () => {
    if (!newPrincipalId.trim()) {
      toast.error('Vui lòng nhập Principal ID');
      return;
    }

    try {
      const principal = Principal.fromText(newPrincipalId.trim());
      
      await addAdminMutation.mutateAsync(principal);
      toast.success('Đã thêm admin thành công');
      setNewPrincipalId('');
    } catch (error: any) {
      console.error('Error adding admin:', error);
      if (error.message?.includes('Invalid principal')) {
        toast.error('Principal ID không hợp lệ');
      } else {
        toast.error('Không thể thêm admin: ' + (error.message || 'Lỗi không xác định'));
      }
    }
  };

  const handleRemoveAdmin = async () => {
    if (!adminToRemove) return;

    try {
      const principal = Principal.fromText(adminToRemove);
      
      await removeAdminMutation.mutateAsync(principal);
      toast.success('Đã xóa admin thành công');
      setAdminToRemove(null);
    } catch (error: any) {
      console.error('Error removing admin:', error);
      toast.error('Không thể xóa admin: ' + (error.message || 'Lỗi không xác định'));
      setAdminToRemove(null);
    }
  };

  const isSuperAdmin = (principalId: string) => {
    return principalId === superAdmin;
  };

  const isCurrentUser = (principalId: string) => {
    return principalId === currentUserPrincipal;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Quản lý Admin
          </CardTitle>
          <CardDescription>
            Thêm hoặc xóa người dùng có quyền quản trị hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Admin Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="principalId" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Thêm Admin Mới
              </Label>
              <div className="flex gap-2">
                <Input
                  id="principalId"
                  placeholder="Nhập Principal ID (ví dụ: xxxxx-xxxxx-xxxxx-xxxxx-xxx)"
                  value={newPrincipalId}
                  onChange={(e) => setNewPrincipalId(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleAddAdmin}
                  disabled={addAdminMutation.isPending || !newPrincipalId.trim()}
                >
                  {addAdminMutation.isPending ? 'Đang thêm...' : 'Thêm Admin'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Principal ID phải là định dạng hợp lệ của Internet Computer
              </p>
            </div>
          </div>

          {/* Admin List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Danh sách Admin</Label>
              {admins && (
                <Badge variant="secondary">
                  {admins.length} admin{admins.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                ))}
              </div>
            ) : admins && admins.length > 0 ? (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div
                    key={admin.principalId}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono break-all">
                          {admin.principalId}
                        </code>
                        {isSuperAdmin(admin.principalId) && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Super Admin
                          </Badge>
                        )}
                        {isCurrentUser(admin.principalId) && (
                          <Badge variant="outline">Bạn</Badge>
                        )}
                      </div>
                      {isSuperAdmin(admin.principalId) && (
                        <p className="text-xs text-muted-foreground">
                          Super admin không thể bị xóa
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setAdminToRemove(admin.principalId)}
                      disabled={
                        isSuperAdmin(admin.principalId) ||
                        removeAdminMutation.isPending
                      }
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có admin nào trong hệ thống</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!adminToRemove} onOpenChange={() => setAdminToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa admin</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa quyền admin của người dùng này không? Hành động này không thể hoàn tác.
              <div className="mt-4 p-3 bg-muted rounded-md">
                <code className="text-sm font-mono break-all">{adminToRemove}</code>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
