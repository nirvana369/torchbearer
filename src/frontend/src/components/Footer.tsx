import { SiFacebook, SiInstagram, SiX, SiZalo } from 'react-icons/si';
import { useGetFooterData } from '../hooks/useQueries';

const Footer = () => {
  const { data: footerData, isLoading } = useGetFooterData();

  const copyright = footerData?.copyright || '© 2024 Torch Bearer Tasmania. All rights reserved.';
  const socialMedia = footerData?.socialMedia || [];

  const getSocialIcon = (url: string) => {
    if (url.includes('facebook')) return <SiFacebook className="h-5 w-5" />;
    if (url.includes('x')) return <SiX className="h-5 w-5" />;
    if (url.includes('zalo')) return <SiZalo className="h-5 w-5" />;
    if (url.includes('instagram')) return <SiInstagram className="h-5 w-5" />;
    return null;
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
                {socialMedia.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary/10 hover:bg-primary/20 p-2 rounded-full transition-colors"
                  >
                    {getSocialIcon(url)}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
