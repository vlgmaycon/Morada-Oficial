import React from "react";
import {
  Routes,
  Route,
} from "react-router-dom";

import AdminLayout from "@/admin/components/AdminLayout";

function AdminEmConstrucao() {
  return (
    <div className="rounded-3xl border border-[#E8E5DD] bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-[#595959]">
        Área Administrativa
      </h1>

      <p className="mt-2 text-sm text-[#8A8A8A]">
        Esta área será migrada do Morada 2.0.
      </p>
    </div>
  );
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route
        element={
          <AdminLayout />
        }
      >
        <Route
          index
          element={
            <AdminEmConstrucao />
          }
        />

        <Route
          path="*"
          element={
            <AdminEmConstrucao />
          }
        />
      </Route>
    </Routes>
  );
}