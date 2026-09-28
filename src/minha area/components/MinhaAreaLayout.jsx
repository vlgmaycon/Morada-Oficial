import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import MinhaAreaSidebar from "@/minha area/components/MinhaAreaSidebar";
import useAuth from "@/auth/AuthContext";

import fundoMorada from "@/assets/fundo-morada-app.png";

export default function MinhaAreaLayout() {
  const { user, isSuperAdmin } = useAuth();

  /* =======================================================
     PROTEÇÃO DA MINHA ÁREA
  ======================================================= */

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin || user.ativo !== true) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* =====================================================
          IMAGEM DE FUNDO (TELA INTEIRA)
      ===================================================== */}

      <div
        className="fixed inset-0 -z-30 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${fundoMorada})`,
        }}
      />

      {/* =====================================================
          OVERLAY ESCURO (igual ao Login)
      ===================================================== */}

      <div
        className="
          fixed
          inset-0
          -z-20
          bg-[linear-gradient(110deg,rgba(6,10,12,0.72)_0%,rgba(10,16,18,0.45)_38%,rgba(14,22,25,0.60)_100%)]
        "
      />

      {/* =====================================================
          BLUR SUAVE SOBRE TODA A FOTO
      ===================================================== */}

      <div
        className="
          fixed
          inset-0
          -z-10
          backdrop-blur-[6px]
        "
      />

      {/* =====================================================
          SIDEBAR (permanece igual)
      ===================================================== */}

      <MinhaAreaSidebar />

      {/* =====================================================
          CONTEÚDO DA APLICAÇÃO
      ===================================================== */}

      <main
        className="
          relative
          min-h-screen
          w-full
          px-4
          py-5
          sm:px-5
          sm:py-6
          lg:pl-[300px]
          lg:pr-8
          lg:py-8
          xl:pr-10
        "
      >
        {/* Blur suave somente atrás do conteúdo */}
        <div
          className="
            absolute
            inset-0
            rounded-[32px]
            bg-white/[0.02]
            backdrop-blur-[2px]
            pointer-events-none
          "
        />

        {/* Conteúdo */}
        <div className="relative z-10 w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}