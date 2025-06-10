import { getResendClient } from "./resendClient";

export async function sendFarmerApprovalEmail({ to, farmName }) {
  const resend = getResendClient();
  if (!resend || !to || !farmName) return;

  await resend.emails.send({
    from: "Farm to Fork <no-reply@farm2fork.fr>",
    to,
    subject: "🎉 Votre demande a été approuvée !",
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px;">
        <h2>Bonjour,</h2>
        <p>Bonne nouvelle ! Votre demande pour la ferme <strong>${farmName}</strong> a été <span style="color: green;">approuvée</span>.</p>
        <p>Vous pouvez maintenant compléter votre fiche depuis votre tableau de bord.</p>
        <a href="https://www.farm2fork.fr/dashboard/farms" style="display: inline-block; padding: 10px 20px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 4px;">Accéder à mon dashboard</a>
        <p style="margin-top: 20px;">Merci pour votre confiance,<br>L’équipe Farm to Fork</p>
      </div>
    `,
  });
}
