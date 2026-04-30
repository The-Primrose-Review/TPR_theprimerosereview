import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const newEssayHtml = (
  counselorName: string,
  studentName: string,
  essayLabel: string,
  applicationName: string,
  deadline: string,
  appUrl: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New Essay Submitted for Review</title>
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
                Hi ${counselorName},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                <strong>${studentName}</strong> has submitted a new essay and it's waiting for your review.
              </p>

              <!-- Essay Details -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Student</span><br />
                      <span style="color:#111827;font-size:15px;font-weight:600;">${studentName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Essay</span><br />
                      <span style="color:#111827;font-size:15px;font-weight:600;">${essayLabel}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Application</span><br />
                      <span style="color:#111827;font-size:14px;">${applicationName}</span>
                    </td>
                  </tr>
                  ${deadline ? `
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Deadline</span><br />
                      <span style="color:#dc2626;font-size:14px;font-weight:600;">${deadline}</span>
                    </td>
                  </tr>` : ""}
                </table>
              </div>

              <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.7;">
                Review the essay, leave your feedback, and mark it as approved when ready.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${appUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  Review Essay &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because one of your students submitted an essay for review on The Primrose Review.
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
      counselorEmail,
      counselorName,
      studentName,
      essayLabel,
      applicationName,
      deadline,
      appUrl,
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    if (!counselorEmail || !counselorName || !studentName || !essayLabel) {
      throw new Error("counselorEmail, counselorName, studentName, and essayLabel are required");
    }

    const baseUrl = appUrl || "https://primrosereview.com";
    const html = newEssayHtml(
      counselorName,
      studentName,
      essayLabel,
      applicationName || "Application",
      deadline || "",
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
        to: counselorEmail,
        subject: `${studentName} submitted a new essay for review — The Primrose Review`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Resend API error");
    }

    console.log(`New essay notification sent to ${counselorEmail} for student: ${studentName}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-new-essay-notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
