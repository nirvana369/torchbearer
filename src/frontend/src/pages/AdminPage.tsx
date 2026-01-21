import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from "./../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import AdminDashboard from '../components/admin/AdminDashboard';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminPage() {
  const navigate = useNavigate();
  const { identity, login, status, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const [profileName, setProfileName] = useState('');

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    
    await saveProfile.mutateAsync({
      name: profileName,
      email: '',
      role: 'admin',
    });
  };

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card p-8 rounded-lg shadow-xl text-center space-y-6">
            <div className="flex justify-center">
              <img
                src="/assets/logo.webp"
                alt="Logo"
                // className="h-20 w-20"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Admin CMS
              </h1>
              <p className="text-foreground/70">
                Đăng nhập để quản lý nội dung website
              </p>
            </div>
            <Button
              onClick={handleLogin}
              size="lg"
              className="w-full"
              disabled={status === 'logging-in'}
            >
              {status === 'logging-in' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập với Internet Identity'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/' })}
              className="w-full"
            >
              Quay lại trang chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={showProfileSetup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Thiết lập hồ sơ</DialogTitle>
            <DialogDescription>
              Vui lòng nhập tên của bạn để tiếp tục
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên của bạn</Label>
              <Input
                id="name"
                placeholder="Nhập tên..."
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && profileName.trim()) {
                    handleSaveProfile();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={!profileName.trim() || saveProfile.isPending}
              className="w-full"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu hồ sơ'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!showProfileSetup && <AdminDashboard />}
    </>
  );
}
