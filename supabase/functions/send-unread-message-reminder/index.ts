import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const unreadReminderHtml = (
  recipientName: string,
  senderName: string,
  unreadCount: number,
  daysSinceFirst: number,
  appUrl: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>You have unread messages</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9,#9333ea);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                The Primrose Review
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                College Application Support Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#111827;font-size:16px;">
                Hi ${recipientName},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                You have <strong>${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}</strong> from <strong>${senderName}</strong> that ${unreadCount !== 1 ? "have" : "has"} been waiting for ${daysSinceFirst} day${daysSinceFirst !== 1 ? "s" : ""}.
              </p>

              <!-- Reminder box -->
              <div style="background:#fef9c3;border:1px solid #fde047;border-left:4px solid #ca8a04;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;color:#713f12;font-size:14px;line-height:1.7;">
                  Staying in touch with your counselor helps keep your applications on track. Don't let important messages slip by!
                </p>
              </div>

              <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.7;">
                Open your inbox to read and reply to your messages.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${appUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  Open My Inbox &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this reminder because you have unread messages on The Primrose Review.<br />
                If you've already read them, you can ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      senderName,
      unreadCount,
      daysSinceFirst,
      appUrl,
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    if (!recipientEmail || !recipientName || !senderName) {
      throw new Error("recipientEmail, recipientName, and senderName are required");
    }

    const baseUrl = appUrl || "https://primrosereview.com";
    const count = unreadCount || 1;
    const days = daysSinceFirst || 3;
    const html = unreadReminderHtml(recipientName, senderName, count, days, baseUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Primrose Review <team@primrosecrm.com>",
        to: recipientEmail,
        subject: `You have ${count} unread message${count !== 1 ? "s" : ""} from ${senderName} — The Primrose Review`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Resend API error");
    }

    console.log(`Unread message reminder sent to ${recipientEmail} (${count} messages from ${senderName})`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-unread-message-reminder error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
