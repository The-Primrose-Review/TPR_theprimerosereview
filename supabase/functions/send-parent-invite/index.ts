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
    const { parentEmail, parentName, studentName, counselorCode, appUrl } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    if (!parentEmail || !counselorCode) {
      throw new Error("parentEmail and counselorCode are required");
    }

    const registrationUrl = `${appUrl}/signup?invite=${counselorCode}&role=parent`;
    const displayName = parentName || "there";
    const displayStudent = studentName || "your child";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>You're invited to The Primrose Review</title>
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
                Hi ${displayName},
              </p>

              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
                <strong>${displayStudent}</strong> has joined <strong>The Primrose Review</strong> — a college counseling platform — and has added you as their parent/guardian.
              </p>

              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.7;">
                Create your parent account to stay updated on their applications, essays, and deadlines.
              </p>

              <!-- How to register -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 12px;color:#111827;font-size:14px;font-weight:600;">
                  How to get started:
                </p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#6d28d9;font-size:14px;font-weight:700;padding-right:10px;vertical-align:top;">1.</td>
                    <td style="color:#6b7280;font-size:14px;line-height:1.6;">Click the <strong>Create Account</strong> button below</td>
                  </tr>
                  <tr>
                    <td style="color:#6d28d9;font-size:14px;font-weight:700;padding-right:10px;vertical-align:top;">2.</td>
                    <td style="color:#6b7280;font-size:14px;line-height:1.6;">Your invite code will be pre-filled automatically</td>
                  </tr>
                  <tr>
                    <td style="color:#6d28d9;font-size:14px;font-weight:700;padding-right:10px;vertical-align:top;">3.</td>
                    <td style="color:#6b7280;font-size:14px;line-height:1.6;">Fill in your details and create a password</td>
                  </tr>
                </table>
              </div>

              <!-- Code box -->
              <p style="margin:0 0 10px;color:#111827;font-size:14px;font-weight:600;">
                Your invite code (copy &amp; paste if needed):
              </p>
              <div style="background:#1e1b4b;border-radius:10px;padding:20px;margin-bottom:32px;text-align:center;">
                <span style="display:inline-block;color:#c4b5fd;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:700;letter-spacing:6px;word-break:break-all;">
                  ${counselorCode}
                </span>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${registrationUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  Create Parent Account &rarr;
                </a>
              </div>

              <!-- Fallback link -->
              <div style="border-top:1px solid #f3f4f6;padding-top:20px;">
                <p style="margin:0 0 6px;color:#9ca3af;font-size:13px;">
                  If the button doesn't work, paste this link into your browser:
                </p>
        
                <a href="${registrationUrl}" style="color:#7c3aed;font-size:13px;word-break:break-all;">
                  ${registrationUrl}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This invitation was sent because a student listed you as their parent/guardian.<br />
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
        subject: `You're invited to follow ${displayStudent}'s college journey`,
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
  } catch (error) {
    console.error("send-parent-invite error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
