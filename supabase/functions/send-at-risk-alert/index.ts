import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email sent to the student themselves
const studentAlertHtml = (
  studentName: string,
  counselorName: string,
  riskReasons: string[],
  appUrl: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Action Needed — Your Application Progress</title>
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
                Your counselor <strong>${counselorName}</strong> has flagged your account as needing attention. There are some areas that require action to keep your college applications on track.
              </p>

              ${riskReasons.length > 0 ? `
              <!-- Risk reasons -->
              <div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 12px;color:#991b1b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Areas needing attention</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  ${riskReasons.map((reason) => `
                  <tr>
                    <td style="padding:4px 0;">
                      <span style="color:#dc2626;font-weight:700;margin-right:10px;">&#9888;</span>
                      <span style="color:#7f1d1d;font-size:14px;">${reason}</span>
                    </td>
                  </tr>`).join("")}
                </table>
              </div>
              ` : ""}

              <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.7;">
                Please log in and take action as soon as possible. Your counselor is here to help — reach out to them directly through the messaging feature if you have questions.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${appUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  Go to My Dashboard &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This alert was sent by your counselor on The Primrose Review.<br />
                If you believe this was sent in error, please contact your counselor directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// Email sent to the parent
const parentAlertHtml = (
  parentName: string,
  studentName: string,
  counselorName: string,
  riskReasons: string[],
  appUrl: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Important Update About ${studentName}'s Applications</title>
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
                Hi ${parentName},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                We want to keep you informed. <strong>${studentName}</strong>'s counselor, <strong>${counselorName}</strong>, has flagged some areas in ${studentName}'s college application progress that need attention.
              </p>

              ${riskReasons.length > 0 ? `
              <!-- Risk reasons -->
              <div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 12px;color:#991b1b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Areas flagged by counselor</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  ${riskReasons.map((reason) => `
                  <tr>
                    <td style="padding:4px 0;">
                      <span style="color:#dc2626;font-weight:700;margin-right:10px;">&#9888;</span>
                      <span style="color:#7f1d1d;font-size:14px;">${reason}</span>
                    </td>
                  </tr>`).join("")}
                </table>
              </div>
              ` : ""}

              <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.7;">
                We encourage you to speak with ${studentName} and remind them to log in and take action. You can also view their progress in the parent portal.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${appUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  View ${studentName}'s Progress &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because you are linked as a parent/guardian on The Primrose Review.<br />
                If you believe this was sent in error, please contact ${counselorName} directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// Email sent to the counselor as a confirmation/log
const counselorAlertHtml = (
  counselorName: string,
  studentName: string,
  riskReasons: string[],
  appUrl: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>At-Risk Alert Sent for ${studentName}</title>
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
                This is a confirmation that an at-risk alert has been sent to <strong>${studentName}</strong> and their parent/guardian.
              </p>

              ${riskReasons.length > 0 ? `
              <!-- Risk reasons -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 12px;color:#6b7280;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Flagged reasons sent in alert</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  ${riskReasons.map((reason) => `
                  <tr>
                    <td style="padding:4px 0;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">${reason}</span>
                    </td>
                  </tr>`).join("")}
                </table>
              </div>
              ` : ""}
              
              <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.7;">
                Monitor ${studentName}'s progress from your dashboard and follow up directly if needed.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${appUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  View ${studentName}'s Profile &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This confirmation was sent to you as the counselor who triggered the at-risk alert on The Primrose Review.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

async function sendEmail(
  resendKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "The Primrose Review <team@primrosecrm.com>",
      to: to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Resend API error");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      studentEmail,
      studentName,
      parentEmail,
      parentName,
      counselorEmail,
      counselorName,
      riskReasons,
      appUrl,
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    if (!studentEmail || !studentName || !counselorName) {
      throw new Error("studentEmail, studentName, and counselorName are required");
    }

    const baseUrl = appUrl || "https://primrosereview.com";
    const reasons: string[] = riskReasons || [];

    const sends: Promise<void>[] = [];

    // Always send to student
    sends.push(
      sendEmail(
        RESEND_API_KEY,
        studentEmail,
        `Action needed on your college applications — The Primrose Review`,
        studentAlertHtml(studentName, counselorName, reasons, baseUrl),
      ),
    );

    // Send to parent if provided
    if (parentEmail && parentName) {
      sends.push(
        sendEmail(
          RESEND_API_KEY,
          parentEmail,
          `Important update about ${studentName}'s applications — The Primrose Review`,
          parentAlertHtml(parentName, studentName, counselorName, reasons, baseUrl),
        ),
      );
    }

    // Send confirmation to counselor if provided
    if (counselorEmail) {
      sends.push(
        sendEmail(
          RESEND_API_KEY,
          counselorEmail,
          `At-risk alert sent for ${studentName} — The Primrose Review`,
          counselorAlertHtml(counselorName, studentName, reasons, baseUrl),
        ),
      );
    }

    await Promise.all(sends);

    const recipients = [studentEmail, parentEmail, counselorEmail].filter(Boolean);
    console.log(`At-risk alert sent for ${studentName} to: ${recipients.join(", ")}`);

    return new Response(JSON.stringify({ success: true, recipientCount: sends.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-at-risk-alert error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
