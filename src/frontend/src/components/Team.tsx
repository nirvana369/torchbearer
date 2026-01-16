import { useGetTeamMembers } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

const Team = () => {
  const { data: members, isLoading } = useGetTeamMembers();

  const defaultTeam = [
    {
      name: 'Hà',
      role: 'Sommelier',
      imageUrl: '/assets/sommelier-female.dim_400x400.jpg',
      bio: 'Chuyên gia thử rượu với kinh nghiệm 15 năm.'
    },
    {
      name: 'Đức',
      role: 'Winemaker',
      imageUrl: '/assets/winemaker-male.dim_400x400.jpg',
      bio: 'Nhà sản xuất rượu vang với đam mê tạo ra những loại rượu đặc sắc.'
    }
  ];

  const displayTeam = (members && members.length > 0) ? members : defaultTeam;

  return (
    <section id="team" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 fade-in-section">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Đội ngũ của chúng tôi
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Đội ngũ đam mê đứng sau mỗi chai rượu đặc biệt, tận tâm với việc sản xuất rượu vang tự nhiên
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-lg shadow-lg overflow-hidden">
                <Skeleton className="h-80 w-full" />
                <div className="p-8 space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {displayTeam.map((member, index) => (
              <div
                key={index}
                className="bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 fade-in-section"
              >
                <div className="relative h-80">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-4">{member.role}</p>
                  <p className="text-foreground/70 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 fade-in-section">
          <div className="relative h-96 rounded-lg overflow-hidden shadow-2xl">
            <img
              src="/assets/wine-tasting.dim_1024x683.jpg"
              alt="Wine tasting experience"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
              <div className="p-8 md:p-12">
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Tham gia khám phá rượu vang
                </h3>
                <p className="text-lg text-foreground/80 max-w-2xl">
                  Hãy tham gia cùng chúng tôi trong hành trình khám phá rượu vang và trở thành người mang đuốc. Chia sẻ khoảnh khắc và câu chuyện của bạn bằng cách sử dụng hashtag cộng đồng của chúng tôi #cuocsong và #ruouvangviet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;
