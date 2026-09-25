import prisma from '../config/db';

// ============================================================
// Notification Service — in-app notifications
//
// All helpers are intentionally failure-tolerant (never throw): a notification
// write must never break the request that triggered it. Callers should treat
// them as fire-and-forget side effects.
// ============================================================

export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}

export async function notifyUser(input: NotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type ?? 'info',
        link: input.link ?? null,
      },
    });
  } catch {
    // Swallow — notifications must never break the main flow.
  }
}

/** Create the same notification for every admin (for review/order alerts). */
export async function notifyAdmins(input: Omit<NotificationInput, 'userId'>): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: input.title,
        message: input.message,
        type: input.type ?? 'info',
        link: input.link ?? null,
      })),
    });
  } catch {
    // Swallow — notifications must never break the main flow.
  }
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value);

/** Order placed — tells the customer their order number + what happens next. */
export async function notifyOrderCreated(order: {
  id: string;
  userId: string;
  orderNumber: string;
  total: number;
  currency: string;
}): Promise<void> {
  await notifyUser({
    userId: order.userId,
    title: 'Order placed',
    message: `Order ${order.orderNumber} for ${money(order.total, order.currency)} was placed successfully.`,
    type: 'order',
    link: `/dashboard/orders/${order.id}`,
  });
}

/** Payment received — order moves to PAID and gets confirmed. */
export async function notifyOrderPaid(order: {
  id: string;
  userId: string;
  orderNumber: string;
  total: number;
  currency: string;
}): Promise<void> {
  await notifyUser({
    userId: order.userId,
    title: 'Payment received',
    message: `We received your payment of ${money(order.total, order.currency)} for order ${order.orderNumber}.`,
    type: 'payment',
    link: `/dashboard/orders/${order.id}`,
  });
}

/** Order status transitioned (shipped/delivered/cancelled/returned). */
export async function notifyOrderStatus(
  order: { id: string; userId: string; orderNumber: string },
  status: string
): Promise<void> {
  await notifyUser({
    userId: order.userId,
    title: `Order ${status.replace(/_/g, ' ').toLowerCase()}`,
    message: `Order ${order.orderNumber} is now ${status.replace(/_/g, ' ').toLowerCase()}.`,
    type: 'order',
    link: `/dashboard/orders/${order.id}`,
  });
}

/** Review requires admin approval (new or re-submitted after an edit). */
export async function notifyAdminsReviewPending(review: { id: string; productId: string }): Promise<void> {
  const product = await prisma.product
    .findUnique({ where: { id: review.productId }, select: { name: true } })
    .catch(() => null);
  await notifyAdmins({
    title: 'New review pending approval',
    message: product
      ? `A new review for "${product.name}" is awaiting approval.`
      : 'A new review is awaiting approval.',
    type: 'review',
    link: '/admin/reviews',
  });
}

/** New product question submitted. */
export async function notifyAdminsQuestionAsked(question: { id: string; productId: string }): Promise<void> {
  const product = await prisma.product
    .findUnique({ where: { id: question.productId }, select: { name: true } })
    .catch(() => null);
  await notifyAdmins({
    title: 'New customer question',
    message: product
      ? `A customer asked a question about "${product.name}".`
      : 'A customer asked a new question.',
    type: 'question',
    link: '/admin/questions',
  });
}

/** Stock dropped to/under the low-stock threshold after a deduction. */
export async function notifyAdminsLowStock(product: { id: string; name: string; sku: string }): Promise<void> {
  await notifyAdmins({
    title: 'Low stock alert',
    message: `"${product.name}" (${product.sku}) has reached its low-stock threshold.`,
    type: 'stock',
    link: `/admin/products/${product.id}`,
  });
}