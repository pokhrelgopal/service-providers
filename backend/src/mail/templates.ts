export function accountVerifiedEmail(name: string): {
  subject: string;
  html: string;
  text: string;
} {
  const first = name?.split(' ')[0] || 'there';
  return {
    subject: 'Your Servio provider account is verified ✅',
    text: `Hi ${first}, your Servio provider account has been verified and is now live. You can start receiving service requests.`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0b0b0f">
        <div style="display:inline-block;background:#760e28;color:#fff;font-weight:700;border-radius:12px;padding:8px 12px;font-size:18px">Servio</div>
        <h1 style="font-size:20px;margin:24px 0 8px">You're verified, ${first}! 🎉</h1>
        <p style="color:#52525b;line-height:1.6;margin:0 0 16px">
          Your provider account has been reviewed and <strong>approved</strong>. It's now live,
          so seekers can find you and send service requests.
        </p>
        <p style="color:#52525b;line-height:1.6;margin:0">
          Welcome aboard,<br/>The Servio team
        </p>
      </div>
    `,
  };
}
