"use client";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-6">
      <div className="bg-white shadow-2xl rounded-3xl max-w-5xl w-full overflow-hidden grid lg:grid-cols-[1.05fr,0.95fr]">
        <div className="p-8 sm:p-12 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
            {t("home.kicker", "Code de la Route Tunisien")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            {t("home.title", "Driving School System")}
          </h1>
          <p className="text-base text-gray-700 leading-relaxed">
            {t(
              "home.subtitle",
              "Manage your driving school with ease and keep students on track for their exams."
            )}
          </p>
          <p
            className="text-lg font-semibold text-gray-900 leading-relaxed"
            lang="ar"
            dir="rtl"
          >
            {t(
              "home.subtitle.ar",
              "نظام متكامل لإدارة مدارس تعليم السياقة ودعم المتدربين للنجاح في اختبارات رخصة القيادة."
            )}
          </p>
        </div>

        <div className="relative min-h-[260px] bg-gradient-to-br from-red-50 via-white to-blue-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(231,0,19,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.08),transparent_30%)]" />
          <div className="relative h-full w-full flex items-center justify-center p-10">
            <Image
              src="/globe.svg"
              alt="Driving school management illustration"
              fill
              className="object-contain drop-shadow-lg"
              sizes="(max-width: 1024px) 100vw, 480px"
              priority
            />
          </div>
        </div>
      </div>
    </main>
  );
}
