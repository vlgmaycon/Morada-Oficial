
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Building2,
  Landmark,
  Package,
  CalendarDays,
  Megaphone,
  ShieldCheck,
  LogOut,
} from "lucide-react";

import useAuth from "@/auth/AuthContext";

import logoAdmin from "@/assets/logo-morada-admin.png";
import logoMorada from "@/assets/logo-morada-app.png";

/* ======================================================
   IDENTIDADE VISUAL MORADA OFICIAL
====================================================== */

const VERDE = "#6F9272";
const VERDE_HOVER = "#5C7D60";

/* ======================================================
   MENU ADMINISTRATIVO
====================================================== */

const items = [
  {
    path: "/admin",
    label: "Início",
    icon: LayoutDashboard,
    end: true,
  },
  {
    path: "/admin/cadastros",
    label: "Cadastros",
    icon: Users,
  },
  {
    path: "/admin/condominio",
    label: "Condomínio",
    icon: Building2,
  },
  {
    path: "/admin/financeiro",
    label: "Financeiro",
    icon: Landmark,
  },
  {
    path: "/admin/entregas",
    label: "Entregas",
    icon: Package,
  },
  {
    path: "/admin/reservas",
    label: "Reservas",
    icon: CalendarDays,
  },
  {
    path: "/admin/comunicacao",
    label: "Comunicados",
    icon: Megaphone,
  },
  {
    path: "/admin/seguranca",
    label: "Segurança",
    icon: ShieldCheck,
  },
];

/* ======================================================
   SIDEBAR ADMIN
====================================================== */

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  /* ====================================================
     SAIR DA CONTA
  ==================================================== */

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <aside
      className="
        fixed
        left-5
        top-5
        bottom-5
        z-40
        hidden
        w-64
        flex-col
        overflow-hidden
        rounded-[28px]
        border
        border-white/15
        bg-[#18241F]/55
        shadow-[0_18px_50px_rgba(0,0,0,0.28)]
        backdrop-blur-2xl
        lg:flex
      "
    >
      {/* =================================================
          CAMADA DE VIDRO
      ================================================= */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          z-0
          bg-gradient-to-b
          from-white/[0.10]
          via-white/[0.025]
          to-black/[0.20]
        "
      />

      {/* BRILHO SUTIL */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          z-0
          h-40
          bg-gradient-to-b
          from-white/[0.045]
          to-transparent
        "
      />

      {/* =================================================
          LOGO
      ================================================= */}

      <div
        className="
          relative
          z-10
          flex
          shrink-0
          items-center
          justify-center
          px-4
          pb-7
          pt-6
        "
      >
        <img
          src={logoAdmin}
          alt="Morada Administração"
          onError={(event) => {
            const imagem = event.currentTarget;

            if (imagem.dataset.fallbackApplied !== "true") {
              imagem.dataset.fallbackApplied = "true";
              imagem.src = logoMorada;
            }
          }}
          className="
            block
            h-auto
            w-full
            max-w-[225px]
            object-contain
            drop-shadow-[0_8px_24px_rgba(0,0,0,0.30)]
          "
        />
      </div>

      {/* =================================================
          NAVEGAÇÃO
      ================================================= */}

      <nav
        aria-label="Menu administrativo"
        className="
          relative
          z-10
          min-h-0
          flex-1
          space-y-2
          overflow-y-auto
          px-4
          pb-5
        "
      >
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `
                  group
                  flex
                  min-h-[46px]
                  w-full
                  items-center
                  gap-4
                  rounded-xl
                  px-4
                  py-3
                  text-[13px]
                  transition-all
                  duration-300
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#6F9272]
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-transparent
                  ${
                    isActive
                      ? `
                        bg-[#6F9272]
                        font-semibold
                        text-white
                        shadow-[0_8px_22px_rgba(111,146,114,0.25)]
                      `
                      : `
                        bg-transparent
                        font-medium
                        text-white/80
                        hover:bg-white/[0.09]
                        hover:text-white
                      `
                  }
                `
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`
                      h-5
                      w-5
                      shrink-0
                      transition-colors
                      duration-300
                      ${
                        isActive
                          ? "text-white"
                          : "text-white/85 group-hover:text-white"
                      }
                    `}
                    strokeWidth={1.8}
                  />

                  <span className="truncate">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* =================================================
          BOTÃO SAIR
      ================================================= */}

      <div
        className="
          relative
          z-10
          shrink-0
          px-4
          pb-5
          pt-3
        "
      >
        <button
          type="button"
          onClick={handleLogout}
          className="
            flex
            min-h-[46px]
            w-full
            items-center
            justify-center
            gap-3
            rounded-xl
            bg-[#6F9272]
            px-4
            py-3
            text-[13px]
            font-semibold
            text-white
            shadow-[0_8px_22px_rgba(111,146,114,0.18)]
            transition-all
            duration-300
            hover:bg-[#5C7D60]
            hover:shadow-[0_8px_24px_rgba(111,146,114,0.28)]
            active:scale-[0.98]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-white/70
          "
        >
          <LogOut
            className="h-[18px] w-[18px]"
            strokeWidth={1.8}
          />

          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
