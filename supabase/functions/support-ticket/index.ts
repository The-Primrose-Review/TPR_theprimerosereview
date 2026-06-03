import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ticketHtml = (userName: string, userEmail: string, userRole: string, subject: string, message: string, submittedAt: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Support Request — The Primrose Review</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9,#9333ea);padding:28px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Support Request</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">The Primrose Review</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">

              <table cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:0;margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 20px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">From</span><br/>
                    <span style="color:#111827;font-size:14px;font-weight:500;">${userName} &lt;${userEmail}&gt;</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Role</span><br/>
                    <span style="color:#111827;font-size:14px;font-weight:500;text-transform:capitalize;">${userRole}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;border-bottom:1px solid #e5e7eb;">
                    <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Subject</span><br/>
                    <span style="color:#111827;font-size:14px;font-weight:500;">${subject}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;">
                    <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Submitted</span><br/>
                    <span style="color:#111827;font-size:14px;font-weight:500;">${submittedAt}</span>
                  </td>
                </tr>
              </table>

              <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:10px;padding:20px 24px;">
                <p style="margin:0 0 8px;color:#6d28d9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
                <p style="margin:0;color:#1f2937;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
              </div>

            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">Reply to this email or reach the user at ${userEmail}</p>
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
    const { subject, message, userName, userEmail, userRole } = await req.json();

    if (!subject?.trim() || !message?.trim()) {
      throw new Error("subject and message are required");
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Resolve user ID from JWT
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id ?? null;
    }

    // Store ticket in DB
    const { error: dbError } = await supabase.from("support_tickets").insert({
      user_id: userId,
      user_name: userName ?? "Unknown",
      user_email: userEmail ?? "Unknown",
      user_role: userRole ?? "Unknown",
      subject: subject.trim(),
      message: message.trim(),
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Non-fatal — still send the email
    }

    // Send email to team
    if (RESEND_API_KEY) {
      const submittedAt = new Date().toLocaleString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit", timeZoneName: "short",
      });

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "The Primrose Review <team@primrosecrm.com>",
          to: "team@primrosecrm.com",
          reply_to: userEmail ?? undefined,
          subject: `Support Request: ${subject.trim()}`,
          html: ticketHtml(
            userName ?? "Unknown",
            userEmail ?? "Unknown",
            userRole ?? "Unknown",
            subject.trim(),
            message.trim(),
            submittedAt,
          ),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Resend error:", err);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("support-ticket error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
