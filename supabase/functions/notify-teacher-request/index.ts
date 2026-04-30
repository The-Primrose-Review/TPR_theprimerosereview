import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const teacherRequestHtml = (
  teacherName: string,
  studentName: string,
  teacherUrl: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Recommendation Letter Request</title>
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
                Hi ${teacherName},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                <strong>${studentName}</strong> has requested a recommendation letter from you through The Primrose Review college application platform.
              </p>

              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
                ${studentName} has shared some context about your relationship and the moments you've shared together to help you write the strongest letter possible. You can view all of this on your private page.
              </p>

              <!-- Info box -->
              <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-left:4px solid #7c3aed;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#5b21b6;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">What happens next</p>
                <ul style="margin:0;padding-left:18px;color:#4c1d95;font-size:14px;line-height:1.8;">
                  <li>Visit your private link to read ${studentName}'s background notes</li>
                  <li>Write and submit your draft directly on the page</li>
                  <li>The student's counselor will review and finalize the letter</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${teacherUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  View Request &amp; Write Letter &rarr;
                </a>
              </div>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                Your private link: <a href="${teacherUrl}" style="color:#6d28d9;">${teacherUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because a student listed you as a referee on The Primrose Review. If this was a mistake, you can safely ignore this email.
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
    const { teacherEmail, teacherName, studentName, teacherUrl } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    if (!teacherEmail || !teacherName || !studentName || !teacherUrl) {
      throw new Error("teacherEmail, teacherName, studentName, and teacherUrl are required");
    }

    const html = teacherRequestHtml(teacherName, studentName, teacherUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Primrose Review <team@primrosecrm.com>",
        to: teacherEmail,
        subject: `${studentName} has requested a recommendation letter from you — The Primrose Review`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Resend API error");
    }

    console.log(`Teacher request notification sent to ${teacherEmail} (${teacherName}), student: ${studentName}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-teacher-request error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
