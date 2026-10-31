import React from "react";
import {
  Routes,
  Route,
} from "react-router-dom";

import AdminLayout from "@/admin/components/AdminLayout";
import Cadastros from "@/admin/pages/Cadastros";

function AdminEmConstrucao() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-xl backdrop-blur-2xl">
      <h1 className="text-2xl font-semibold text-white">
        Área Administrativa
      </h1>

      <p className="mt-2 text-sm text-white/55">
        Esta funcionalidade será desenvolvida nas próximas etapas.
      </p>
    </div>
  );
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        {/* Início */}
        <Route
          index
          element={<AdminEmConstrucao />}
        />

        {/* Cadastros */}
        <Route
          path="cadastros"
          element={<Cadastros />}
        />

        {/* Demais páginas */}
        <Route
          path="*"
          element={<AdminEmConstrucao />}
        />
      </Route>
    </Routes>
  );
}