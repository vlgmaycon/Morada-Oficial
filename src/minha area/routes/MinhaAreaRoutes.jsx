import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedSuperAdmin from "@/minha area/routes/ProtectedSuperAdmin";
import MinhaAreaLayout from "@/minha area/components/MinhaAreaLayout";

import Index from "@/minha area/pages/index";
import Dashboard from "@/minha area/pages/Dashboard";
import Condominios from "@/minha area/pages/Condominios";
import Chamados from "@/minha area/pages/Chamados";
import Configuracoes from "@/minha area/pages/Configuracoes";

export default function MinhaAreaRoutes() {
  return (
    <ProtectedSuperAdmin>
      <Routes>
        <Route element={<MinhaAreaLayout />}>
          {/* Página inicial da Minha Área */}
          <Route index element={<Index />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Condomínios */}
          <Route path="condominios" element={<Condominios />} />

          {/* Chamados */}
          <Route path="chamados" element={<Chamados />} />

          {/* Configurações */}
          <Route path="configuracoes" element={<Configuracoes />} />

          {/* Página não encontrada */}
          <Route path="*" element={<Navigate to="/minha-area" replace />} />
        </Route>
      </Routes>
    </ProtectedSuperAdmin>
  );
}