import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const feedbackHtml = (
  studentName: string,
  counselorName: string,
  essayLabel: string,
  applicationName: string,
  personalMessage: string,
  appUrl: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Essay Feedback from Your Counselor</title>
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
                Hi ${studentName},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                Your counselor <strong>${counselorName}</strong> has reviewed your essay and left feedback for you.
              </p>

              <!-- Essay Info -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Essay</p>
                <p style="margin:0 0 4px;color:#111827;font-size:15px;font-weight:600;">${essayLabel}</p>
                <p style="margin:0;color:#6b7280;font-size:13px;">${applicationName}</p>
              </div>

              ${personalMessage ? `
              <!-- Personal Message -->
              <div style="background:#ede9fe;border:1px solid #c4b5fd;border-left:4px solid #7c3aed;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 6px;color:#4c1d95;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Message from ${counselorName}</p>
                <p style="margin:0;color:#4c1d95;font-size:14px;line-height:1.7;">${personalMessage}</p>
              </div>
              ` : ""}

              <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.7;">
                Log in to your dashboard to view the full feedback, make revisions, and resubmit.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${appUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  View My Feedback &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because your counselor submitted feedback on one of your essays.<br />
                Log in to The Primrose Review to review it.
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
      studentEmail,
      studentName,
      counselorName,
      essayLabel,
      applicationName,
      personalMessage,
      appUrl,
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    if (!studentEmail || !studentName || !counselorName || !essayLabel) {
      throw new Error("studentEmail, studentName, counselorName, and essayLabel are required");
    }

    const baseUrl = appUrl || "https://primrosereview.com";
    const html = feedbackHtml(
      studentName,
      counselorName,
      essayLabel,
      applicationName || "Your Application",
      personalMessage || "",
      baseUrl,
    );

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Primrose Review <team@primrosecrm.com>",
        to: studentEmail,
        subject: `${counselorName} left feedback on your essay — The Primrose Review`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Resend API error");
    }

    console.log(`Feedback email sent to ${studentEmail} for essay: ${essayLabel}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-counselor-feedback error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
