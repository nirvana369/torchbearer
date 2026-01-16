import { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetHeroSection } from '../hooks/useQueries';

const Hero = () => {
  const { data: heroData, isLoading } = useGetHeroSection();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Default slideshow images - will be replaced by backend data when available
  const defaultImages = [
    '/assets/generated/hero-vineyard.dim_1920x1080.jpg',
    '/assets/generated/vineyard-aerial.dim_1200x800.jpg',
    '/assets/generated/wine-cellar.dim_1024x768.jpg',
  ];

  // Get images from backend or use defaults
  const heroImages = heroData?.mediaUrl 
    ? [
        heroData.mediaUrl.startsWith('http') 
          ? heroData.mediaUrl 
          : `/assets/generated/${heroData.mediaUrl}`
      ]
    : defaultImages;

  const slideshowTiming = 5000; // 5 seconds between transitions

  const title = heroData?.title || 'Vì cuộc sống là những trải nghiệm phi thường';
  const content = heroData?.content || '#xlife #torchbearer #Tmoment #người cầm đuốc';

  // Auto-advance slideshow
  useEffect(() => {
    if (heroImages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, slideshowTiming);

    return () => clearInterval(interval);
  }, [heroImages.length, isPaused, slideshowTiming]);

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    }
  };

  const scrollToAbout = () => {
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="hero" 
      className="relative h-screen flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 z-0">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <>
            {/* Slideshow images with crossfade */}
            {heroImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Vineyard landscape ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" />
          </>
        )}
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-3/4 mx-auto" />
              <Skeleton className="h-8 w-2/3 mx-auto" />
              <Skeleton className="h-8 w-1/2 mx-auto" />
              <div className="flex gap-4 justify-center pt-4">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-12 w-48" />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
                {title}
              </h1>
              <p className="text-xl md:text-2xl text-accent font-semibold max-w-3xl mx-auto leading-relaxed">
                {content}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={scrollToAbout}
                >
                  Khám phá câu chuyện
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6"
                  onClick={() => {
                    const productsSection = document.querySelector('#products');
                    if (productsSection) {
                      productsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Xem sản phẩm
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Slideshow indicators */}
      {!isLoading && heroImages.length > 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-primary w-8' 
                  : 'bg-primary/30 hover:bg-primary/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {!isLoading && (
        <button
          onClick={scrollToAbout}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce"
          aria-label="Scroll down"
        >
          <ArrowDown className="h-8 w-8 text-primary" />
        </button>
      )}
    </section>
  );
};

export default Hero;
