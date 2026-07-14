import { getEmailSettings, parseAdminEmails, sendMail, type EmailSettingsShape } from "./mailService";
import {
  newReservationAdminEmail,
  reservationApprovedCustomerEmail,
  reservationRejectedCustomerEmail,
  paymentSuccessAdminEmail,
  paymentSuccessCustomerEmail,
  paymentFailedAdminEmail,
  paymentFailedCustomerEmail,
  reservationCancelledEmail,
  type ReservationEmailData,
} from "../utils/emailTemplates";

// Controller'ların ilettiği rezervasyon şekli (user + villa dahil).
interface ReservationLike {
  reservationCode: string;
  checkIn: Date;
  checkOut: Date;
  nightCount: number;
  guestCount: number;
  totalPrice: unknown; // Prisma Decimal
  displayCurrency?: string;
  paymentStatus: string;
  createdAt?: Date;
  user: { fullName: string; email: string; phone: string };
  villa: { name: string };
}

function toData(r: ReservationLike): ReservationEmailData {
  return {
    reservationCode: r.reservationCode,
    guestName: r.user.fullName,
    guestPhone: r.user.phone,
    guestEmail: r.user.email,
    villaName: r.villa.name,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nightCount: r.nightCount,
    guestCount: r.guestCount,
    totalPrice: Number(r.totalPrice),
    displayCurrency: r.displayCurrency,
    paymentStatus: r.paymentStatus,
    createdAt: r.createdAt,
  };
}

function adminList(s: EmailSettingsShape): string[] {
  return parseAdminEmails(s.adminEmails);
}

// Tüm bildirimler asenkron (fire-and-forget) — akışı bloke etmez.
export function notifyNewReservation(r: ReservationLike): void {
  void (async () => {
    const s = await getEmailSettings();
    if (!s.notifyNewReservation) return;
    const admins = adminList(s);
    if (admins.length === 0) return;
    const m = newReservationAdminEmail(toData(r));
    await sendMail({ to: admins, subject: m.subject, html: m.html, text: m.text, type: "NEW_RESERVATION" });
  })();
}

export function notifyApproved(r: ReservationLike): void {
  void (async () => {
    const s = await getEmailSettings();
    if (!s.notifyApproved) return;
    const m = reservationApprovedCustomerEmail(toData(r));
    await sendMail({ to: r.user.email, subject: m.subject, html: m.html, text: m.text, type: "APPROVED" });
  })();
}

export function notifyRejected(r: ReservationLike): void {
  void (async () => {
    const s = await getEmailSettings();
    if (!s.notifyRejected) return;
    const m = reservationRejectedCustomerEmail(toData(r));
    await sendMail({ to: r.user.email, subject: m.subject, html: m.html, text: m.text, type: "REJECTED" });
  })();
}

export function notifyPaymentSuccess(r: ReservationLike): void {
  void (async () => {
    const s = await getEmailSettings();
    if (!s.notifyPaymentSuccess) return;
    const d = toData(r);
    const cust = paymentSuccessCustomerEmail(d);
    await sendMail({ to: r.user.email, subject: cust.subject, html: cust.html, text: cust.text, type: "PAYMENT_SUCCESS" });
    const admins = adminList(s);
    if (admins.length) {
      const adm = paymentSuccessAdminEmail(d);
      await sendMail({ to: admins, subject: adm.subject, html: adm.html, text: adm.text, type: "PAYMENT_SUCCESS" });
    }
  })();
}

export function notifyPaymentFailed(r: ReservationLike): void {
  void (async () => {
    const s = await getEmailSettings();
    if (!s.notifyPaymentFailed) return;
    const d = toData(r);
    const cust = paymentFailedCustomerEmail(d);
    await sendMail({ to: r.user.email, subject: cust.subject, html: cust.html, text: cust.text, type: "PAYMENT_FAILED" });
    const admins = adminList(s);
    if (admins.length) {
      const adm = paymentFailedAdminEmail(d);
      await sendMail({ to: admins, subject: adm.subject, html: adm.html, text: adm.text, type: "PAYMENT_FAILED" });
    }
  })();
}

export function notifyCancelled(r: ReservationLike): void {
  void (async () => {
    const s = await getEmailSettings();
    if (!s.notifyCancelled) return;
    const d = toData(r);
    const cust = reservationCancelledEmail(d, false);
    await sendMail({ to: r.user.email, subject: cust.subject, html: cust.html, text: cust.text, type: "CANCELLED" });
    const admins = adminList(s);
    if (admins.length) {
      const adm = reservationCancelledEmail(d, true);
      await sendMail({ to: admins, subject: adm.subject, html: adm.html, text: adm.text, type: "CANCELLED" });
    }
  })();
}
