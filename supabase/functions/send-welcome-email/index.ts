import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prenom, email } = await req.json();

    if (!prenom || !email) {
      return new Response(
        JSON.stringify({ error: "prenom and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#060608;font-family:'Montserrat',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060608;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0D0D10;border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:48px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <h1 style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A84C;font-size:28px;font-weight:300;margin:0;">⚡ DropDigital</h1>
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="display:inline-block;border:1px solid rgba(201,168,76,0.3);background:rgba(201,168,76,0.05);padding:6px 18px;border-radius:2px;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;">ACCÈS CONFIRMÉ</span>
        </td></tr>
        <tr><td style="color:#F5F0E8;font-size:16px;line-height:1.6;padding-bottom:16px;">
          Salut <strong style="color:#C9A84C;">${prenom}</strong>,
        </td></tr>
        <tr><td style="color:#B0A898;font-size:14px;line-height:1.6;padding-bottom:32px;">
          Ton outil DropDigital est prêt. Voici ton lien d'accès exclusif :
        </td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <a href="https://dropdigital.com/outil" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#E8C96A);color:#060608;padding:14px 40px;border-radius:4px;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">⚡ ACCÉDER À L'OUTIL</a>
        </td></tr>
        <tr><td style="color:#B0A898;font-size:13px;line-height:1.6;border-top:1px solid rgba(201,168,76,0.1);padding-top:24px;">
          Profite bien. — DropDigital
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "DropDigital <noreply@dropdigital.com>",
        to: [email],
        subject: "⚡ Ton outil DropDigital est prêt",
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
