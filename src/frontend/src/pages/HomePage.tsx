import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Products from '../components/Products';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import { useActor } from '../hooks/useActor';
import AgeModal from '../components/AgeModal';
import { useGetProducts } from '../hooks/useQueries';

export default function HomePage() {
  const { isFetching } = useActor();
  const { data: productsData, isLoading, isError, error } = useGetProducts();

  // Initialize ageVerified from localStorage synchronously to avoid a flash
  const getInitialAgeVerified = () => {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem('ageVerified');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.confirmed === true ? true : false;
    } catch {
      return null;
    }
  };

  const [ageVerified, setAgeVerified] = useState<boolean | null>(getInitialAgeVerified);

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
  }, [productsData?.length]);

  // ...existing code... (removed inline scroll-lock effect; AgeModal handles it)

  const handleConfirm = (confirmed: boolean) => {
    try {
      const payload = {
        confirmed,
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        at: Date.now()
      };
      localStorage.setItem('ageVerified', JSON.stringify(payload));
    } catch {
      // ignore localStorage errors
    }

    setAgeVerified(confirmed);
  };

  // Render everything but use an overlay modal to block interaction when not verified
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Products products={productsData?.map(([id, p]) => p)} isLoading={isLoading} isError={isError} error={error} />
        <Contact />
      </main>
      <Footer />

      {/* Loading spinner (only when actor is fetching and user already verified) */}
      {isFetching && ageVerified === true && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg text-foreground/60">Đang tải...</p>
          </div>
        </div>
      )}

      {/* Reusable age modal component */}
      <AgeModal open={ageVerified !== true} onDecision={handleConfirm} />
    </>
  );
}
