import { useState } from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGetHeadOfficeContact, useSubmitCustomerMessage } from '../hooks/useQueries';
import { toast } from 'sonner';

const Contact = () => {
  const { data: headOffice, isLoading } = useGetHeadOfficeContact();
  const submitMessage = useSubmitCustomerMessage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const address = headOffice?.address || '1013–1015 Tea Tree Rd, Tea Tree, TAS, Australia';
  const phone = headOffice?.phone || '+84 904 117 789 / +61 469 440 995';
  const email = headOffice?.email || 'contact@torchbearerwine.com';
  const website = 'www.torchbearerwine.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      await submitMessage.mutateAsync({
        id: BigInt(0), // Will be set by backend
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        timestamp: BigInt(Date.now() * 1000000), // Convert to nanoseconds
      });

      toast.success('Gửi tin nhắn thành công! Chúng tôi sẽ liên hệ với bạn sớm.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      toast.error('Lỗi khi gửi tin nhắn. Vui lòng thử lại.');
      console.error(error);
    }
  };

  return (
    <section id="contact" className="py-20 bg-muted/30 fade-in-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Liên Hệ Với Chúng Tôi
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Hãy để lại thông tin, chúng tôi sẽ liên hệ với bạn sớm nhất
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="space-y-8">
            {isLoading ? (
              <>
                <div className="h-20 bg-muted animate-pulse rounded" />
                <div className="h-20 bg-muted animate-pulse rounded" />
                <div className="h-20 bg-muted animate-pulse rounded" />
                <div className="h-20 bg-muted animate-pulse rounded" />
              </>
            ) : (
              <>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Địa chỉ</h3>
                    <p className="text-foreground/70">{address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Điện thoại</h3>
                    <p className="text-foreground/70">{phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Email</h3>
                    <p className="text-foreground/70">{email}</p>
                    <p className="text-foreground/70 text-sm mt-1">sales@qbnholdings.com</p>
                    <p className="text-foreground/70 text-sm">saigon@torchbearerwine.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Website</h3>
                    <a 
                      href={`https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {website}
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-background p-8 rounded-lg shadow-lg">
            <div>
              <Input
                type="text"
                placeholder="Họ và tên *"
                className="w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email *"
                className="w-full"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Input
                type="tel"
                placeholder="Số điện thoại"
                className="w-full"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Textarea
                placeholder="Nội dung tin nhắn *"
                className="w-full min-h-[150px]"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={submitMessage.isPending}
            >
              {submitMessage.isPending ? 'Đang gửi...' : 'Gửi tin nhắn'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
