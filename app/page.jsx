"use client";

import { useState } from "react";
import Image from "next/image";

const prices = {
  "locker-to-locker": {
    small: "16.49",
    medium: "18.49",
    large: "20.49",
  },
  "locker-to-home": {
    small: "19.49",
    medium: "20.49",
    large: "25.49",
  }
};

const sizes = [
  {
    id: "small",
    label: "Маленька",
    dimensions: "8 x 38 x 64 cm",
    weight: "макс. 25 кг",
    image: "/shipment-small.webp",
  },
  {
    id: "medium",
    label: "Середня",
    dimensions: "19 x 38 x 64 cm",
    weight: "макс. 25 кг",
    image: "/shipment-medium.webp",
  },
  {
    id: "large",
    label: "Велика",
    dimensions: "41 x 38 x 64 cm",
    weight: "макс. 25 кг",
    image: "/shipment-large.webp",
  },
];

const sizeLabels = { small: "Маленька", medium: "Середня", large: "Велика" };

const initialFormData = {
  recipient: {
    name: "",
    surname: "",
    companyName: "",
    phone: "",
    email: "",
    postCode: "",
    city: "",
    street: "",
    buildingNumber: "",
    unitNumber: "",
    additionalInfo: "",
  },
  sender: {
    name: "",
    surname: "",
    companyName: "",
    phone: "",
    email: "",
    wantInvoice: false,
  },
  consents: {
    termsAccepted: false,
    emailMarketing: false,
    smsMarketing: false,
  },
};

