import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const inviteHtml = (name: string, signupLink: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to The Primrose Review</title>
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
                Hi ${name},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                Welcome to <strong>The Primrose Review</strong>, your school's new platform for college applications, essays, and admissions support.
              </p>

              <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.7;">
                Applying to university can feel overwhelming at times. The goal of this platform is to make the process clearer, more organized, and much less stressful.
              </p>

              <p style="margin:0 0 12px;color:#111827;font-size:15px;font-weight:600;">
                Inside your dashboard, you can:
              </p>

              <!-- Feature list -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Track applications, deadlines, and progress</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Brainstorm and strengthen your personal statement</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Submit essays for counselor feedback</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Request recommendation letters</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Explore universities that fit your profile</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Get support throughout the admissions journey</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Important note -->
              <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;color:#4c1d95;font-size:14px;line-height:1.6;">
                  <strong>One important thing:</strong> This platform is designed to help you develop your own voice, not generate generic AI applications. Think of it as a place to test ideas, improve your storytelling, and get structured support while keeping your application authentic and personal.
                </p>
              </div>

              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.7;">
                Your counselors are already connected to the platform, so you can begin using it right away.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${signupLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  Sign up to the platform here &rarr;
                </a>
              </div>

              <p style="margin:0;color:#374151;font-size:16px;line-height:1.7;">
                Good luck!! we're excited to be part of your journey.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:600;">The Primrose Review Team</p>
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because your school has joined The Primrose Review platform.
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
    const { recipients, referralLink } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("recipients must be a non-empty array");
    }
    if (!referralLink) throw new Error("referralLink is required");

    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const recipient of recipients) {
      const { email, name } = recipient;
      if (!email) continue;

      const displayName = name?.trim() || email.split("@")[0];

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "The Primrose Review <team@primrosecrm.com>",
          to: email,
          subject: "You're invited to The Primrose Review — Sign up now",
          html: inviteHtml(displayName, referralLink),
        }),
      });

      if (res.ok) {
        results.sent++;
      } else {
        const err = await res.json();
        results.failed++;
        results.errors.push(`${email}: ${err.message || "unknown error"}`);
      }
    }

    console.log(`Bulk invite: ${results.sent} sent, ${results.failed} failed`);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-bulk-invite error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
