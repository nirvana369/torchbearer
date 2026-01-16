import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetContacts, useAddContact, useUpdateContact, useDeleteContact, useSetHeadOffice } from '../../hooks/useQueries';
import type { ContactLocation } from '../../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ContactEditor() {
  const { data: contacts, isLoading } = useGetContacts();
  const addContactMutation = useAddContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  const setHeadOfficeMutation = useSetHeadOffice();

  const [editingContacts, setEditingContacts] = useState<ContactLocation[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (contacts) {
      setEditingContacts(contacts);
    }
  }, [contacts]);

  const handleAddContact = () => {
    const newContact: ContactLocation = {
      name: 'Torch Bearer Tasmania Head Office',
      address: '1013–1015 Tea Tree Rd, Tea Tree, TAS, Australia',
      phone: '+84 904 117 789 / +61 469 440 995',
      email: 'contact@torchbearerwine.com',
      mapUrl: 'https://maps.google.com/',
      isHeadOffice: false,
    };
    setEditingContacts([...editingContacts, newContact]);
  };

  const handleUpdateContact = (index: number, field: keyof ContactLocation, value: string | boolean) => {
    const updated = [...editingContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEditingContacts(updated);
  };

  const handleSaveContact = async (contact: ContactLocation, index: number) => {
    try {
      const originalContact = contacts?.[index];
      
      if (originalContact) {
        // Update existing contact
        await updateContactMutation.mutateAsync(contact);
        toast.success('Đã cập nhật thông tin liên hệ');
      } else {
        // Add new contact
        await addContactMutation.mutateAsync(contact);
        toast.success('Đã thêm địa điểm liên hệ mới');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu thông tin');
      console.error(error);
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      await deleteContactMutation.mutateAsync(contactToDelete);
      toast.success('Đã xóa địa điểm liên hệ');
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa');
      console.error(error);
    }
  };

  const handleSetHeadOffice = async (contactName: string) => {
    try {
      await setHeadOfficeMutation.mutateAsync(contactName);
      toast.success('Đã đặt làm trụ sở chính');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
      console.error(error);
    }
  };

  const openDeleteDialog = (contactName: string) => {
    setContactToDelete(contactName);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Địa điểm Liên hệ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Địa điểm Liên hệ (Torch Bearer Tasmania)</CardTitle>
          <CardDescription>
            Thêm, chỉnh sửa và quản lý các địa điểm liên hệ. Đánh dấu một địa điểm làm trụ sở chính.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {editingContacts.map((contact, index) => (
            <Card key={index} className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(contact.name)}
                    disabled={deleteContactMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`contact-name-${index}`}>Tên địa điểm</Label>
                  <Input
                    id={`contact-name-${index}`}
                    value={contact.name}
                    onChange={(e) => handleUpdateContact(index, 'name', e.target.value)}
                    placeholder="Torch Bearer Tasmania Head Office"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`contact-address-${index}`}>Địa chỉ</Label>
                  <Input
                    id={`contact-address-${index}`}
                    value={contact.address}
                    onChange={(e) => handleUpdateContact(index, 'address', e.target.value)}
                    placeholder="1013–1015 Tea Tree Rd, Tea Tree, TAS, Australia"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`contact-phone-${index}`}>Số điện thoại</Label>
                    <Input
                      id={`contact-phone-${index}`}
                      value={contact.phone}
                      onChange={(e) => handleUpdateContact(index, 'phone', e.target.value)}
                      placeholder="+84 904 117 789 / +61 469 440 995"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`contact-email-${index}`}>Email</Label>
                    <Input
                      id={`contact-email-${index}`}
                      type="email"
                      value={contact.email}
                      onChange={(e) => handleUpdateContact(index, 'email', e.target.value)}
                      placeholder="contact@torchbearerwine.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`contact-map-${index}`}>Link Google Maps</Label>
                  <Input
                    id={`contact-map-${index}`}
                    value={contact.mapUrl}
                    onChange={(e) => handleUpdateContact(index, 'mapUrl', e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`head-office-${index}`}
                      checked={contact.isHeadOffice}
                      onCheckedChange={() => handleSetHeadOffice(contact.name)}
                      disabled={setHeadOfficeMutation.isPending}
                    />
                    <Label htmlFor={`head-office-${index}`} className="cursor-pointer">
                      Đặt làm trụ sở chính
                    </Label>
                  </div>

                  <Button
                    onClick={() => handleSaveContact(contact, index)}
                    disabled={updateContactMutation.isPending || addContactMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Lưu
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={handleAddContact} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Thêm địa điểm liên hệ
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa địa điểm liên hệ này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
