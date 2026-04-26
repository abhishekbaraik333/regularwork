import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req) {
  try {
    // 1. Get Client IP from headers (Vercel/Standard)
    const headersList = headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

    // 2. Perform Geolocation Lookup from Server-side
    // Using ipwho.is for reliable HTTPS-based lookup
    const geoRes = await fetch(`https://ipwho.is/${ip}`);
    const geoData = await geoRes.json();

    if (!geoData.success) {
      return NextResponse.json({ error: "Geo lookup failed" }, { status: 400 });
    }

    const { city, region, country, country_code, connection } = geoData;

    // 3. Filter for Poland
    if (country_code !== "PL") {
      return NextResponse.json({ skipped: true });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ error: "Missing config" }, { status: 500 });
    }

    // 4. Format Message
    const message = `
<b>🌐 NOWY GOŚĆ NA STRONIE (PL)</b>
━━━━━━━━━━━━━━━━━━━━
<b>📍 Lokalizacja:</b>
├ IP: <code>${ip}</code>
├ Miasto: ${city}
├ Region: ${region}
└ Kraj: ${country} (${country_code})

<b>🛠️ ISP:</b>
└ ${connection?.isp || "Unknown"}
━━━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", hour: '2-digit', minute: '2-digit' })}
    `.trim();

    // 5. Notify Telegram
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
