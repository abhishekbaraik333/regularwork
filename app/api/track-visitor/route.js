import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Allow only POST requests
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Get real visitor IP from Nginx headers
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");

    const ip =
      forwarded?.split(",")[0]?.trim() ||
      realIp ||
      "127.0.0.1";

    // Skip localhost/private IPs
    const privateIps = [
      "127.0.0.1",
      "::1",
    ];

    if (
      privateIps.includes(ip) ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      return NextResponse.json({
        skipped: "Private or local IP",
      });
    }

    // Geo lookup
    const geoRes = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp,query`
    );

    const geoData = await geoRes.json();

    // Handle failed geo lookup
    if (geoData.status !== "success") {
      return NextResponse.json({
        error: "Geo lookup failed",
      });
    }

    const {
      city,
      regionName: region,
      country,
      countryCode,
      isp,
      query,
    } = geoData;

    // Only track Poland visitors
    if (countryCode !== "PL") {
      return NextResponse.json({
        skipped: "Non-Poland visitor",
      });
    }

    // Environment variables
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing Telegram environment variables");

      return NextResponse.json({
        error: "Missing Telegram config",
      });
    }

    // Telegram message
    const message = `
<b>🌐 NOWY GOŚĆ NA STRONIE (PL)</b>
━━━━━━━━━━━━━━━━━━━━
<b>📍 Lokalizacja:</b>
├ IP: <code>${query}</code>
├ Miasto: ${city || "Unknown"}
├ Region: ${region || "Unknown"}
└ Kraj: ${country} (${countryCode})

<b>🛠️ ISP:</b>
└ ${isp || "Unknown"}
━━━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString("pl-PL", {
      timeZone: "Europe/Warsaw",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}
`.trim();

    // Send Telegram notification
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    // Check Telegram response
    if (!telegramRes.ok) {
      const errorText = await telegramRes.text();

      console.error("Telegram API Error:", errorText);

      return NextResponse.json({
        error: "Telegram send failed",
      });
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error("Tracking error:", error);

    return NextResponse.json({
      success: false,
      error: "Internal tracking error",
    });
  }
}