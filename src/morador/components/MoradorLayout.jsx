import React from "react";
import {
  Navigate,
  Outlet,
} from "react-router-dom";

import MoradorSidebar from "@/morador/components/MoradorSidebar";
import useAuth from "@/auth/AuthContext";

export default function MoradorLayout() {
  const { user } = useAuth();

  /*
   * =======================================================
   * PROTEÇÃO DA ÁREA DO MORADOR
   * =======================================================
   *
   * Sem usuário autenticado:
   * -> vai para o login.
   *
   * Usuário administrador:
   * -> vai para a área administrativa.
   *
   * Somente usuário com role "morador":
   * -> permanece na área do morador.
   */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role !== "morador") {
    if (user.role === "admin") {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * =======================================================
   * ÁREA DO MORADOR
   * =======================================================
   */

  return (
    <div className="min-h-screen bg-[#F8F4EF]">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <MoradorSidebar />

      {/* =================================================
          CONTEÚDO
      ================================================= */}

      <main className="min-h-screen lg:ml-64">
        <div className="px-5 py-6 lg:px-10 lg:py-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}