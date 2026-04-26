import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { ip, city, region, country, countryCode, isp } = await req.json();

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
