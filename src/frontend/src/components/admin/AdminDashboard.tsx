import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from "./../../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Home } from 'lucide-react';
import HeroEditor from './HeroEditor';
import AboutEditor from './AboutEditor';
import ProductsEditor from './ProductsEditor';
import CategoriesEditor from './CategoriesEditor';
// import ProcessEditor from './ProcessEditor';
import TeamEditor from './TeamEditor';
import ContactEditor from './ContactEditor';
import FooterEditor from './FooterEditor';
import MediaEditor from './MediaEditor';
import { canisterId } from 'declarations/assets';
import IconLinksEditor from './IconLinksEditor';
import FloatingBubbleEditor from './FloatingBubbleEditor';
import CustomerMessagesEditor from './CustomerMessagesEditor';
import AdminManagementEditor from './AdminManagementEditor';
import ProductSettingsEditor from './ProductSettingsEditor';
import OrdersEditor from './OrdersEditor';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clear, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const [activeTab, setActiveTab] = useState('hero');

  const principalId = identity?.getPrincipal().toString() || '';

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <img
                src="/assets/logo.webp"
                alt="Logo"
                // className="h-10 w-10"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin CMS</h1>
                <p className="text-sm text-foreground/60">
                  Xin chào, {userProfile?.name || 'Admin'}
                </p>
                {principalId && (
                  <p className="text-xs text-foreground/50 font-mono mt-1 break-all max-w-md">
                    Principal ID: {principalId}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/' })}
              >
                <Home className="h-4 w-4 mr-2" />
                Trang chủ
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-7 lg:grid-cols-14 w-full max-w-7xl gap-1">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="about">Giới thiệu</TabsTrigger>
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt SP</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
            <TabsTrigger value="process">Quy trình</TabsTrigger>
            <TabsTrigger value="team">Đội ngũ</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="links">Liên kết</TabsTrigger>
            <TabsTrigger value="contact">Liên hệ</TabsTrigger>
            <TabsTrigger value="messages">Tin nhắn</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="admins">Quản lý Admin</TabsTrigger>
            <TabsTrigger value="bubble">Bubble</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="hero">
            <HeroEditor />
          </TabsContent>

          <TabsContent value="about">
            <AboutEditor />
          </TabsContent>

          <TabsContent value="products">
            <ProductsEditor />
          </TabsContent>

          <TabsContent value="settings">
            <ProductSettingsEditor />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesEditor />
          </TabsContent>

          {/* <TabsContent value="process">
            <ProcessEditor />
          </TabsContent> */}

          <TabsContent value="team">
            <TeamEditor />
          </TabsContent>

          <TabsContent value="media">
            <MediaEditor canisterId={canisterId} identity={identity}/>
            {/* <IcpAssetManager canisterId={canisterId} identity={identity}/> */}
          </TabsContent>

          <TabsContent value="links">
            <IconLinksEditor />
          </TabsContent>

          <TabsContent value="contact">
            <ContactEditor />
          </TabsContent>

          <TabsContent value="messages">
            <CustomerMessagesEditor />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersEditor />
          </TabsContent>

          <TabsContent value="admins">
            <AdminManagementEditor />
          </TabsContent>

          <TabsContent value="bubble">
            <FloatingBubbleEditor />
          </TabsContent>

          <TabsContent value="footer">
            <FooterEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
