import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess } from '../utils/apiResponse';
import { sendContactNotificationEmail } from '../utils/email';

/**
 * POST /contact — public contact form submission.
 *
 * Gorilla-proofing is handled by the validation honey-pot (`_website`).
 * We never reply with anything that reveals processing internals; a bot
 * submission is accepted-looking but silently dropped.
 */
export const submitContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    const name = `${firstName} ${lastName}`.trim();

    // Keep an audit trail the admin can browse, INCLUDING the full message
    // (email delivery may be a silent no-op if SMTP is unconfigured, so the
    // text must never exist only in an outbound mailbox).
    await prisma.notification.create({
      data: {
        title: 'New contact message',
        message: `${subject} — from ${name} (${email})`,
        type: 'contact',
        link: '/admin',
      },
    });
    await prisma.activityLog.create({
      data: {
        action: 'CONTACT_MESSAGE',
        entity: 'Contact',
        metadata: { name, email, subject, message },
      },
    });

    // Try to also deliver to the store's monitored mailbox (fire-and-forget).
    sendContactNotificationEmail({ name, email, subject, message }).catch(() => {});

    sendSuccess(res, null, 'Message received — thank you for reaching out');
  } catch (error) { next(error); }
};