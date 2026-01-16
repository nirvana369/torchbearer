import { useNavigate } from '@tanstack/react-router';
import { useGetAboutSection } from '../hooks/useQueries';
import { Button } from './ui/button';

const About = () => {
  const navigate = useNavigate();
  const { data: aboutData, isLoading } = useGetAboutSection();

  // Use the first media section image if available, otherwise use default
  const imageUrl = aboutData?.mediaSections?.[0]?.mediaUrl
    ? (aboutData.mediaSections[0].mediaUrl.startsWith('http')
        ? aboutData.mediaSections[0].mediaUrl
        : `/assets/${aboutData.mediaSections[0].mediaUrl}`)
    : '/assets/wine.jpg';

  const title = aboutData?.introductoryHeading || 'Doanh nghiệp Người Cầm Đuốc';
  const content = aboutData?.mainDescription || 'Với trang trại rượu được thành lập từ năm 1994, công ty rượu Người Cầm Đuốc được thành lập từ vùng rượu nổi tiếng thế giới – thung lũng sông Coal, thuộc tiểu bang Tasmania, Úc Đại Lợi.';

  const handleLearnMore = () => {
    navigate({ to: '/about' });
  };

  return (
    <section id="about" className="py-20 bg-background fade-in-section">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {isLoading ? (
              <>
                <div className="h-12 bg-muted animate-pulse rounded w-3/4" />
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                  {title}
                </h2>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  {content}
                </p>
                <Button
                  onClick={handleLearnMore}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Tìm hiểu thêm
                </Button>
              </>
            )}
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden shadow-2xl">
            {isLoading ? (
              <div className="w-full h-full bg-muted animate-pulse" />
            ) : (
              <img
                src={imageUrl}
                alt="Vineyard aerial view"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = '/assets/wine.jpg';
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
