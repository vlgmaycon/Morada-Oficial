
import React from "react";
import {
  Navigate,
  Outlet,
} from "react-router-dom";

import AdminSidebar from "@/admin/components/AdminSidebar";
import useAuth from "@/auth/AuthContext";

const PERFIS_ADMINISTRATIVOS = [
  "admin",
  "sindico",
  "portaria",
];

export default function AdminLayout() {
  const { user, carregando } = useAuth();

  /*
   * =======================================================
   * AGUARDAR A RESTAURAÇÃO DA SESSÃO
   * =======================================================
   */

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F4EF]">
        <p className="text-sm font-medium text-[#595959]">
          Carregando sua sessão...
        </p>
      </div>
    );
  }

  /*
   * =======================================================
   * USUÁRIO NÃO AUTENTICADO
   * =======================================================
   */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * =======================================================
   * VALIDAR PERFIL
   * Admin, Síndico e Portaria podem entrar nesta área.
   * =======================================================
   */

  if (!PERFIS_ADMINISTRATIVOS.includes(user.role)) {
    if (user.role === "super_admin") {
      return (
        <Navigate
          to="/minha-area"
          replace
        />
      );
    }

    if (user.role === "morador") {
      return (
        <Navigate
          to="/morador"
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
   * ÁREA ADMINISTRATIVA
   * =======================================================
   */

  return (
    <div className="min-h-screen bg-[#F8F4EF]">
      <AdminSidebar />

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