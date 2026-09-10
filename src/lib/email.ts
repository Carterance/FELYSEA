import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? "Notre rituel <notifications@example.com>";

/**
 * Toutes les notifications sont volontairement discrètes : jamais de
 * contenu intime dans le sujet ou l'aperçu, pour rester adapté à un écran
 * verrouillé partagé ou visible par d'autres.
 */
export async function sendReminderEmail(to: string, name: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY manquant — email de rappel non envoyé (dev only)");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Votre moment à deux approche ❤️",
    html: `<p>Bonjour ${name},</p><p>Votre moment à deux approche cette semaine. Prenez un instant pour répondre à votre questionnaire.</p>`,
  });
}

export async function sendDayOfEmail(to: string, name: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY manquant — email jour J non envoyé (dev only)");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Ce soir, c'est votre soirée.",
    html: `<p>Bonjour ${name},</p><p>Votre rituel de la semaine, c'est ce soir.</p>`,
  });
}

export async function sendFollowUpEmail(to: string, name: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY manquant — email de suivi non envoyé (dev only)");
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Comment s'est passée votre soirée ?",
    html: `<p>Bonjour ${name},</p><p>Prenez un instant pour noter comment s'est passé votre moment à deux.</p>`,
  });
}
