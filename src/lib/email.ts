// Resend client wrapper + HTML template builder for the weekly digest.
//
// The SDK is dynamically imported on first send so it doesn't load on
// every server route — same pattern as web-push. When RESEND_API_KEY
// isn't set, `sendDigest` is a no-op (returns { ok: false, skipped: true })
// so local dev + preview deploys without secrets stay silent rather
// than crashing.

export interface DigestData {
  to: string;                  // recipient email
  name: string | null;         // recipient display name (for greeting)
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
  symptomEntriesLast7d: number;
  newBadges: string[];         // Bulgarian badge names earned this week
  appUrl: string;              // canonical site for the CTA
}

export type SendResult =
  | { ok: true }
  | { ok: false; skipped: true; reason: "no-config" }
  | { ok: false; reason: "send-failed"; message?: string };

/** Send one weekly digest email. Designed to fail soft for the cron. */
export async function sendDigest(data: DigestData): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM_EMAIL;
  if (!apiKey || !from) {
    return { ok: false, skipped: true, reason: "no-config" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const subject = digestSubject(data);
    const { error } = await resend.emails.send({
      from,
      to: data.to,
      subject,
      html: digestHtml(data),
    });
    if (error) {
      return { ok: false, reason: "send-failed", message: error.message };
    }
    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      reason: "send-failed",
      message: err instanceof Error ? err.message : "unknown",
    };
  }
}

/** Subject changes based on the most-interesting fact about the week. */
function digestSubject(d: DigestData): string {
  if (d.newBadges.length > 0) {
    return `InsulinReset · ${d.newBadges.length === 1 ? "Нова значка" : "Нови значки"} тази седмица 🏆`;
  }
  if (d.currentStreak >= 7) {
    return `InsulinReset · ${d.currentStreak} дни в ред 🔥`;
  }
  return "InsulinReset · Твоят седмичен преглед";
}

// Inline-styled HTML — email clients strip <style> and don't load
// remote CSS, so each element carries its own styles. The palette
// mirrors the app's teal/mint theme; fonts fall back to system.
function digestHtml(d: DigestData): string {
  const greeting = d.name ? `Здравей, ${escapeHtml(d.name)}` : "Здравей";
  const badgeRow =
    d.newBadges.length > 0
      ? `
      <tr>
        <td style="padding: 16px 24px; background: #E8F5F0;">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #114A42;">
            🏆 Нови значки
          </p>
          <p style="margin: 0; font-size: 14px; color: #166258;">
            ${d.newBadges.map(escapeHtml).join(" · ")}
          </p>
        </td>
      </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>InsulinReset седмичен преглед</title>
</head>
<body style="margin: 0; padding: 0; background: #F0FAF6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1a2e;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #F0FAF6; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width: 560px; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <!-- Brand bar -->
          <tr>
            <td style="background: #1B7A6E; padding: 18px 24px;">
              <span style="display: inline-block; color: #FFFFFF; font-size: 20px; font-weight: 700; letter-spacing: 0.3px;">
                InsulinReset
              </span>
            </td>
          </tr>

          <!-- Greeting + lead -->
          <tr>
            <td style="padding: 28px 24px 8px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #114A42; line-height: 1.25;">
                ${greeting} 👋
              </h1>
              <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #475569;">
                Ето как премина седмицата ти в 90-дневния протокол.
              </p>
            </td>
          </tr>

          <!-- Stats grid -->
          <tr>
            <td style="padding: 20px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 14px; background: #F0FAF6; border-radius: 12px; text-align: center;" width="33%">
                    <div style="font-size: 11px; font-weight: 600; color: #166258; text-transform: uppercase; letter-spacing: 0.5px;">Поредни дни</div>
                    <div style="margin-top: 6px; font-size: 28px; font-weight: 800; color: #114A42;">${d.currentStreak}</div>
                    <div style="margin-top: 2px; font-size: 11px; color: #64748b;">${
                      d.longestStreak > d.currentStreak
                        ? `Рекорд: ${d.longestStreak}`
                        : "Твоят рекорд"
                    }</div>
                  </td>
                  <td width="8"></td>
                  <td style="padding: 14px; background: #F0FAF6; border-radius: 12px; text-align: center;" width="33%">
                    <div style="font-size: 11px; font-weight: 600; color: #166258; text-transform: uppercase; letter-spacing: 0.5px;">Ниво</div>
                    <div style="margin-top: 6px; font-size: 28px; font-weight: 800; color: #114A42;">${d.level}</div>
                    <div style="margin-top: 2px; font-size: 11px; color: #64748b;">${d.totalXp} XP общо</div>
                  </td>
                  <td width="8"></td>
                  <td style="padding: 14px; background: #F0FAF6; border-radius: 12px; text-align: center;" width="33%">
                    <div style="font-size: 11px; font-weight: 600; color: #166258; text-transform: uppercase; letter-spacing: 0.5px;">Записи</div>
                    <div style="margin-top: 6px; font-size: 28px; font-weight: 800; color: #114A42;">${d.symptomEntriesLast7d}</div>
                    <div style="margin-top: 2px; font-size: 11px; color: #64748b;">в дневника тази седмица</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${badgeRow}

          <!-- CTA -->
          <tr>
            <td style="padding: 24px 24px 32px; text-align: center;">
              <a href="${escapeAttr(d.appUrl)}/plan"
                 style="display: inline-block; background: #1B7A6E; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 26px; border-radius: 12px;">
                Към дневния план →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px 24px; border-top: 1px solid #E8F5F0; text-align: center;">
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">
                Получаваш това писмо, защото си включил седмичен преглед в
                <a href="${escapeAttr(d.appUrl)}/settings" style="color: #1B7A6E; text-decoration: underline;">Настройки</a>.<br/>
                ⚕️ Информацията е с образователна цел и не е медицински съвет.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

// Re-exported for tests so the template doesn't drift silently.
export const _internal = { digestHtml, digestSubject, escapeHtml };
