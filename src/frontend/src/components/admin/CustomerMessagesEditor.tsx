import { useState } from 'react';
import { useGetCustomerMessages, useDeleteCustomerMessage } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Eye, ChevronLeft, ChevronRight, Trash } from 'lucide-react';
import type { CustomerMessage } from '../../../../declarations/backend/backend.did';

export default function CustomerMessagesEditor() {
  const { data: messagesData, isLoading } = useGetCustomerMessages();
  const deleteMutation = useDeleteCustomerMessage();

  const [currentPage, setCurrentPage] = useState(0);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<{
    id: bigint;
    message: CustomerMessage;
  } | null>(null);

  const messages = messagesData || [];
  const pageSize = 10;
  const totalPages = Math.ceil(messages.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const currentMessages = messages.slice(startIndex, endIndex);

  const handleView = (message: CustomerMessage) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);
  };

  const handleRequestDelete = (id: bigint, message: CustomerMessage) => {
    setMessageToDelete({ id, message });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMutation.mutateAsync(messageToDelete.id);
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
      if ((messages.length - 1) <= currentPage * pageSize && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý Tin nhắn </CardTitle>
        <CardDescription>
          Xem tin nhắn từ khách hàng
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Chưa có tin nhắn nào từ khách hàng
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Điện thoại</TableHead>
                    <TableHead>Tin nhắn</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMessages.map(([id, message]) => (
                    <TableRow key={id.toString()}>
                      <TableCell className="font-medium">{message.name}</TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell>{message.phone}</TableCell>
                      <TableCell>{truncateText(message.message, 50)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(message.timestamp)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(message)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRequestDelete(id, message)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage + 1} / {totalPages} (Tổng: {messages.length} tin nhắn)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết Tin nhắn</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về tin nhắn từ khách hàng
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Tên khách hàng</Label>
                  <p className="mt-1">{selectedMessage.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Email</Label>
                  <p className="mt-1">{selectedMessage.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Số điện thoại</Label>
                  <p className="mt-1">{selectedMessage.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nội dung tin nhắn</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Thời gian gửi</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(selectedMessage.timestamp)}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Xóa Tin nhắn</DialogTitle>
              <DialogDescription>
                Bạn có chắc muốn xóa tin nhắn này? Hành động không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>

            {messageToDelete && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Tên</Label>
                  <p className="mt-1">{messageToDelete.message.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nội dung</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{truncateText(messageToDelete.message.message, 200)}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setMessageToDelete(null); }}>
                Hủy
              </Button>
              <Button
                className="ml-2"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.status === 'pending'}
              >
                {deleteMutation.status === 'pending' ? 'Đang xóa...' : 'Xóa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
