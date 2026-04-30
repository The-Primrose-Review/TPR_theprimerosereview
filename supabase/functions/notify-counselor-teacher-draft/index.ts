import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const counselorNotificationHtml = (
  counselorName: string,
  teacherName: string,
  studentName: string,
  isRevision: boolean,
  dashboardUrl: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${isRevision ? "Revised Draft" : "New Draft"} from ${teacherName}</title>
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
                ${isRevision
                  ? `<strong>${teacherName}</strong> has submitted a <strong>revised draft</strong> of the recommendation letter for <strong>${studentName}</strong>.`
                  : `<strong>${teacherName}</strong> has submitted their <strong>first draft</strong> of the recommendation letter for <strong>${studentName}</strong>.`
                }
              </p>

              <!-- Details -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Teacher</span><br />
                      <span style="color:#111827;font-size:15px;font-weight:600;">${teacherName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Student</span><br />
                      <span style="color:#111827;font-size:14px;">${studentName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Status</span><br />
                      <span style="color:#111827;font-size:14px;">${isRevision ? "Revised — ready for your review" : "First draft — ready for your review"}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin:0 0 28px;color:#374151;font-size:14px;line-height:1.7;">
                Head to your dashboard to review the draft, leave revision notes, or finalize and send the letter.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${dashboardUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:16px;font-weight:600;">
                  Review Draft &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because a teacher submitted a recommendation draft through The Primrose Review.
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
    const { token, teacherName, studentName, isRevision, appUrl } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase env vars not configured");
    if (!token || !teacherName || !studentName) throw new Error("token, teacherName, and studentName are required");

    const dbHeaders = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    };

    // Step 1: Get student_id from the rec request
    const recRes = await fetch(
      `${SUPABASE_URL}/rest/v1/recommendation_requests?teacher_token=eq.${token}&select=student_id`,
      { headers: dbHeaders },
    );
    const recRows = await recRes.json();
    if (!recRows?.length) throw new Error("Recommendation request not found for token");
    const studentId = recRows[0].student_id;

    // Step 2: Get counselor_id from the assignment
    const assignRes = await fetch(
      `${SUPABASE_URL}/rest/v1/student_counselor_assignments?student_id=eq.${studentId}&select=counselor_id`,
      { headers: dbHeaders },
    );
    const assignRows = await assignRes.json();
    if (!assignRows?.length) throw new Error("No counselor assignment found for this student");
    const counselorId = assignRows[0].counselor_id;

    // Step 3: Get counselor email and name from profiles
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${counselorId}&select=full_name,email`,
      { headers: dbHeaders },
    );
    const profileRows = await profileRes.json();
    if (!profileRows?.length) throw new Error("Counselor profile not found");
    const { full_name: counselorName, email: counselorEmail } = profileRows[0];

    if (!counselorEmail) throw new Error("Counselor has no email on record");

    const baseUrl = appUrl || "https://primrosereview.com";
    const dashboardUrl = `${baseUrl}/recommendation-letters`;
    const html = counselorNotificationHtml(
      counselorName || "Counselor",
      teacherName,
      studentName,
      !!isRevision,
      dashboardUrl,
    );

    const subject = isRevision
      ? `${teacherName} submitted a revised draft for ${studentName} — The Primrose Review`
      : `${teacherName} submitted a draft for ${studentName} — The Primrose Review`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Primrose Review <team@primrosecrm.com>",
        to: counselorEmail,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Resend API error");
    }

    console.log(`Counselor draft notification sent to ${counselorEmail} (${counselorName}), teacher: ${teacherName}, student: ${studentName}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-counselor-teacher-draft error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});