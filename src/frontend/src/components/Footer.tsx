import { SiFacebook, SiInstagram, SiX, SiYoutube, SiLinkedin } from 'react-icons/si';
import { useGetFooterData, useGetIconLinks } from '../hooks/useQueries';
import { useEffect } from 'react';

const Footer = () => {
  const { data: footerData, isLoading } = useGetFooterData();
  const { data: iconLinks, isLoading: linksLoading } = useGetIconLinks();

  const copyright = footerData?.copyright || '© 2024 Torch Bearer Tasmania. All rights reserved.';

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
    <footer className="bg-background border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {isLoading ? (
            <>
              <div className="h-6 w-64 bg-muted animate-pulse rounded" />
              <div className="flex space-x-4">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
              </div>
            </>
          ) : (
            <>
              <p className="text-foreground/60">{copyright}</p>
              <div className="flex space-x-4">
                {/* Social Media Links */}
                {iconLinks && iconLinks.length > 0 && iconLinks.map((link, index) => {
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
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
