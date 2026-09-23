'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiPackage, FiChevronDown, FiMapPin, FiXCircle, FiArrowRight } from 'react-icons/fi';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { fetchOrders, cancelOrder } from '@/services/orders';
import type { Order } from '@/types';

// ============================================================
// My Orders — order history with expandable detail + cancel
// ============================================================

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    DELIVERED: 'bg-sage-light/50 text-sage-dark',
    SHIPPED: 'bg-navy-light/10 text-navy-light',
    PROCESSING: 'bg-walnut/10 text-walnut',
    CONFIRMED: 'bg-sage-light/50 text-sage-dark',
    PENDING: 'bg-walnut/10 text-walnut',
    CANCELLED: 'bg-red-100 text-red-700',
    RETURNED: 'bg-slate/10 text-slate',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${colorMap[status] || 'bg-slate/10 text-slate'}`}>
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    PAID: 'bg-sage-light/50 text-sage-dark',
    PENDING: 'bg-walnut/10 text-walnut',
    PROCESSING: 'bg-navy-light/10 text-navy-light',
    FAILED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate/10 text-slate',
    AWAITING_VERIFICATION: 'bg-walnut/10 text-walnut',
    REFUNDED: 'bg-slate/10 text-slate',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${colorMap[status] || 'bg-slate/10 text-slate'}`}>
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  STRIPE: 'Card (Stripe)',
  PAYPAL: 'PayPal',
  BANK_TRANSFER: 'Bank Transfer',
  PAYONEER: 'Payoneer',
  card: 'Card',
};

