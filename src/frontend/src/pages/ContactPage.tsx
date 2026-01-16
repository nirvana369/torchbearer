import { useEffect } from 'react';
import { Mail, Phone, MapPin, ExternalLink, Building2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetContacts } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';

export default function ContactPage() {
  const { isFetching } = useActor();
  const { data: contacts, isLoading } = useGetContacts();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Only show full-page loading during initial actor initialization
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Địa Điểm Liên Hệ
            </h1>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Tìm chi nhánh gần bạn nhất để trải nghiệm sản phẩm và dịch vụ của chúng tôi
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : contacts && contacts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {contact.name}
                      </CardTitle>
                      {contact.isHeadOffice && (
                        <Badge variant="default" className="ml-2">
                          Trụ sở chính
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground/70">{contact.address}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-sm text-foreground/70 hover:text-primary transition-colors"
                      >
                        {contact.phone}
                      </a>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-sm text-foreground/70 hover:text-primary transition-colors"
                      >
                        {contact.email}
                      </a>
                    </div>

                    {contact.mapUrl && (
                      <a
                        href={contact.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm text-primary hover:underline mt-4"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Xem bản đồ</span>
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-foreground/70">Chưa có thông tin liên hệ</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
