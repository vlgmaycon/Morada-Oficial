import React from "react";
import {
  Routes,
  Route,
} from "react-router-dom";

import MoradorLayout from "@/morador/components/MoradorLayout";

function MoradorEmConstrucao() {
  return (
    <div className="rounded-3xl border border-[#E8E5DD] bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-[#595959]">
        Área do Morador
      </h1>

      <p className="mt-2 text-sm text-[#8A8A8A]">
        Esta área será migrada do Morada 2.0.
      </p>
    </div>
  );
}

export default function MoradorRoutes() {
  return (
    <Routes>
      <Route
        element={
          <MoradorLayout />
        }
      >
        <Route
          index
          element={
            <MoradorEmConstrucao />
          }
        />

        <Route
          path="*"
          element={
            <MoradorEmConstrucao />
          }
        />
      </Route>
    </Routes>
  );
}