function paymentMethodLabel(method?: string): string {
  if (!method) return 'Payment';
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function orderImage(order: Order): string | null {
  const item = order.items?.find(Boolean);
  if (!item) return null;

  const productImages = item.product?.images;
  if (Array.isArray(productImages) && productImages.length > 0) {
    const first = productImages[0];
    if (typeof first === 'string') return first;
    if (typeof first?.url === 'string' && first.url) return first.url;
  }

  const snapshot = item.productSnapshot as Record<string, unknown> | undefined;
  const snapshotImages = snapshot?.images;
  if (Array.isArray(snapshotImages) && snapshotImages.length > 0) {
    const first = snapshotImages[0] as unknown;
    if (typeof first === 'string') return first;
    const url = (first as { url?: unknown } | undefined)?.url;
    if (typeof url === 'string' && url) return url;
  }
  return null;
}

function itemName(item: Order['items'][number] | undefined): string {
  if (!item) return 'Order item';
  if (item.product?.name) return item.product.name;
  const snapshot = item.productSnapshot as Record<string, unknown> | undefined;
  return typeof snapshot?.name === 'string' ? snapshot.name : 'Product';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const applyResult = (res: { data: Order[]; pagination: { total: number; totalPages: number; page: number } }) => {
    setOrders(Array.isArray(res.data) ? res.data : []);
    setTotalOrders(res.pagination?.total ?? 0);
    setTotalPages(res.pagination?.totalPages ?? 1);
    setPage(res.pagination?.page ?? 1);
    setExpandedId(null);
  };

  const applyError = () => {
    setOrders([]);
    setTotalOrders(0);
    setTotalPages(1);
    setPage(1);
    setExpandedId(null);
  };

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      applyResult(await fetchOrders({ page: String(targetPage), limit: String(PAGE_SIZE), sort: '-createdAt' }));
    } catch {
      applyError();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchOrders({ page: '1', limit: String(PAGE_SIZE), sort: '-createdAt' })
      .then((res) => {
        if (!active) return;
        applyResult(res);
      })
      .catch(() => {
        if (active) applyError();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCancel = async (order: Order) => {
    setCancellingId(order.id);
    try {
      await cancelOrder(order.id);
      toast.success(`Order ${order.orderNumber} cancelled`);
      await load(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (order: Order) =>
    order.status === 'PENDING' &&
    (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED' || order.paymentStatus === 'AWAITING_VERIFICATION');

  return (
    <DashboardLayout title="My Orders" subtitle="View and track your orders.">
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-sage-light/30 bg-white" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-sage-light/30 bg-white p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40 text-sage-dark">
            <FiPackage className="h-7 w-7" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-light text-navy">No orders yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate">
            When you place an order, it will appear here with live tracking and delivery updates.
          </p>
          <Button href="/shop" className="mt-8" variant="walnut" size="md" rightIcon={<FiArrowRight className="h-4 w-4" />}>
            Explore the Collection
          </Button>
        </div>
      ) : (
        <>
          {totalOrders > 0 && (
            <p className="text-sm text-slate">
              Showing {orders.length} of {totalOrders} order{totalOrders === 1 ? '' : 's'}
            </p>
          )}
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              const img = orderImage(order);
              return (
                <div key={order.id} className="overflow-hidden rounded-2xl border border-sage-light/30 bg-white">
                  {/* Summary row */}
                  <div className="flex flex-wrap items-center gap-4 px-6 py-5">
                    {img && (
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-cream/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={itemName(order.items?.[0]) || 'Order item'} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-navy">#{order.orderNumber}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {order.items?.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-navy">{formatPrice(order.total)}</p>
                      <PaymentBadge status={order.paymentStatus} />
                      <p className="mt-0.5 text-[11px] text-slate">{paymentMethodLabel(order.paymentMethod)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Hide order details' : 'Show order details'}
                      className="rounded-full p-2 text-slate transition-colors hover:bg-sage-light/30 hover:text-sage-dark"
                    >
                      <FiChevronDown className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden border-t border-sage-light/30"
                      >
                        <div className="px-6 py-5">
                          {/* Items */}
                          <div className="divide-y divide-sage-light/20">
                            {order.items?.map((item) => (
                              <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-navy">{itemName(item)}</p>
                                  <p className="text-xs text-slate">
                                    Qty {item.quantity} × {formatPrice(item.unitPrice)}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-navy">{formatPrice(item.totalPrice)}</p>
                              </div>
                            ))}
                          </div>

                          {/* Totals */}
                          <div className="mt-4 space-y-1.5 border-t border-sage-light/30 pt-4 text-sm">
                            <div className="flex justify-between text-slate">
                              <span>Subtotal</span>
                              <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate">
                              <span>Shipping</span>
                              <span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span>
                            </div>
                            <div className="flex justify-between text-slate">
                              <span>Tax</span>
                              <span>{formatPrice(order.tax)}</span>
                            </div>
                            {order.discount > 0 && (
                              <div className="flex justify-between text-walnut">
                                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                                <span>−{formatPrice(order.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 text-base font-bold text-navy">
                              <span>Total</span>
                              <span>{formatPrice(order.total)}</span>
                            </div>
                          </div>

                          {/* Awaiting manual payment verification */}
                          {order.paymentStatus === 'AWAITING_VERIFICATION' && (
                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-walnut/20 bg-walnut/5 p-4 text-sm text-walnut">
                              <FiXCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-navy">Payment awaiting verification</p>
                                <p className="mt-1 text-xs leading-relaxed text-slate">
                                  Please complete your <span className="font-medium text-navy">{paymentMethodLabel(order.paymentMethod)}</span>{' '}
                                  payment using reference{' '}
                                  <span className="font-mono font-medium text-navy">{order.paymentReference || order.orderNumber}</span>.
                                  Your order will be confirmed once we verify the payment.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Shipping address */}
                          {order.shippingAddress && (
                            <div className="mt-4 flex items-start gap-2 rounded-xl bg-cream/40 p-4 text-sm text-slate">
                              <FiMapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                              <div>
                                <p className="font-medium text-navy">{order.shippingAddress.fullName}</p>
                                <p>
                                  {order.shippingAddress.line1}
                                  {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''},{' '}
                                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip},{' '}
                                  {order.shippingAddress.country}
                                </p>
                                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                            {canCancel(order) ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                isLoading={cancellingId === order.id}
                                onClick={() => handleCancel(order)}
                                leftIcon={<FiXCircle className="h-4 w-4" />}
                              >
                                Cancel Order
                              </Button>
                            ) : (
                              <span className="text-xs text-slate">
                                {order.status === 'CANCELLED' ? 'This order was cancelled.' : 'This order can no longer be cancelled.'}
                              </span>
                            )}
                            {order.notes && <span className="text-xs text-slate">Note: {order.notes}</span>}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
              >
                Previous
              </Button>
              <span className="px-3 text-sm text-slate">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => load(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}