export default function Home() {
  const [postingType, setPostingType] = useState("locker-to-home");
  const [parcelSize, setParcelSize] = useState("small");
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [lockerSearch, setLockerSearch] = useState("");
  const [isLockerFocused, setIsLockerFocused] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountCode, setDiscountCode] = useState("");

  const currentPrices = prices[postingType] || prices["locker-to-locker"];
  const price = currentPrices[parcelSize] || currentPrices["small"];
  const sizeLabel = sizeLabels[parcelSize] || "Маленька";

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  };

  const handleRecipientChange = (field, value) => {
    let finalValue = value;
    if (field === "phone") {
      finalValue = formatPhoneNumber(value);
    }
    setFormData((prev) => ({
      ...prev,
      recipient: { ...prev.recipient, [field]: finalValue },
    }));
  };

  const handleSenderChange = (field, value) => {
    let finalValue = value;
    if (field === "phone") {
      finalValue = formatPhoneNumber(value);
    }
    setFormData((prev) => ({
      ...prev,
      sender: { ...prev.sender, [field]: finalValue },
    }));
  };

  const handleConsentChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      consents: { ...prev.consents, [field]: value },
    }));
  };

  const validate = () => {
    const newErrors = {};
    const r = formData.recipient;
    const s = formData.sender;
    const pt = postingType;

    if (pt === 'locker-to-locker') {
      if (!lockerSearch.trim() || lockerSearch.trim().length < 3) {
        newErrors.lockerPoint = "Виберіть пункт отримання - введіть мінімум 3 літери";
      }
    }

    if (!r.name.trim()) newErrors.recipientName = "Введіть ім'я одержувача";
    if (!r.surname.trim()) newErrors.recipientSurname = "Введіть прізвище отримувача";
    if (!r.phone.trim()) newErrors.recipientPhone = "Введіть правильний номер телефону - він має складатися з 9 цифр";
    else if (r.phone.replace(/\s/g, "").length !== 9) newErrors.recipientPhone = "Введіть правильний номер телефону - він має складатися з 9 цифр";
    if (!r.email.trim()) newErrors.recipientEmail = "Введіть електронну пошту отримувача";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) newErrors.recipientEmail = "Введіть правильну адресу електронної пошти";
    if (!r.postCode.trim()) newErrors.recipientPostCode = "Введіть поштовий індекс";
    if (!r.city.trim()) newErrors.recipientCity = "Введіть місто";
    if (!r.street.trim()) newErrors.recipientStreet = "Будь ласка, заповніть це поле.";
    if (!r.buildingNumber.trim()) newErrors.recipientBuildingNumber = "Введіть номер будинку";

    if (!s.name.trim()) newErrors.senderName = "Введіть ім'я відправника";
    if (!s.surname.trim()) newErrors.senderSurname = "Введіть прізвище відправника";
    if (!s.phone.trim()) newErrors.senderPhone = "Введіть правильний номер телефону відправника - він має складатися з 9 цифр";
    else if (s.phone.replace(/\s/g, "").length !== 9) newErrors.senderPhone = "Введіть правильний номер телефону відправника - він має складатися з 9 цифр";
    if (!s.email.trim()) newErrors.senderEmail = "Введіть електронну пошту відправника";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) newErrors.senderEmail = "Введіть правильну адресу електронної пошти";

    if (!formData.consents.termsAccepted) newErrors.termsAccepted = "You must accept the Terms and Conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      const firstError = document.querySelector(".field-error, .error-message");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const res = await fetch("/api/send-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postingType,
          parcelSize,
          recipient: formData.recipient,
          sender: formData.sender,
          consents: formData.consents,
          discountCode: showDiscount ? discountCode : null,
        }),
      });

      if (res.ok) {
        setSubmitStatus("success");
        setFormData(initialFormData);
        setErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const r = formData.recipient;
  const s = formData.sender;
  const c = formData.consents;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* ========== HEADER ========== */}
      <header className="bg-inpost-black w-full z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Image src="/Inpost.svg" alt="InPost Logo" width={150} height={50} className="h-10 w-auto" priority style={{ height: 'auto' }} />
            </div>
            <div className="h-6 w-[1.5px] bg-[#4D4D4D] hidden sm:block" />
            <span className="text-white font-bold text-lg  tracking-wide hidden sm:block">
              Szybkie Nadania
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="hover:opacity-80 transition-opacity">
              <Image src="/pl-lang.png" alt="Polish" width={30} height={20} className="h-5 w-auto object-cover" />
            </button>
            <button type="button" className="hover:opacity-80 transition-opacity">
              <Image src="/uk-lang.png" alt="Ukrainian" width={30} height={20} className="h-5 w-auto object-cover" />
            </button>
          </div>
        </div>
      </header>

      {/* ========== HERO BANNER ========== */}
      <section className="bg-inpost-yellow w-full pt-10 pb-4 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
          <div className="flex items-start gap-6 mt-8">
            <Image src="/percel-locker.svg" alt="Parcel Locker" width={106} height={83} className="shrink-0 h-auto w-auto" />
            <div className="max-w-xl">
              <Image src="/header_ua.svg" alt="Parcel Locker" width={545} height={88} className="shrink-0 h-auto w-auto" />

              <p className="text-inpost-black text-lg font-semibold opacity-90 tracking-[0.02em] mt-5">
                на території Польщі та за кордон
                &nbsp;·&nbsp; з етикеткою або без
              </p>
            </div>
          </div>

          <div className="hidden lg:block self-center pb-2">
            <button type="button" className="bg-inpost-black text-white px-5 py-2.5 font-bold text-sm hover:bg-black transition-colors flex items-center gap-3">
              Як надіслати посилку?
            </button>
          </div>
        </div>
      </section>

      {/* ========== TAB BAR ========== */}
      <div className="bg-inpost-yellow w-full pt-5">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-end gap-5">
            <button type="button" className="px-6 py-4 text-[14px] font-semibold  tracking-wider bg-white relative">
              внутрішнє відправлення
            </button>
            <button type="button" className="bg-[#FAE6AA] px-6 py-4 text-[14px] font-semibold  tracking-wider text-inpost-black  flex items-center gap-2 cursor-pointer">
              Відправляю за кордон
              <span className="bg-[#E91E63] text-black text-[9px] font-black px-1.5 py-0.5 rounded-[2px] mb-0.5">НОВИНКА</span>
            </button>
          </div>
          <div className="lg:hidden pb-1">
            <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full bg-inpost-black text-white">?</button>
          </div>
        </div>
      </div>

      {/* ========== SUCCESS / ERROR BANNER ========== */}
      {submitStatus && (
        <div className="max-w-[1240px] mx-auto px-4 mt-6">
          <div className={`border px-6 py-4 flex items-center justify-between ${submitStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <p className="font-bold flex items-center gap-2">
              {submitStatus === 'success' ? '✅' : '❌'} {submitStatus === 'success' ? 'Your parcel details have been submitted successfully!' : 'Submission failed. Please try again.'}
            </p>
            <button onClick={() => setSubmitStatus(null)} className="text-xl font-black">&times;</button>
          </div>
        </div>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-[1200px] mx-auto px-4">
        {/* Step Indicator */}
        <nav className="flex items-center gap-3 py-6 text-[13px] font-bold text-inpost-gray">
          <span className="text-inpost-black">1. Деталі відправлення</span>
          <span aria-hidden="true">→</span>
          <span>2. Підсумок та платіж</span>
          <span aria-hidden="true">→</span>
          <span>3. Підтвердження</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-[10rem] items-start">
          {/* ===== LEFT COLUMN — FORM ===== */}
          <div className="flex-1 min-w-0">

            {/* ---- TYPE OF POSTING ---- */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-inpost-black mb-6  tracking-tight">Спосіб доставки</h2>
              <div className="flex flex-wrap gap-4">
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPostingType("locker-to-locker"); }}
                  className={`radio-card border p-7 cursor-pointer flex-1 min-w-[280px] relative transition-all ${postingType === "locker-to-locker" ? "selected" : "border-inpost-border bg-white"}`}
                  onClick={() => setPostingType("locker-to-locker")}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <input type="radio" checked={postingType === "locker-to-locker"} readOnly className="custom-radio mt-1" />
                    <div className="flex-1 flex items-center justify-center gap-4 py-2">
                      <Image src="/Parcel-status-icon-box_4.png" alt="Parcel Locker" width={50} height={50} className="shrink-0 h-auto w-[50px]" />
                      <span className="text-inpost-black text-2xl font-light" aria-hidden="true">→</span>
                      <Image src="/Parcel-status-icon-box_4.png" alt="Parcel Locker" width={50} height={50} className="shrink-0 h-auto w-[50px]" />
                    </div>
                  </div>
                  <div className="divider h-px bg-gray-300 w-full my-5"></div>
                  <div className="text-[13px] leading-relaxed text-inpost-black">
                    <p>Через:<span className="font-normal text-inpost-black"> Поштомат або Поштопункт</span></p>
                    <p>До: <span className="font-semibold text-inpost-black"> Поштомат або Поштопункт</span></p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPostingType("locker-to-home"); }}
                  className={`radio-card border p-7 cursor-pointer flex-1 min-w-[280px] relative transition-all ${postingType === "locker-to-home" ? "selected" : "border-inpost-border bg-white"}`}
                  onClick={() => setPostingType("locker-to-home")}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <input type="radio" checked={postingType === "locker-to-home"} readOnly className="custom-radio mt-1" />
                    <div className="flex-1 flex items-center justify-center gap-4 py-2">
                      <Image src="/Parcel-status-icon-box_4.png" alt="Parcel Locker" width={50} height={50} className="shrink-0 h-auto w-[50px]" />
                      <span className="text-inpost-black text-2xl font-light" aria-hidden="true">→</span>
                      <Image src="/Parcel-status-icon.webp" alt="Parcel Locker" width={50} height={50} className="shrink-0 h-auto w-[50px]" />
                    </div>
                  </div>
                  <div className="divider h-px bg-gray-300 w-full my-5"></div>
                  <div className="text-[13px] leading-relaxed text-inpost-black">
                    <p>Через:<span className="font-normal text-inpost-black"> Поштомат або Поштопункт</span></p>
                    <p>До: <span className="font-semibold text-inpost-black"> Дім або фірма</span></p>
                  </div>
                </div>
              </div>
            </section>

            {/* ---- PARCEL SIZE ---- */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-inpost-black mb-6  tracking-tight flex items-center gap-3">
                Розмір посилки<span className="tooltip-icon" title="More information">?</span>
              </h2>
              <div className="space-y-3">
                {sizes.map((sz) => (
                  <div
                    key={sz.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setParcelSize(sz.id); }}
                    className={`radio-card border px-5 py-3 cursor-pointer flex items-center justify-between transition-all ${parcelSize === sz.id ? "selected" : "border-inpost-border bg-white"}`}
                    onClick={() => setParcelSize(sz.id)}
                  >
                    <div className="flex items-center gap-6">
                      <input type="radio" checked={parcelSize === sz.id} readOnly className="custom-radio" />
                      <div className="w-14 h-14 flex items-center justify-center">
                        <Image src={`/shipment-${sz.id}.webp`} alt={sz.label} width={40} height={40} className="h-auto w-[50px]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-inpost-black text-[16px]">{sz.label}</h3>
                        <p className="text-inpost-gray text-[13px] font-medium">{sz.dimensions} <span className="mx-1">•</span> {sz.weight}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-inpost-black text-[17px]">{currentPrices[sz.id]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ---- FORMS ---- */}
            <div className="grid grid-cols-1 gap-12">
              {/* RECIPIENT */}
              <section>
                <h2 className="text-2xl font-black text-inpost-black mb-8  tracking-tight">Отримувач</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="col-span-1">
                    <label htmlFor="r-name" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Ім’я<span className="text-inpost-red">*</span></label>
                    <input type="text" id="r-name" value={r.name} onChange={(e) => handleRecipientChange("name", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.recipientName ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                    {errors.recipientName && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.recipientName}</p>}
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="r-surname" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Прізвище<span className="text-inpost-red">*</span></label>
                    <input type="text" id="r-surname" value={r.surname} onChange={(e) => handleRecipientChange("surname", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.recipientSurname ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                    {errors.recipientSurname && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.recipientSurname}</p>}
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="r-company" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Назва фірми (додатково)</label>
                    <input type="text" id="r-company" value={r.companyName} onChange={(e) => handleRecipientChange("companyName", e.target.value)} className="w-full border px-4 py-4 bg-white transition-all border-inpost-gray focus:border-2 focus:border-blue-600" />
                  </div>

                  {postingType === 'locker-to-locker' && (
                    <div className="col-span-2">
                      <label htmlFor="locker-point" className="block text-[15px] font-bold text-inpost-black mb-2 tracking-wide">Назва або адреса приймального пункту<span className="text-inpost-red">*</span></label>
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            id="locker-point"
                            placeholder="Введіть адресу або номер Поштомату"
                            value={lockerSearch}
                            onChange={(e) => setLockerSearch(e.target.value)}
                            onFocus={() => setIsLockerFocused(true)}
                            onBlur={() => setTimeout(() => setIsLockerFocused(false), 200)}
                            className={`w-full border px-4 py-4 bg-white transition-all ${errors.lockerPoint ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`}
                          />
                          {isLockerFocused && !lockerSearch && (
                            <div className="absolute left-0 top-full w-full bg-[#EBEBEB] py-3 px-4 text-[14px] font-bold text-inpost-black z-20">
                              введіть принаймні 3 літери
                            </div>
                          )}
                        </div>
                        <button type="button" className="bg-inpost-black text-white px-6 py-4 font-bold text-[14px] hover:bg-black transition-colors whitespace-nowrap">
                          Виберіть на карті
                        </button>
                      </div>
                      {errors.lockerPoint && (
                        <p className="error-message" role="alert">
                          <span className="error-icon">!</span>{errors.lockerPoint}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="col-span-2">
                    <label htmlFor="r-phone" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Телефонний номер<span className="text-inpost-red">*</span></label>
                    <div className="flex gap-2">
                      <div role="button" tabIndex={0} className="flex items-center border border-inpost-gray px-3 py-4 bg-white gap-2 min-w-[100px] hover:border-blue-600 transition-all">
                        <Image src="/pl-lang.png" alt="PL" width={22} height={14} className="w-5 h-auto object-cover rounded-sm" />
                        <span className="text-[14px] font-bold">+48</span>
                        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1L5 5L9 1" stroke="#1D1D1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <input type="tel" id="r-phone" value={r.phone} onChange={(e) => handleRecipientChange("phone", e.target.value)} className={`flex-1 border px-4 py-4 bg-white transition-all ${errors.recipientPhone ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                    </div>
                    {errors.recipientPhone && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.recipientPhone}</p>}
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="r-email" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">адрес електронної пошти<span className="text-inpost-red">*</span></label>
                    <input type="email" id="r-email" value={r.email} onChange={(e) => handleRecipientChange("email", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.recipientEmail ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                    {errors.recipientEmail && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.recipientEmail}</p>}
                  </div>
                  {postingType === 'locker-to-home' && (
                    <>
                      <div className="col-span-1">
                        <label htmlFor="r-postcode" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Поштовий індекс<span className="text-inpost-red">*</span></label>
                        <input type="text" id="r-postcode" value={r.postCode} onChange={(e) => handleRecipientChange("postCode", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.recipientPostCode ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                        {errors.recipientPostCode && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.recipientPostCode}</p>}
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="r-city" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Місто<span className="text-inpost-red">*</span></label>
                        <input type="text" id="r-city" value={r.city} onChange={(e) => handleRecipientChange("city", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.recipientCity ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                        {errors.recipientCity && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.recipientCity}</p>}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="r-street" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Вулиця<span className="text-inpost-red">*</span></label>
                        <input type="text" id="r-street" value={r.street} onChange={(e) => handleRecipientChange("street", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.recipientStreet ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                        {errors.recipientStreet && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.recipientStreet}</p>}
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="r-building" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Номер будинку<span className="text-inpost-red">*</span></label>
                        <input type="text" id="r-building" value={r.buildingNumber} onChange={(e) => handleRecipientChange("buildingNumber", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.recipientBuildingNumber ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                        {errors.recipientBuildingNumber && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.recipientBuildingNumber}</p>}
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="r-unit" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Номер квартири <span className="font-bold text-inpost-black">(необов'язково)</span></label>
                        <input type="text" id="r-unit" value={r.unitNumber} onChange={(e) => handleRecipientChange("unitNumber", e.target.value)} className="w-full border px-4 py-4 bg-white transition-all border-inpost-gray focus:border-2 focus:border-blue-600" />
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <label htmlFor="r-additional" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Додаткова інформація для кур'єра <span className="font-bold text-inpost-black">(необов'язково)</span></label>
                    <textarea
                      id="r-additional"
                      value={r.additionalInfo}
                      onChange={(e) => { if (e.target.value.length <= 180) handleRecipientChange("additionalInfo", e.target.value); }}
                      className="w-full border px-4 py-4 bg-white resize-none h-14 transition-all border-inpost-gray focus:border-2 focus:border-blue-600 outline-none"
                      maxLength={180}
                    />
                    <div className="flex justify-between items-center gap-3 mt-2">
                      <p className="text-[12px] font-medium text-inpost-gray">В цьому розділі ви можете залишити додаткову інформацію для кур'єра, наприклад, номер під'їзду або поверху.</p>
                      <span className="text-[11px] font-bold text-inpost-gray">{r.additionalInfo.length}/180</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SENDER */}
              <section>
                <h2 className="text-2xl font-black text-inpost-black mb-8  tracking-tight">Відправник</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="col-span-1">
                    <label htmlFor="s-name" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Ім’я<span className="text-inpost-red">*</span></label>
                    <input type="text" id="s-name" value={s.name} onChange={(e) => handleSenderChange("name", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.senderName ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                    {errors.senderName && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.senderName}</p>}
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="s-surname" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Прізвище<span className="text-inpost-red">*</span></label>
                    <input type="text" id="s-surname" value={s.surname} onChange={(e) => handleSenderChange("surname", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.senderSurname ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                    {errors.senderSurname && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.senderSurname}</p>}
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="s-company" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Назва фірми (додатково)</label>
                    <input type="text" id="s-company" value={s.companyName} onChange={(e) => handleSenderChange("companyName", e.target.value)} className="w-full border px-4 py-4 bg-white transition-all border-inpost-gray focus:border-2 focus:border-blue-600" />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="s-phone" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">Телефонний номер<span className="text-inpost-red">*</span></label>
                    <div className="flex gap-2">
                      <div role="button" tabIndex={0} className="flex items-center border border-inpost-gray px-3 py-4 bg-white gap-2 min-w-[100px] hover:border-blue-600 transition-all">
                        <Image src="/pl-lang.png" alt="PL" width={22} height={14} className="w-5 h-auto object-cover rounded-sm" />
                        <span className="text-[14px] font-bold">+48</span>
                        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1L5 5L9 1" stroke="#1D1D1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <input type="tel" id="s-phone" value={s.phone} onChange={(e) => handleSenderChange("phone", e.target.value)} className={`flex-1 border px-4 py-4 bg-white transition-all ${errors.senderPhone ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                    </div>
                    {errors.senderPhone && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.senderPhone}</p>}
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="s-email" className="block text-[15px] font-bold text-inpost-black mb-2  tracking-wide">адрес електронної пошти<span className="text-inpost-red">*</span></label>
                    <input type="email" id="s-email" value={s.email} onChange={(e) => handleSenderChange("email", e.target.value)} className={`w-full border px-4 py-4 bg-white transition-all ${errors.senderEmail ? "border-inpost-red" : "border-inpost-gray focus:border-2 focus:border-blue-600"}`} />
                    {errors.senderEmail && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.senderEmail}</p>}
                  </div>

                </div>
              </section>
            </div>

            {/* ---- GDPR & CONSENTS ---- */}
            <div className="mt-6">
              <p className="text-[10px] text-inpost-black leading-relaxed mb-10 font-medium opacity-70">
                Адміністратором Ваших персональних даних є компанія InPost Sp. z o.o. (ul. Pana Tadeusza 4, 30-727 Kraków). Ми призначили інспектора з захисту персональних даних, з яким Ви можете зв'язатися електронною поштою: <button type="button" onClick={() => window.location.href = 'mailto:dane_osobowe@inpost.pl'} className="text-inpost-black underline">dane_osobowe@inpost.pl</button>. Ми обробляємо Ваші персональні дані з метою надання послуги «Швидке відправлення», зокрема в частині відправлення та доставки посилки, а також для зв'язку з питань, пов'язаних з її обслуговуванням. Підставою для обробки даних є ст. 6 п. 1 літ. b GDPR (необхідність для виконання договору). Дані можуть передаватися суб'єктам, що підтримують надання послуги, зокрема постачальникам IT-рішень, операторам платежів та суб'єктам, що здійснюють логістичне обслуговування. Ви маєте право на доступ до даних, їх виправлення, видалення, обмеження обробки та перенесення даних, а також право подати скаргу до Голови Управління з захисту персональних даних. Детальну інформацію щодо обробки персональних даних, включаючи контактні дані адміністратора та інспектора з захисту даних, ви знайдете в <button type="button" className="text-inpost-black underline px-0 p-0">Політиці конфіденційності InPost</button>.
              </p>

              <h2 className="text-[24px] font-bold text-inpost-black mb-8 tracking-tight">Згоди</h2>

              <div className="space-y-10">
                <div className="flex items-start gap-4">
                  <input type="checkbox" id="consent-terms" className="custom-checkbox mt-1" checked={c.termsAccepted} onChange={(e) => handleConsentChange("termsAccepted", e.target.checked)} />
                  <div className="flex-1">
                    <label htmlFor="consent-terms" className="text-[13px] font-medium text-inpost-black leading-snug block">
                      <span className="text-inpost-red font-medium">*</span> Ознайомився/лась з Правилами надання поштових та транспортних послуг через InPost Sp. z o.o. і я приймаю їх зміст.
                    </label>
                    {errors.termsAccepted && <p className="error-message" role="alert"><span className="error-icon">!</span>{errors.termsAccepted}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[13px] font-medium text-inpost-black leading-snug">У нас відбувається багато хорошого. Хочете бути в курсі подій?</p>
                  <p className="text-[13px] font-medium text-inpost-black leading-snug">
                    Якщо так, погодьтеся отримувати від InPost sp.z o.o. інформацію про акції, продукти та послуги InPost sp.z o.o., інших компаній групи Integer та організацій, які співпрацюють з цими компаніями через:
                  </p>
                  <div className="space-y-4 pt-4">
                    <label htmlFor="consent-email" className="flex items-center gap-4 cursor-pointer group">
                      <input type="checkbox" id="consent-email" className="custom-checkbox" checked={c.emailMarketing} onChange={(e) => handleConsentChange("emailMarketing", e.target.checked)} />
                      <span className="text-[13px] font-medium text-inpost-black group-hover:text-black">адрес електронної пошти</span>
                    </label>
                    <label htmlFor="consent-sms" className="flex items-center gap-4 cursor-pointer group">
                      <input type="checkbox" id="consent-sms" className="custom-checkbox" checked={c.smsMarketing} onChange={(e) => handleConsentChange("smsMarketing", e.target.checked)} />
                      <span className="text-[12px] font-medium text-inpost-black group-hover:text-black">SMS/MMS</span>
                    </label>
                  </div>
                </div>

                <p className="text-[13px] text-inpost-black leading-relaxed font-medium opacity-80">
                  Вищезазначені згоди є добровільними. Ви можете відкликати їх у будь-який час, надіславши запит на електронну адресу: dane_osobowe@inpost.pl. Відкликання згоди не впливає на законність обробки, здійсненої до її відкликання. Контролером ваших персональних даних є InPost sp.z o.o. з місцезнаходженням у м. Краків (30-727), за адресою: вул. Пана Тадеуша, 4. Додаткову інформацію про обробку персональних даних, у тому числі про ваші права, можна знайти в Політиці конфіденційності.
                </p>
              </div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN — SUMMARY SIDEBAR ===== */}
          <aside className="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-6">
            <div className="bg-white p-6 ">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[14px] font-semibold text-inpost-black tracking-widest">внутрішнє відправлення</p>
              </div>
              <h3 className="text-[32px] font-semibold text-inpost-black mb-4 leading-none">Підсумок</h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-inpost-black">Спосіб доставки</span>
                  <div className="flex items-center gap-2 bg-[#fcfcfc] p-1.5">
                    <Image src="/Parcel-status-icon-box_4.png" alt="Parcel Locker" width={40} height={40} className="shrink-0 h-auto" />
                    <span className="text-xs font-black text-inpost-black " aria-hidden="true">→</span>
                    {postingType === "locker-to-home" ? (
                      <Image src="/Parcel-status-icon.webp" alt="Parcel Locker" width={40} height={40} className="shrink-0 h-auto" />

                    ) : (
                      <Image src="/Parcel-status-icon-box_4.png" alt="Parcel Locker" width={40} height={40} className="shrink-0 h-auto" />
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-inpost-border-light">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[14px] font-semibold text-inpost-black">Розмір: {sizeLabel}</span>
                    <div className="text-right">
                      <span className="font-normal text-inpost-black text-sm">{price}</span>
                      <span className="text-[14px] font-normal ml-1">зл</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-[12px] font-semibold text-inpost-black mb-1  tracking-wide">Додаткове страхування</p>
                    <p className="text-[11px] text-inpost-gray font-medium leading-normal">Посилка покривається Додатковим <br /> страхуванням на суму 5000 зл.</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-inpost-border-light">
                  <label htmlFor="discount-code" className="flex items-center gap-3 cursor-pointer group mb-4">
                    <input type="checkbox" id="discount-code" className="custom-checkbox" checked={showDiscount} onChange={(e) => setShowDiscount(e.target.checked)} />
                    <span className="text-[13px] font-black text-inpost-black  tracking-wide">Маю код знижки</span>
                  </label>

                  {showDiscount && (
                    <div className="mb-6">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="w-full border border-gray-300 px-4 py-3 text-xl font-medium focus:outline-none focus:border-2 focus:border-[#007AFC]"
                      />
                      <p className="text-[11px] text-inpost-black mt-3 leading-snug font-medium">
                        За 30 днів до початку акції діє найнижча ціна на сайті szybkienadania.pl: {price} зл
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-inpost-black  mb-1">До оплати</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[20px] font-black text-inpost-black leading-none -ml-1 tracking-tight">{price}</span>
                      <span className="text-[16px] font-semibold text-inpost-black ">зл</span>
                    </div>
                  </div>



                </div>

              </div>

            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full mt-5 bg-inpost-yellow text-inpost-black font-black text-[15px]  tracking-widest py-5 px-8 cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Підсумок та платіж"}
            </button>
          </aside>
        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-inpost-black text-white pt-6 pb-6 mt-20">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Top Row: Brand and Links */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
            {/* Brand Section */}
            <div className="flex items-center gap-5">
              <Image src="/Inpost.svg" alt="InPost" width={110} height={30} className="h-10 w-auto" />
              <Image src="/footer_logo2.webp" alt="InPost" width={150} height={50} className="h-16 w-auto" />
            </div>

            {/* Navigation Links */}
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[14px] font-bold">
              <li><button type="button" className="hover:opacity-70 transition-opacity">Правила</button></li>
              <li><button type="button" className="hover:opacity-70 transition-opacity">Політика конфіденційності</button></li>
              <li><button type="button" className="hover:opacity-70 transition-opacity">Скарги</button></li>
              <li><button type="button" className="hover:opacity-70 transition-opacity">Допомога</button></li>
              <li><button type="button" className="hover:opacity-70 transition-opacity">Контакт</button></li>
            </ul>
          </div>

          {/* Contact Section: Hotline and Hours (Indented to match brand text) */}
          <div className="md:pl-[130px] mb-4">
            <div className="flex flex-col gap-6">
              {/* Hotline Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-x-4 gap-y-2">
                <span className="font-bold text-[16px]">Гаряча лінія</span>
                <div className="flex items-center gap-6">
                  <a href="tel:722444000" className="flex items-center gap-2 font-medium text-[12px] group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-[15deg]"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    <span className="underline decoration-1 underline-offset-4">722 444 000</span>
                  </a>
                  <a href="tel:746600000" className="flex items-center gap-2 font-medium text-[12px] group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-[15deg]"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    <span className="underline decoration-1 underline-offset-4">746 600 000</span>
                  </a>
                </div>
              </div>

              {/* Business Hours Rows */}
              <div className="flex flex-col gap-1 text-[12px] text-white/80">
                <p>Понеділок-п'ятниця 7:00 - 22:00</p>
                <p>Субота 8:00 - 20:00</p>
                <p>Неділя 8:00 - 18:00</p>
                <p>Святкові дні 8:00 - 16:00</p>
              </div>
            </div>
          </div>

          <hr className="mb-4 border-white" />

          {/* Bottom Row: Copyright Alignment */}
          <div className="flex justify-end">
            <p className="text-[12px] font-medium text-white tracking-tight">
              Вибір згоди | Copyright &copy; 2024 InPost S. A. Усі права захищено.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
