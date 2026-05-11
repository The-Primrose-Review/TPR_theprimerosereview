import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { parentEmail, parentName, counselorCode, appUrl } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    if (!parentEmail || !counselorCode) {
      throw new Error("parentEmail and counselorCode are required");
    }

    const registrationUrl = `${appUrl}/signup?invite=${counselorCode}&role=parent`;
    const studentUrl = `${appUrl}/signup?invite=${counselorCode}`;
    const displayName = parentName || "there";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Introducing The Primrose Review – BISW</title>
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
                Dear Parents,
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                We're excited to introduce <strong>The Primrose Review</strong>, a new university admissions support platform that the British International School of Washington will begin using with students as part of the college application process.
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                Over the past few months, we've been working closely with Mrs. Neela Choudhury, Head of Secondary, and the BISW leadership team to thoughtfully introduce a platform that can better support students during one of the most important and demanding stages of their academic journey.
              </p>

              <p style="margin:0 0 8px;color:#374151;font-size:16px;line-height:1.7;">
                <strong>The goal of this partnership is simple:</strong>
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;font-style:italic;">
                To provide students with a more structured, organized, and supportive admissions experience, while helping them maintain confidence, authenticity, and ownership over their applications.
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                As technology and LLM models continue to evolve within education, students are increasingly using digital tools independently. One of the reasons BISW chose to partner with The Primrose Review is our shared belief that technology should support student thinking, reflection, and growth — not replace it.
              </p>

              <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.7;">
                The platform is designed to help students:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">Organize applications and deadlines</td></tr>
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">Develop and strengthen personal statements</td></tr>
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">Receive structured counselor feedback</td></tr>
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">Collaborate more effectively with school staff</td></tr>
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">Explore universities and opportunities</td></tr>
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">Build applications that feel thoughtful, personal, and authentic</td></tr>
              </table>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                Importantly, students will continue working directly with BISW counselors and staff throughout the process. The platform simply creates a more modern, collaborative, and transparent environment around that guidance.
              </p>

              <p style="margin:0 0 12px;color:#374151;font-size:16px;line-height:1.7;">
                In addition, you as parents will have access to your own dashboard, where you will be able to:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">View your child's application progress</td></tr>
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">Access helpful admissions resources and updates</td></tr>
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">Communicate directly with Robert Ramey, Director of College Counseling</td></tr>
                <tr><td style="color:#6d28d9;font-size:15px;padding-right:8px;vertical-align:top;">✓</td><td style="color:#374151;font-size:15px;line-height:1.8;">Better understand key stages and milestones throughout the admissions journey</td></tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 28px;" />

              <!-- Parent activation -->
              <p style="margin:0 0 8px;color:#111827;font-size:15px;font-weight:600;">
                Activate your parent account:
              </p>
              <p style="margin:0 0 20px;">
                <a href="${registrationUrl}" style="color:#7c3aed;font-size:15px;word-break:break-all;">${registrationUrl}</a>
              </p>

              <!-- Student activation -->
              <p style="margin:0 0 8px;color:#111827;font-size:15px;font-weight:600;">
                Your child's student account can be accessed here:
              </p>
              <p style="margin:0 0 28px;">
                <a href="${studentUrl}" style="color:#7c3aed;font-size:15px;word-break:break-all;">${studentUrl}</a>
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                The Primrose Review has supported students applying to leading universities across the United States, United Kingdom, and globally, and we are very excited to begin this partnership with BISW.
              </p>

              <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.7;">
                We look forward to supporting your family throughout this exciting journey.
              </p>

              <p style="margin:0;color:#374151;font-size:15px;line-height:1.8;">
                Warm regards,<br />
                <strong>Tamir Oren</strong><br />
                Founder &amp; CEO<br />
                The Primrose Review
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This email was sent as part of the BISW &times; The Primrose Review partnership.<br />
                If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Primrose Review <team@primrosecrm.com>",   // ← swap for your verified domain email when ready
        to: parentEmail,
        subject: `Introducing The Primrose Review – BISW College Application Platform`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Resend API error");
    }

    console.log(`Parent invite sent to ${parentEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-parent-invite error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
