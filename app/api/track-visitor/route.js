import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Get the real visitor IP from request headers (standard for Vercel/proxies)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

    // Perform geographic lookup
    const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
    const geoData = await geoRes.json();

    if (geoData.status !== "success") {
       return NextResponse.json({ error: "Geo lookup failed" }, { status: 500 });
    }

    const { city, regionName: region, country, countryCode, isp } = geoData;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
    }

    // STRICT FILTER: Only notify if the visitor is from Poland (PL)
    if (countryCode !== "PL") {
      return NextResponse.json({ skipped: true });
    }

    const message = `
<b>🌐 NOWY GOŚĆ NA STRONIE (PL)</b>
━━━━━━━━━━━━━━━━━━━━
<b>📍 Lokalizacja:</b>
├ IP: <code>${ip}</code>
├ Miasto: ${city}
├ Region: ${region}
└ Kraj: ${country} (${countryCode})

<b>🛠️ ISP:</b>
└ ${isp}
━━━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString("pl-PL", { 
      timeZone: "Europe/Warsaw", 
      hour: '2-digit', 
      minute: '2-digit' 
    })}
    `.trim();

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal tracking error" }, { status: 500 });
  }
}
