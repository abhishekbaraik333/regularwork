import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Get IP from headers (Vercel provides this)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

    // If local, use a Polish mock IP for testing so it passes the PL filter
    const lookupIp = ip === "::1" || ip === "127.0.0.1" ? "185.202.0.1" : ip;

    // Perform geo lookup server-side (server-to-server calls don't have Mixed Content issues)
    const geoRes = await fetch(`http://ip-api.com/json/${lookupIp}`);
    const geoData = await geoRes.json();

    if (geoData.status !== "success") {
       return NextResponse.json({ error: "Geo lookup failed" }, { status: 500 });
    }

    const { city, regionName: region, country, countryCode, isp } = geoData;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ error: "Missing config" }, { status: 500 });
    }

    // Only notify if it's from Poland
    if (countryCode !== "PL") {
      return NextResponse.json({ skipped: true });
    }

    const message = `
<b>🌐 NOWY GOŚĆ NA STRONIE</b>
━━━━━━━━━━━━━━━━━━━━
<b>📍 Lokalizacja:</b>
├ IP: <code>${ip}</code>
├ Miasto: ${city}
├ Region: ${region}
└ Kraj: ${country} (${countryCode})

<b>🛠️ ISP:</b>
└ ${isp}
━━━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", hour: '2-digit', minute: '2-digit' })}
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
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }
}
