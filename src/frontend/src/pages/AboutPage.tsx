import { useEffect } from 'react';
import Header from '../components/Header';
import Process from '../components/Process';
import Team from '../components/Team';
import Footer from '../components/Footer';
import { useActor } from '../hooks/useActor';
import { useGetAboutSection } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

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
  }, []);

  // Only show loading during initial actor fetch
  if (isFetching) {
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

        {/* Bilingual Content Sections */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-16">
              {/* Vietnamese Section */}
              <div className="space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-primary">
                  Nghệ Thuật Làm Rượu
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-card rounded-lg shadow-lg p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      Câu Chuyện, Lịch sử
                    </h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Trang trại rượu của chúng tôi được thành lập từ năm 1994 tại vùng rượu nổi tiếng thế giới – thung lũng sông Coal, thuộc tiểu bang Tasmania, Úc Đại Lợi.
                    </p>
                  </div>
                  <div className="bg-card rounded-lg shadow-lg p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      Trang trại rượu
                    </h3>
                    <p className="text-foreground/70 leading-relaxed">
                      Trang trại rượu nhỏ 'ese được chăm sóc theo phương pháp thuần tự nhiên (zen farming), để cao và tôn trọng đất mẹ và sự kì diệu của quả nho hóa.
                    </p>
                  </div>
                </div>
              </div>

              {/* English Section */}
              <div className="space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-accent">
                  The Art of Wine Making
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-card rounded-lg shadow-lg p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      Our Vision
                    </h3>
                    <p className="text-foreground/70 leading-relaxed">
                      What is one word that describe our wines unique character? It's Purity - we aspire to make the purest wines in the world from our virgin soil, biodynamic farming principles, and pure air and water of Tasmania.
                    </p>
                  </div>
                  <div className="bg-card rounded-lg shadow-lg p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      Philosophy
                    </h3>
                    <p className="text-foreground/70 leading-relaxed">
                      The island of Tasmania is the wonderland of natural world - the most pristine environment on earth, the last frontier where we can cultivate and enjoy the essence of life with compassion and harmony.
                    </p>
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-8 text-center">
                  <blockquote className="text-2xl md:text-3xl font-bold text-primary italic">
                    "Businesses don't make great wine, nature does"
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Media Sections */}
        {mediaSections.length > 0 && (
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {mediaSections.map((section, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 fade-in-section"
                  >
                    {section.mediaUrl && (
                      <div className="relative h-64">
                        <img
                          src={
                            section.mediaUrl.startsWith('http')
                              ? section.mediaUrl
                              : `/assets/${section.mediaUrl}`
                          }
                          alt={section.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/wine.jpg';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-6 space-y-3">
                      <h3 className="text-2xl font-bold text-foreground">
                        {section.title}
                      </h3>
                      <p className="text-foreground/70 leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Process and Team Sections */}
        <Process />
        <Team />
      </main>
      <Footer />
    </>
  );
}
