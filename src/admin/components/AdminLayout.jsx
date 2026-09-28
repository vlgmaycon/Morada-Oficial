import React from "react";
import {
  Navigate,
  Outlet,
} from "react-router-dom";

import AdminSidebar from "@/admin/components/AdminSidebar";
import useAuth from "@/auth/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();

  /*
   * =======================================================
   * PROTEÇÃO DA ÁREA ADMINISTRATIVA
   * =======================================================
   *
   * Sem usuário autenticado:
   * -> vai para o login.
   *
   * Usuário que não seja administrador:
   * -> volta para a página inicial.
   *
   * Somente usuário com role "admin":
   * -> permanece no painel administrativo.
   */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EF]">

      {/* =================================================
          SIDEBAR ADMINISTRATIVA
      ================================================= */}

      <AdminSidebar />

      {/* =================================================
          CONTEÚDO
      ================================================= */}

      <main
        className="
          min-h-screen
          w-full
          px-5
          py-6
          lg:pl-[300px]
          lg:pr-8
          lg:py-8
          xl:pr-10
        "
      >
        <Outlet />
      </main>

    </div>
  );
}