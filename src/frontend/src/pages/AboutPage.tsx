import { useEffect } from 'react';
import Header from '../components/Header';
import Process from '../components/Process';
import Team from '../components/Team';
import Footer from '../components/Footer';
import { useActor } from '../hooks/useActor';
import { useGetAboutSection } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

// Media Layout Components
interface MediaSectionProps {
  mediaUrl: string;
  title: string;
  description: string;
  mediaType: string;
}

// Layout 1: Text first, then image (stacked)
const TextImageStacked = ({ mediaUrl, title, description }: MediaSectionProps) => (
  <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 fade-in-section">
    <div className="p-6 space-y-3">
      <h3 className="text-2xl font-bold text-foreground">{title}</h3>
      <p className="text-foreground/70 leading-relaxed">{description}</p>
    </div>
    {mediaUrl && (
      <div className="relative h-64">
        <img
          src={mediaUrl.startsWith('http') ? mediaUrl : `/assets/${mediaUrl}`}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/assets/image.png';
          }}
        />
      </div>
    )}
  </div>
);

// Layout 2: Text right, image left
const ImageLeftTextRight = ({ mediaUrl, title, description }: MediaSectionProps) => (
  <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 fade-in-section">
    <div className="md:flex">
      {mediaUrl && (
        <div className="md:w-1/2 relative h-64 md:h-auto">
          <img
            src={mediaUrl.startsWith('http') ? mediaUrl : `/assets/${mediaUrl}`}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/assets/image.png';
            }}
          />
        </div>
      )}
      <div className="md:w-1/2 p-6 space-y-3">
        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        <p className="text-foreground/70 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// Layout 3: Text left, image right
const TextLeftImageRight = ({ mediaUrl, title, description }: MediaSectionProps) => (
  <div className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 fade-in-section">
    <div className="md:flex flex-row-reverse">
      {mediaUrl && (
        <div className="md:w-1/2 relative h-64 md:h-auto">
          <img
            src={mediaUrl.startsWith('http') ? mediaUrl : `/assets/${mediaUrl}`}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/assets/image.png';
            }}
          />
        </div>
      )}
      <div className="md:w-1/2 p-6 space-y-3">
        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        <p className="text-foreground/70 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// Layout 4: Full-width with overlay
