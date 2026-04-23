import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const data = await request.json();

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        { error: "Telegram credentials not configured" },
        { status: 500 }
      );
    }

    // Format the message
    const message = formatTelegramMessage(data);

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error("Telegram API error:", result);
      return NextResponse.json(
        { error: "Failed to send message to Telegram" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending to Telegram:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatTelegramMessage(data) {
  const {
    postingType,
    parcelSize,
    recipient,
    sender,
    consents,
  } = data;

  const priceMap = { small: "19.49", medium: "20.49", large: "25.49" };
  const price = priceMap[parcelSize] || "19.49";

  const postingLabel =
    postingType === "locker-to-home"
      ? "Parcel Locker → Home/Business"
      : "Parcel Locker → Parcel Locker";

  let msg = `<b>📦 NEW PARCEL ORDER</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `<b>📋 Order Details</b>\n`;
  msg += `├ Posting Type: ${postingLabel}\n`;
  msg += `├ Parcel Size: ${parcelSize.charAt(0).toUpperCase() + parcelSize.slice(1)}\n`;
  msg += `└ Price: PLN ${price}\n\n`;

  msg += `<b>📬 Recipient</b>\n`;
  msg += `├ Name: ${recipient.name} ${recipient.surname}\n`;
  if (recipient.companyName) msg += `├ Company: ${recipient.companyName}\n`;
  msg += `├ Phone: +48 ${recipient.phone}\n`;
  msg += `├ Email: ${recipient.email}\n`;
  msg += `├ Address: ${recipient.street} ${recipient.buildingNumber}`;
  if (recipient.unitNumber) msg += `/${recipient.unitNumber}`;
  msg += `\n`;
  msg += `├ City: ${recipient.postCode} ${recipient.city}\n`;
  if (recipient.additionalInfo)
    msg += `└ Note: ${recipient.additionalInfo}\n`;
  else msg += `└ Note: —\n`;

  msg += `\n<b>📤 Sender</b>\n`;
  msg += `├ Name: ${sender.name} ${sender.surname}\n`;
  if (sender.companyName) msg += `├ Company: ${sender.companyName}\n`;
  msg += `├ Phone: +48 ${sender.phone}\n`;
  msg += `├ Email: ${sender.email}\n`;
  msg += `└ Invoice: ${sender.wantInvoice ? "Yes" : "No"}\n\n`;

  msg += `<b>✅ Consents</b>\n`;
  msg += `├ Terms: ${consents.termsAccepted ? "Accepted" : "Not accepted"}\n`;
  msg += `├ Email Marketing: ${consents.emailMarketing ? "Yes" : "No"}\n`;
  msg += `└ SMS Marketing: ${consents.smsMarketing ? "Yes" : "No"}\n\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🕐 ${new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}`;

  return msg;
}
