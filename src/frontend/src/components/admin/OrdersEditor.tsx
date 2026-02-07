import { useState } from 'react';
import { useGetOrders, useGetTotalOrderCount, useDeleteOrder, useUpdateOrder } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Eye, ChevronLeft, ChevronRight, Trash } from 'lucide-react';
import type { Order } from '../../../../declarations/backend/backend.did';

export default function OrdersEditor() {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const { data: ordersData, isLoading } = useGetOrders(currentPage);
  const { data: totalCount } = useGetTotalOrderCount();
  const deleteOrderMutation = useDeleteOrder();
  const updateOrderMutation = useUpdateOrder();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusSelection, setStatusSelection] = useState<string>('pending');
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const orders = ordersData || [];
  const total = totalCount ? Number(totalCount) : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    // initialize the status select from the order's variant type
    const statusKey = Object.keys(order.status)[0] as string;
    setStatusSelection(statusKey);
    setViewDialogOpen(true);
  };

  const toOrderStatus = (key: string) => {
    // convert a simple string key to the OrderStatus variant object expected by the actor
    return ({ [key]: null } as unknown) as any;
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrderMutation.mutateAsync({ id: selectedOrder.id, status: toOrderStatus(statusSelection) });
      // update local UI to reflect new status
      setSelectedOrder({ ...selectedOrder, status: toOrderStatus(statusSelection) });
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const handleDelete = async (orderId: bigint) => {
    const ok = window.confirm('Xác nhận xóa đơn hàng này? Hành động không thể hoàn tác.');
    if (!ok) return;
    try {
      setDeletingId(orderId);
      await deleteOrderMutation.mutateAsync(orderId);
      // If currently viewing the deleted order, close the dialog
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
        setViewDialogOpen(false);
      }
    } catch (err) {
      console.error('Failed to delete order', err);
      // Optionally show a toast / error UI here
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
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
        <CardTitle>Quản lý Đơn hàng</CardTitle>
        <CardDescription>
          Xem các đơn hàng từ khách hàng
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Chưa có đơn hàng nào từ khách hàng
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
                    <TableHead>Sản phẩm (tổng số)</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id.toString()}>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell>{order.customerEmail}</TableCell>
                      <TableCell>{order.customerPhone}</TableCell>
                      <TableCell>
                        {order.items.length} sản phẩm
                        <div className="text-xs text-muted-foreground">
                          {order.items.slice(0, 3).map((it, idx) => (
                            <span key={idx}>{it.product.name} x{it.quantity}{idx < Math.min(2, order.items.length-1) ? ', ' : ''}</span>
                          ))}
                          {order.items.length > 3 ? '...' : ''}
                        </div>
                      </TableCell>
                      <TableCell>{Number(order.totalAmount).toLocaleString('vi-VN')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.timestamp as unknown as bigint)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(order.id)}
                            disabled={deletingId === order.id}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage + 1} / {totalPages} (Tổng: {total} đơn hàng)
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

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết Đơn hàng</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về đơn hàng từ khách hàng
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Tên khách hàng</Label>
                  <p className="mt-1">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Email</Label>
                  <p className="mt-1">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Số điện thoại</Label>
                  <p className="mt-1">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Sản phẩm</Label>
                  <div className="mt-1 space-y-1">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.product.name} x{it.quantity}</span>
                        <span className="text-muted-foreground">{Number(it.totalPrice).toLocaleString('vi-VN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Tổng tiền</Label>
                  <p className="mt-1">{Number(selectedOrder.totalAmount).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Thời gian gửi</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(selectedOrder.timestamp as unknown as bigint)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Trạng thái</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={statusSelection}
                      onChange={(e) => setStatusSelection(e.target.value)}
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={updateOrderMutation.status === 'pending'}
                    >
                      Cập nhật
                    </Button>
                  </div>
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
      </CardContent>
    </Card>
  );
}
