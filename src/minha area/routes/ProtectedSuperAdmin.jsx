import React from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import useAuth from "@/auth/AuthContext";

export default function ProtectedSuperAdmin({
  children,
}) {
  const {
    user,
    carregando,
    isSuperAdmin,
  } = useAuth();

  const location =
    useLocation();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F1]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6F8D7A]/30 border-t-[#6F8D7A]" />

          <p className="text-sm text-[#8A8A8A]">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  if (
    !user ||
    !isSuperAdmin ||
    user.ativo !== true
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return children;
}