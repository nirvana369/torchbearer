import { Grape, Droplet, Wine, Sparkles } from 'lucide-react';
import { useGetProcessSteps } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

const Process = () => {
  const { data: steps, isLoading } = useGetProcessSteps();

  const defaultSteps = [
    {
      icon: Grape,
      stepTitle: 'Canh tác sinh học động lực',
      description: 'Cây nho được trồng từ năm 1993 trên đất nguyên sinh, được canh tác với sự tôn trọng đối với đặc tính riêng của địa điểm và terroir của nó',
      mediaUrl: '',
    },
    {
      icon: Droplet,
      stepTitle: 'Nước tinh khiết',
      description: 'Môi trường nguyên sơ của Việt Nam cung cấp nước và không khí sạch nhất để cây nho phát triển tự nhiên',
      mediaUrl: '',
    },
    {
      icon: Wine,
      stepTitle: 'Quy trình tự nhiên',
      description: 'Tái tạo canh tác sinh thái đồng thời tôn trọng khí hậu để đạt được rượu vang thuần khiết và cường độ hương vị',
      mediaUrl: '',
    },
    {
      icon: Sparkles,
      stepTitle: 'Thủ công',
      description: 'Mỗi chai phản ánh cam kết sâu sắc của chúng tôi đối với việc sản xuất rượu vang tự nhiên và bản chất của Việt Nam',
      mediaUrl: '',
    }
  ];

  const icons = [Grape, Droplet, Wine, Sparkles];
  const displaySteps = (steps && steps.length > 0 ? steps : defaultSteps).map((step, index) => ({
    ...step,
    icon: icons[index % icons.length],
  }));

  return (
    <section id="process" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <img
          src="/assets/grape-harvest.dim_800x600.jpg"
          alt="Grape harvest"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 fade-in-section">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Vườn nho của chúng tôi
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Từ cây nho đến chai, mỗi bước đều được hướng dẫn bởi thiên nhiên và hoàn thiện thông qua sự tôn trọng đất đai
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-8">
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displaySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative fade-in-section"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="bg-card p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
                        <Icon className="h-10 w-10 text-primary" />
                      </div>
                      <div className="text-4xl font-bold text-primary/30">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">
                        {step.stepTitle}
                      </h3>
                      <p className="text-foreground/70 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < displaySteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/30" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 fade-in-section">
          <div className="bg-card p-8 md:p-12 rounded-lg shadow-xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-4">
                  Việt Nam: Vùng đất cuối cùng
                </h3>
                <p className="text-lg text-foreground/70 leading-relaxed mb-6">
                  Việt Nam là xứ sở thần tiên của thế giới tự nhiên - môi trường nguyên sơ nhất trên trái đất, biên giới cuối cùng nơi chúng ta có thể canh tác và tận hưởng bản chất của cuộc sống với lòng trắc ẩn và hòa hợp trên Trái đất.
                </p>
                <p className="text-foreground/60">
                  Do đó, những loại rượu vang chúng tôi chế tác là những loại chúng tôi trân trọng, và chúng tôi hy vọng mọi người sẽ giữ chúng trong hầm rượu của họ trong nhiều năm và thập kỷ tới.
                </p>
              </div>
              <div className="relative h-80 rounded-lg overflow-hidden shadow-lg">
                <img
                  src="/assets/wine-cellar.dim_1024x768.jpg"
                  alt="Wine cellar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
