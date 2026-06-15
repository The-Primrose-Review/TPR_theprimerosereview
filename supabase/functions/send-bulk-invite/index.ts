import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SIGNUP_URL = "https://www.primrosecrm.com/signup";

const inviteHtml = (_name: string, _signupLink: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to the Parent Portal - The Primrose Review</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9,#9333ea);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                Welcome to the Parent Portal
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                The Primrose Review &mdash; in partnership with BISW
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
                Dear Parents,
              </p>

              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
                We are delighted to introduce ourselves and welcome you to the Parent Portal. Through a strategic collaboration between BISW and The Primrose Review, we are working closely with <strong>Dr. Neela Choudhury, Head of Secondary,</strong> and <strong>Mr. Robert Ramey,</strong> your college counselor, to provide students and families with a more structured, transparent, and supportive university guidance experience. The Primrose Review is an admissions platform designed to help students navigate every stage of the university application journey, while ensuring that parents, counselors, and students remain aligned throughout the process.
              </p>

              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
                You can access the Parent Portal using the details provided below. Over the coming weeks, the portal will begin to populate as your child adds information about their university journey. This will give you visibility into their progress and provide a central place to stay informed throughout the admissions process.
              </p>

              <p style="margin:0 0 12px;color:#111827;font-size:15px;font-weight:600;">
                Through the Parent Portal, you will be able to:
              </p>

              <!-- Feature list -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 24px;margin-bottom:24px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Track your child's progress and key milestones</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Engage directly with your child's college counselor when needed</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Stay updated on important deadlines and next steps</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Support your child throughout their university application journey</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Sign up CTA -->
              <p style="margin:0 0 12px;color:#111827;font-size:15px;font-weight:600;">
                Set up your Parent Portal account
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                To get started, please create your account using the link below. When prompted to choose a role, please select <strong>Parent</strong>.
              </p>

              <div style="text-align:center;margin-bottom:20px;">
                <a href="${SIGNUP_URL}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  Create Your Parent Account &rarr;
                </a>
              </div>

              <p style="margin:0 0 28px;color:#6b7280;font-size:13px;line-height:1.7;text-align:center;">
                Or copy &amp; paste this link into your browser:<br />
                <a href="${SIGNUP_URL}" style="color:#6d28d9;text-decoration:none;">${SIGNUP_URL}</a>
              </p>

              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
                In addition, we are pleased to share that, as part of our collaboration with BISW, we are offering families <strong>complimentary 1:1 consultations</strong> with our founder, an experienced college admissions advisor who has guided students applying to leading universities across the UK, the United States, and beyond.
              </p>

              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.7;">
                If you would be interested in scheduling a free session, please simply reply to this email, and we will be happy to arrange a suitable time.
              </p>

              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.7;">
                Thank you for partnering with us. We look forward to supporting your family throughout this exciting chapter.
              </p>

              <p style="margin:0 0 4px;color:#374151;font-size:16px;line-height:1.7;">
                Warm regards,
              </p>
              <p style="margin:0 0 4px;color:#111827;font-size:16px;font-weight:600;">
                The Primrose Review Team
              </p>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;">
                In partnership with BISW
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">
                <a href="mailto:team@primrosecrm.com" style="color:#6b7280;text-decoration:none;">team@primrosecrm.com</a>
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because your child's school has partnered with The Primrose Review.
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
          subject: "Welcome to the Parent Portal - The Primrose Review",
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
