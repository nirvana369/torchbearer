import { useState, useEffect, useRef } from 'react';
import { Phone, X, ShoppingBag, Image } from 'lucide-react';
import { SiFacebook, SiInstagram, SiX, SiYoutube, SiLinkedin } from 'react-icons/si';
import { useNavigate } from '@tanstack/react-router';
import { useGetFloatingBubbleConfig, useGetHeadOfficeContact, useGetIconLinks } from '../hooks/useQueries';

export default function FloatingBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: config, isLoading: configLoading } = useGetFloatingBubbleConfig();
  const { data: headOffice, isLoading: contactLoading } = useGetHeadOfficeContact();
  const { data: iconLinks, isLoading: linksLoading } = useGetIconLinks();

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Don't render if disabled or still loading
  if (configLoading || contactLoading || linksLoading) {
    return null;
  }

  if (!config?.isEnabled) {
    return null;
  }

  const hotlineNumber = config.hotlineNumberOverride || headOffice?.phone || '';
  const backgroundColor = config.backgroundColor || '#FFA500';

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      phone: Phone,
      facebook: SiFacebook,
      instagram: SiInstagram,
      x: SiX,
      youtube: SiYoutube,
      linkedin: SiLinkedin,
    };
    return iconMap[iconName.toLowerCase()] || Phone;
  };

  const IconComponent = getIconComponent(config.icon);

  const getSocialIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      facebook: SiFacebook,
      instagram: SiInstagram,
      x: SiX,
      youtube: SiYoutube,
      linkedin: SiLinkedin,
    };
    return iconMap[iconName.toLowerCase()];
  };

  return (
    <div ref={bubbleRef} className="fixed bottom-6 left-6 z-[100]">
      {/* Expanded Panel */}
      <div
        className={`absolute bottom-0 left-0 bg-card border border-border rounded-2xl shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{ width: '280px' }}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Liên hệ nhanh</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Hotline */}
          {hotlineNumber && (
            <a
              href={`tel:${hotlineNumber}`}
              className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor }}
              >
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/60">Hotline</p>
                <p className="font-semibold text-foreground">{hotlineNumber}</p>
              </div>
            </a>
          )}

          {/* Product Link */}
          <button
            onClick={() => {
              navigate({ to: '/product' });
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor }}
            >
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Sản phẩm</p>
              <p className="text-xs text-foreground/60">Xem danh mục</p>
            </div>
          </button>

          {/* Media Gallery Link */}
          <button
            onClick={() => {
              navigate({ to: '/media' });
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor }}
            >
              <Image className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Thư viện</p>
              <p className="text-xs text-foreground/60">Hình ảnh & Video</p>
            </div>
          </button>

          {/* Social Media Links */}
          {iconLinks && iconLinks.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-foreground/60 mb-3">Mạng xã hội</p>
              <div className="flex items-center space-x-2">
                {iconLinks.map((link, index) => {
                  const SocialIcon = getSocialIcon(link.icon);
                  if (!SocialIcon) return null;

                  return (
                    <a
                      key={index}
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                    >
                      <SocialIcon className="h-5 w-5 text-foreground" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ backgroundColor }}
        aria-label="Liên hệ nhanh"
      >
        <IconComponent className="h-6 w-6" />
      </button>
    </div>
  );
}
