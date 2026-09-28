import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "@/app/pages/Login";
import ForgotPassword from "@/app/pages/ForgotPassword";
import Register from "@/app/pages/Register";
import ResetPassword from "@/app/pages/ResetPassword";

import AdminRoutes from "@/admin/routes/AdminRoutes";
import MoradorRoutes from "@/morador/routes/MoradorRoutes";
import MinhaAreaRoutes from "@/minha area/routes/MinhaAreaRoutes";

export default function AppRoutes() {
  return (
    <Routes>

      {/* =================================================
          AUTENTICAÇÃO
      ================================================= */}

      <Route
        path="/"
        element={
          <Login />
        }
      />

      <Route
        path="/login"
        element={
          <Login />
        }
      />

      <Route
        path="/forgot-password"
        element={
          <ForgotPassword />
        }
      />

      <Route
        path="/register"
        element={
          <Register />
        }
      />

      <Route
        path="/reset-password"
        element={
          <ResetPassword />
        }
      />

      {/* =================================================
          ÁREA ADMINISTRATIVA
      ================================================= */}

      <Route
        path="/admin/*"
        element={
          <AdminRoutes />
        }
      />

      {/* =================================================
          ÁREA DO MORADOR
      ================================================= */}

      <Route
        path="/morador/*"
        element={
          <MoradorRoutes />
        }
      />

      {/* =================================================
          MINHA ÁREA
          Exclusiva do Super Admin
      ================================================= */}

      <Route
        path="/minha-area/*"
        element={
          <MinhaAreaRoutes />
        }
      />

      {/* =================================================
          ROTA NÃO ENCONTRADA
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}