const FullWidthWithOverlay = ({ mediaUrl, title, description }: MediaSectionProps) => (
  <div className="relative rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 fade-in-section h-96">
    {mediaUrl && (
      <img
        src={mediaUrl.startsWith('http') ? mediaUrl : `/assets/${mediaUrl}`}
        alt={title}
        className="w-full h-full object-cover absolute inset-0"
        onError={(e) => {
          e.currentTarget.src = '/assets/image.png';
        }}
      />
    )}
    <div className="absolute inset-0 bg-black/40 flex items-center">
      <div className="p-8 md:p-12 text-white max-w-2xl">
        <h3 className="text-3xl md:text-4xl font-bold mb-4">{title}</h3>
        <p className="text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// Layout 5: Image with text overlay (centered)
const ImageWithOverlayCentered = ({ mediaUrl, title, description }: MediaSectionProps) => (
  <div className="relative rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 fade-in-section h-96">
    {mediaUrl && (
      <img
        src={mediaUrl.startsWith('http') ? mediaUrl : `/assets/${mediaUrl}`}
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = '/assets/image.png';
        }}
      />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-8">
      <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/90 leading-relaxed max-w-2xl">{description}</p>
    </div>
  </div>
);

// Dynamic Layout Selector
const DynamicMediaLayout = ({ section }: { section: any }) => {
  const layoutType = section.mediaType || "1"; // Default to type 1
  
  const layouts = {
    "1": <TextImageStacked {...section} />,
    "2": <ImageLeftTextRight {...section} />,
    "3": <TextLeftImageRight {...section} />,
    "4": <FullWidthWithOverlay {...section} />,
    "5": <ImageWithOverlayCentered {...section} />,
  };
  
  return layouts[layoutType as keyof typeof layouts] || layouts[1];
};

// Skeleton Loaders for different layouts
const MediaSkeleton = ({ type = 1 }: { type?: number }) => {
  const skeletons = {
    1: (
      <div className="bg-card rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    ),
    2: (
      <div className="bg-card rounded-lg shadow-lg overflow-hidden md:flex">
        <Skeleton className="md:w-1/2 h-64 md:h-auto" />
        <div className="md:w-1/2 p-6 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    ),
    3: (
      <div className="bg-card rounded-lg shadow-lg overflow-hidden md:flex flex-row-reverse">
        <Skeleton className="md:w-1/2 h-64 md:h-auto" />
        <div className="md:w-1/2 p-6 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    ),
    4: (
      <div className="bg-card rounded-lg shadow-lg overflow-hidden h-96 relative">
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-black/40 flex items-center p-8 md:p-12">
          <div className="max-w-2xl w-full">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    ),
    5: (
      <div className="bg-card rounded-lg shadow-lg overflow-hidden h-96 relative">
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <Skeleton className="h-10 w-3/4 mb-3" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    ),
  };
  
  return skeletons[type as keyof typeof skeletons] || skeletons[1];
};

export default function AboutPage() {
  const { isFetching } = useActor();
  const { data: aboutSection, isLoading: aboutLoading } = useGetAboutSection();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('.fade-in-section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [aboutSection]);

  // If actor is fetching but we already have aboutSection data, allow render
  if (isFetching && !aboutSection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-foreground/60">Đang tải...</p>
        </div>
      </div>
    );
  }

  const introHeading = aboutSection?.introductoryHeading || 'Doanh nghiệp Người Cầm Đuốc';
  const mainDescription = aboutSection?.mainDescription || 'Với trang trại rượu được thành lập từ năm 1994, công ty rượu Người Cầm Đuốc được thành lập từ vùng rượu nổi tiếng thế giới – thung lũng sông Coal, thuộc tiểu bang Tasmania, Úc Đại Lợi. Trang trại rượu nhỏ \'ese được chăm sóc theo phương pháp thuần tự nhiên (zen farming), để cao và tôn trọng đất mẹ và sự kì diệu của quả nho hóa.';
  const mediaSections = aboutSection?.mediaSections || [];

  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Introductory Section */}
        <section className="py-20 bg-background fade-in-section">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              {aboutLoading ? (
                <>
                  <Skeleton className="h-12 w-3/4 mx-auto" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                    {introHeading}
                  </h1>
                  <p className="text-lg text-foreground/70 leading-relaxed">
                    {mainDescription}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Media Sections with Dynamic Layouts */}
        {mediaSections.length > 0 && (
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              {aboutLoading ? (
                // Loading Skeletons
                <div className="max-w-6xl mx-auto space-y-12">
                  {[1, 2, 3, 4, 5].map((type, index) => (
                    <MediaSkeleton key={index} type={index % 5 + 1} />
                  ))}
                </div>
              ) : (
                // Dynamic Layout Content
                <div className="max-w-6xl mx-auto">
                  {/* <div className="mb-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                      Our Story in Pictures
                    </h2>
                    <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                      Discover our journey through carefully curated moments that tell the story of our passion for winemaking
                    </p>
                  </div> */}
                  
                  <div className="space-y-12">
                    {mediaSections.map((section, index) => {
                      const isFullWidth = section.mediaType === "4" || section.mediaType === "5";
                      
                      return (
                        <div 
                          key={index} 
                          className={`${isFullWidth ? '' : 'md:max-w-5xl mx-auto'}`}
                        >
                          <DynamicMediaLayout section={section} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Alternative Grid Layout */}
                  {/*
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {mediaSections.map((section, index) => (
                      <div 
                        key={index} 
                        className={section.type === 4 || section.type === 5 ? 'lg:col-span-2' : ''}
                      >
                        <DynamicMediaLayout section={section} />
                      </div>
                    ))}
                  </div>
                  */}
                </div>
              )}
            </div>
          </section>
        )}
        {/* Process and Team Sections */}
        {/* <Process /> */}
        <Team />
      </main>
      <Footer />
    </>
  );
}