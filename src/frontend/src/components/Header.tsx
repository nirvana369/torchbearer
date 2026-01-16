import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Menu, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useGetHeader } from '../hooks/useQueries';
import { useCart } from '../contexts/CartContext';

const Header = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { data: headerData, isLoading } = useGetHeader();
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Trang chủ', href: '/', isRoute: true },
    { label: 'Giới thiệu', href: '/about', isRoute: true },
    { label: 'Sản phẩm', href: '/product', isRoute: true },
    { label: 'Thư viện', href: '/media', isRoute: true },
    { label: 'Liên hệ', href: '/contact', isRoute: true }
  ];

  const handleNavigation = (href: string, isRoute: boolean) => {
    if (isRoute) {
      navigate({ to: href });
      setIsOpen(false);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
      }
    }
  };

  const logoUrl = headerData?.mediaUrl 
    ? `/assets/${headerData.mediaUrl}`
    : '/assets/logo.webp';

  const brandName = headerData?.title || 'Torch Bearer Tasmania';

  return (
    <header
      // className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/95 backdrop-blur-md shadow-md`}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center space-x-3 group"
          >
            {isLoading ? (
              <div className="h-12 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <img
                src={logoUrl}
                alt={brandName}
                // className="h-12 w-12 transition-transform group-hover:scale-110"
                className="transition-transform group-hover:scale-110"
              />
            )}
            {/* <span className="text-2xl font-bold text-primary">
              {brandName}
            </span> */}
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.href, item.isRoute)}
                className="text-[#8B6508] hover:text-[#D4AF37] transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-[#8B6508] hover:text-[#D4AF37]"
              onClick={() => navigate({ to: '/cart' })}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate({ to: '/cart' })}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-6 mt-8">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavigation(item.href, item.isRoute)}
                      className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors text-left"
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      navigate({ to: '/cart' });
                      setIsOpen(false);
                    }}
                    className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors text-left flex items-center gap-2"
                  >
                    Giỏ hàng
                    {cartItemCount > 0 && (
                      <Badge variant="destructive">{cartItemCount}</Badge>
                    )}
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
