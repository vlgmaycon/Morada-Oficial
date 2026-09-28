import React from "react";
import logoLogin from "@/assets/logo-morada-app.png";

export default function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F6F1] px-6">
      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="mb-8 flex justify-center">
          <img
            src={logoLogin}
            alt="Morada"
            className="w-56"
          />
        </div>

        {/* TÍTULO */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#595959]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-sm text-[#8A8A8A]">
              {subtitle}
            </p>
          )}
        </div>

        {/* CONTEÚDO */}
        <div className="rounded-3xl border border-[#E8E5DD] bg-white p-10 shadow-xl">
          {children}
        </div>

        {/* RODAPÉ */}
        {footer && (
          <p className="mt-6 text-center text-sm text-[#595959]">
            {footer}
          </p>
        )}

      </div>
    </div>
  );
}