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
    lockerPoint,
    discountCode
  } = data;

  const prices = {
    "locker-to-locker": { small: "16.49", medium: "18.49", large: "20.49" },
    "locker-to-home": { small: "19.49", medium: "20.49", large: "25.49" }
  };
  const priceArr = prices[postingType] || prices["locker-to-locker"];
  const price = priceArr[parcelSize] || "0.00";

  const postingLabel =
    postingType === "locker-to-home"
      ? "Paczkomat → Dom/Firma"
      : "Paczkomat → Paczkomat";

  let msg = `<b>📦 NOWE ZAMÓWIENIE PACZKI</b>\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `<b>📋 Szczegóły zamówienia</b>\n`;
  msg += `├ Typ: ${postingLabel}\n`;
  msg += `├ Rozmiar: ${parcelSize.charAt(0).toUpperCase() + parcelSize.slice(1)}\n`;
  msg += `├ Cena: PLN ${price}${price === "0.00" ? " (KOD PROMOCYJNY)" : ""}\n`;
  msg += `└ Kod rabatowy: ${discountCode ? `<code>${discountCode}</code>` : "Brak"}\n\n`;

  msg += `<b>📬 Odbiorca</b>\n`;
  msg += `├ Imię: ${recipient.name} ${recipient.surname}\n`;
  msg += `├ Firma: ${recipient.companyName || "Brak"}\n`;
  msg += `├ Telefon: +48 ${recipient.phone}\n`;
  msg += `├ E-mail: ${recipient.email}\n`;
  
  if (postingType === 'locker-to-home') {
    msg += `├ Kod pocztowy: ${recipient.postCode}\n`;
    msg += `├ Miasto: ${recipient.city}\n`;
    msg += `├ Ulica: ${recipient.street}\n`;
    msg += `├ Numer budynku: ${recipient.buildingNumber}\n`;
    if (recipient.unitNumber) {
      msg += `├ Numer lokalu: ${recipient.unitNumber}\n`;
    }
  } else {
    msg += `├ Paczkomat: ${lockerPoint || "Nie wybrano"}\n`;
  }
  msg += `├ Kwota pobrania: ${recipient.codValue || "Brak"}\n`;
  if (recipient.codValue && recipient.bankAccount) {
    msg += `├ Konto bankowe: <code>${recipient.bankAccount}</code>\n`;
  }
  msg += `└ Sprawdzenie zawartości: ${recipient.checkContent ? "Tak" : "Nie"}\n\n`;

  msg += `<b>📤 Nadawca</b>\n`;
  msg += `├ Imię: ${sender.name} ${sender.surname}\n`;
  msg += `├ Firma: ${sender.companyName || "Brak"}\n`;
  msg += `├ Telefon: +48 ${sender.phone}\n`;
  msg += `├ E-mail: ${sender.email}\n`;
  msg += `└ Faktura: ${sender.wantInvoice ? "Tak" : "Nie"}\n\n`;

  msg += `<b>✅ Zgody</b>\n`;
  msg += `├ Regulamin: Zaakceptowano\n`;
  msg += `├ Marketing (Email): ${consents.emailMarketing ? "Tak" : "Nie"}\n`;
  msg += `└ Marketing (SMS): ${consents.smsMarketing ? "Tak" : "Nie"}\n`;

  msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🕐 ${new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}`;

  return msg;
}
