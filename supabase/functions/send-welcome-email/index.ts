import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const studentHtml = (fullName: string, appUrl: string) => `
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
                Hi ${fullName},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                Welcome to <strong>The Primrose Review</strong>! Your account is all set up and ready to go.
              </p>

              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.7;">
                Here's what you can do from your student dashboard:
              </p>

              <!-- Feature list -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:32px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Track your college applications &amp; deadlines</span>
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
                    <td style="padding:8px 0;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Message your counselor directly</span>
                    </td>
                  </tr>
                </table>
              </div>

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
                You're receiving this because you just created a student account on The Primrose Review.<br />
                If this wasn't you, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const counselorHtml = (fullName: string, appUrl: string) => `
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
                Hi ${fullName},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                Welcome to <strong>The Primrose Review</strong>! Your counselor account is ready.
              </p>

              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.7;">
                Here's what you can manage from your counselor dashboard:
              </p>

              <!-- Feature list -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:32px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Manage and monitor all your assigned students</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Review and give feedback on student essays</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Generate AI-powered recommendation letters</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Message students and their parents</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Invite code tip -->
              <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:10px;padding:16px 20px;margin-bottom:32px;">
                <p style="margin:0;color:#4c1d95;font-size:14px;line-height:1.6;">
                  <strong>Tip:</strong> Head to your dashboard to generate your invite code and share it with students so they can connect with you.
                </p>
              </div>

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
                You're receiving this because you just created a counselor account on The Primrose Review.<br />
                If this wasn't you, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const parentHtml = (fullName: string, appUrl: string) => `
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
                Hi ${fullName},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                Welcome to <strong>The Primrose Review</strong>! Your parent account is all set up.
              </p>

              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.7;">
                You now have visibility into your child's college application journey. Here's what you can do from your parent portal:
              </p>

              <!-- Feature list -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:32px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Track your child's application progress and deadlines</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Stay informed on milestones and outstanding tasks</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="color:#6d28d9;font-weight:700;margin-right:10px;">&#10003;</span>
                      <span style="color:#374151;font-size:14px;">Communicate with your child's counselor</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${appUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  Go to My Portal &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because you just created a parent account on The Primrose Review.<br />
                If this wasn't you, please ignore this email.
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
    const { email, fullName, role, appUrl } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    if (!email || !role) throw new Error("email and role are required");

    const displayName = fullName || "there";
    const baseUrl = appUrl || "https://primrosereview.com";

    const subject =
      role === "counselor" ? "Welcome to The Primrose Review — Your counselor account is ready" :
      role === "parent"    ? "Welcome to The Primrose Review — Your parent account is ready" :
                             "Welcome to The Primrose Review — Your account is ready";

    const html =
      role === "counselor" ? counselorHtml(displayName, baseUrl) :
      role === "parent"    ? parentHtml(displayName, baseUrl) :
                             studentHtml(displayName, baseUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Primrose Review <team@primrosecrm.com>",
        to: email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Resend API error");
    }

    console.log(`Welcome email sent to ${email} (role: ${role})`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-welcome-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
