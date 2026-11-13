'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import adminApi from '@/services/admin';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { OrderDetail } from '@/types/admin';
import { ORDER_TRANSITIONS, isOrderCancellable, OrderStatusValue } from '@/constants/order';
import Image from 'next/image';

const statusColors: Record<string, string> = {
  PENDING: 'bg-walnut/10 text-walnut', CONFIRMED: 'bg-navy-light/10 text-navy-light', PROCESSING: 'bg-navy/10 text-navy',
  SHIPPED: 'bg-sage-light/50 text-sage-dark', DELIVERED: 'bg-sage/20 text-sage-dark', CANCELLED: 'bg-red-100 text-red-700', RETURNED: 'bg-red-50 text-red-600',
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [verifyDialog, setVerifyDialog] = useState<'PAID' | 'FAILED' | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!params.id) return;
    try {
      const o = await adminApi.getOrder(params.id as string);
      setOrder(o); setTrackingNumber(o.trackingNumber || ''); setNotes(o.internalNotes || '');
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to load order'); } finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { void Promise.resolve().then(loadOrder); }, [loadOrder]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(order.id, { status });
      toast.success(`Order status updated to ${status}`);
      await loadOrder();
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to update order status'); } finally { setUpdating(false); }
  };

  const verifyPayment = async (status: 'PAID' | 'FAILED') => {
    if (!order) return;
    setUpdating(true);
    try {
      await adminApi.verifyOrderPayment(order.id, status);
      toast.success(status === 'PAID' ? 'Payment verified as paid' : 'Payment marked as failed');
      await loadOrder();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to verify payment');
    } finally {
      setUpdating(false);
      setVerifyDialog(null);
    }
  };

  const saveTracking = async () => {
    if (!order) return;
    setUpdating(true);
    try { await adminApi.updateOrderStatus(order.id, { trackingNumber, notes }); toast.success('Tracking updated'); setOrder({ ...order, trackingNumber, internalNotes: notes } as OrderDetail); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to update tracking info'); } finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!order) return;
    setDeleting(true);
    try {
      await adminApi.deleteOrder(order.id);
      toast.success('Order deleted');
      router.push('/admin/orders');
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to delete order'); } finally { setDeleting(false); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (!order) return <div className="text-center py-16 text-sm text-slate">Order not found</div>;

  const isManualPayment = order.paymentMethod === 'BANK_TRANSFER' || order.paymentMethod === 'PAYONEER';
  const canVerifyPayment = isManualPayment && ['AWAITING_VERIFICATION', 'PENDING', 'PROCESSING', 'FAILED'].includes(order.paymentStatus);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate hover:text-navy mb-1">&larr; Back to orders</button>
          <h1 className="text-2xl font-display font-semibold text-navy">{order.orderNumber}</h1>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] || ''}`}>{order.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Order items */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <h2 className="text-sm font-semibold text-navy mb-4">Items</h2>
            <div className="divide-y divide-sage-light/20">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-sage-light/20 overflow-hidden">
                    {item.product?.images?.[0] && (
                      <Image
                        src={resolveAssetUrl(typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0]?.url)}
                        alt=""
                        fill
                        unoptimized
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{String(item.product?.name ?? item.productSnapshot?.name ?? 'Product')}</p>
                    {item.variant && <p className="text-xs text-slate">{item.variant.color} / {item.variant.size}</p>}
                    <p className="text-xs text-slate">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-medium text-navy">{formatPrice(item.totalPrice)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-sage-light/20 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate">Subtotal</span><span className="text-navy">{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate">Shipping</span><span className="text-navy">{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate">Tax</span><span className="text-navy">{formatPrice(order.tax)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate">Discount</span><span className="text-red-600">-{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between text-sm font-semibold border-t border-sage-light/20 pt-2"><span className="text-navy">Total</span><span className="text-navy">{formatPrice(order.total)}</span></div>
            </div>
          </div>

          {/* Update status */}
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <h2 className="text-sm font-semibold text-navy mb-1">Update Status</h2>
            <p className="mb-4 text-xs text-slate">Move the order forward through allowed transitions only.</p>
            {(ORDER_TRANSITIONS[order.status as OrderStatusValue] || []).length === 0 ? (
              <p className="text-sm text-slate">No further status changes are allowed for this order.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(ORDER_TRANSITIONS[order.status as OrderStatusValue] || []).map(s => {
                  let disabled = updating;
                  if (s === 'CANCELLED' && !isOrderCancellable(order.paymentStatus)) disabled = true;
                  return (
                    <button key={s} onClick={() => updateStatus(s)} disabled={disabled}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${order.status === s ? 'bg-navy text-ivory' : 'border border-sage-light/40 text-slate hover:bg-sage-light/20 hover:text-navy'} disabled:opacity-40 disabled:cursor-not-allowed`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tracking */}
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <h2 className="text-sm font-semibold text-navy mb-4">Tracking & Notes</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">Tracking Number</label>
                <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Enter tracking number"
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate">Internal Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Private notes about this order"
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
              <button onClick={saveTracking} disabled={updating}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-ivory hover:bg-navy-light disabled:opacity-50">
                {updating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">Customer</h2>
            <p className="text-sm font-medium text-navy">{order.user?.name}</p>
            <p className="text-xs text-slate">{order.user?.email}</p>
            {order.user?.phone && <p className="text-xs text-slate mt-1">{order.user.phone}</p>}
          </div>

          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">Shipping Address</h2>
            {order.shippingAddress ? (
              <div className="text-sm text-slate space-y-0.5">
                <p className="font-medium text-navy">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            ) : <p className="text-sm text-slate">No shipping address</p>}
          </div>

          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate">Method</span><span className="text-navy">{order.paymentMethod || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate">Status</span><span className={`font-medium ${order.paymentStatus === 'PAID' ? 'text-sage-dark' : order.paymentStatus === 'AWAITING_VERIFICATION' ? 'text-walnut' : 'text-slate'}`}>{order.paymentStatus}</span></div>
              {order.paymentReference && <div className="flex justify-between"><span className="text-slate">Reference</span><span className="font-mono text-xs text-navy">{order.paymentReference}</span></div>}
              {order.paypalOrderId && <div className="flex justify-between"><span className="text-slate">PayPal Order</span><span className="font-mono text-xs text-navy">{order.paypalOrderId}</span></div>}
              {order.paypalCaptureId && <div className="flex justify-between"><span className="text-slate">Capture ID</span><span className="font-mono text-xs text-navy">{order.paypalCaptureId}</span></div>}
              {order.paymentVerifiedAt && (
                <div className="border-t border-sage-light/20 pt-2 text-xs text-slate">
                  Verified {new Date(order.paymentVerifiedAt).toLocaleString()}
                  {order.verifiedByUser?.name && <span> by {order.verifiedByUser.name}</span>}
                </div>
              )}
            </div>

            {canVerifyPayment && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setVerifyDialog('PAID')}
                  disabled={updating}
                  className="rounded-lg bg-sage-dark px-3 py-2 text-xs font-medium text-white hover:bg-sage disabled:opacity-50"
                >
                  Verify Payment
                </button>
                <button
                  onClick={() => setVerifyDialog('FAILED')}
                  disabled={updating}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Mark as Failed
                </button>
              </div>
            )}
          </div>

          {order.couponCode && (
            <div className="rounded-xl border border-sage-light/30 bg-white p-5">
              <h2 className="text-sm font-semibold text-navy mb-2">Coupon</h2>
              <p className="text-sm text-navy font-mono">{order.couponCode}</p>
            </div>
          )}

          <div className="rounded-xl border border-red-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-navy mb-3 text-red-700">Danger Zone</h2>
            <p className="mb-3 text-xs text-slate">Permanently delete this order. Paid orders cannot be deleted.</p>
            <button
              onClick={() => setDeleteDialog(true)}
              disabled={order.paymentStatus === 'PAID'}
              className="rounded-lg border border-red-300 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete Order
            </button>
          </div>
        </div>
      </div>

      {/* Verify payment confirmation dialog */}
      <ConfirmDialog
        open={!!verifyDialog}
        title={verifyDialog === 'PAID' ? 'Verify this payment?' : 'Mark payment as failed?'}
        message={verifyDialog === 'PAID'
          ? 'Confirm that the manual payment has been received. The order will be marked as paid.'
          : 'This will mark the order payment as failed. The order will not be fulfilled.'}
        confirmLabel={verifyDialog === 'PAID' ? 'Verify Payment' : 'Mark as Failed'}
        loading={updating}
        destructive={verifyDialog === 'FAILED'}
        onConfirm={() => verifyDialog && verifyPayment(verifyDialog)}
        onCancel={() => setVerifyDialog(null)}
      />

      <ConfirmDialog
        open={deleteDialog}
        title="Delete Order"
        message={`Are you sure you want to permanently delete order ${order.orderNumber}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(false)}
      />
    </div>
  );
}
