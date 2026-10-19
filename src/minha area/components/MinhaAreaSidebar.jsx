import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Headset,
  Settings,
  LogOut,
} from "lucide-react";

import useAuth from "@/auth/AuthContext";
import logoApp from "@/assets/logo-morada-login-app.png";

const items = [
  {
    path: "/minha-area",
    label: "Início",
    icon: LayoutDashboard,
    end: true,
  },
  {
    path: "/minha-area/condominios",
    label: "Condomínios",
    icon: Building2,
  },
  {
    path: "/minha-area/chamados",
    label: "Chamados",
    icon: Headset,
  },
  {
    path: "/minha-area/configuracoes",
    label: "Configurações",
    icon: Settings,
  },
];

export default function MinhaAreaSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
        bg-white/20
        backdrop-blur-2xl
        shadow-[0_18px_50px_rgba(20,30,25,0.12)]
        lg:flex
      "
    >
      {/* =====================================================
          EFEITO DE VIDRO
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-b
          from-white/[0.10]
          via-white/[0.04]
          to-white/[0.02]
        "
      />

      {/* =====================================================
          LOGO
      ===================================================== */}

      <div
        className="
          relative
          shrink-0
          flex
          justify-center
          px-4
          pt-5
          pb-7
        "
      >
        <img
          src={logoApp}
          alt="Morada Oficial"
          className="
            w-full
            max-w-[235px]
            object-contain
            drop-shadow-[0_8px_22px_rgba(0,0,0,0.20)]
          "
        />
      </div>

      {/* =====================================================
          MENU
      ===================================================== */}

      <nav
        className="
          relative
          flex-1
          space-y-2
          overflow-y-auto
          px-4
          pb-4
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
                isActive
                  ? `
                    flex
                    items-center
                    gap-4
                    rounded-xl
                    bg-[#6F9272]
                    px-4
                    py-3
                    text-[14px]
                    font-semibold
                    text-[#FFFFFF]
                    shadow-[0_8px_22px_rgba(111,146,114,0.22)]
                    transition-all
                    duration-300
                    hover:bg-[#5C7D60]
                  `
                  : `
                    flex
                    items-center
                    gap-4
                    rounded-xl
                    px-4
                    py-3
                    text-[14px]
                    font-medium
                    text-[#FFFFFF]
                    transition-all
                    duration-300
                    hover:bg-white/[0.09]
                    hover:text-[#FFFFFF]
                  `
              }
            >
              <Icon
                className="
                  h-[22px]
                  w-[22px]
                  shrink-0
                  text-[#FFFFFF]
                "
                strokeWidth={1.8}
              />

              <span className="text-[#FFFFFF]">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* =====================================================
          BOTÃO SAIR
      ===================================================== */}

      <div
        className="
          relative
          shrink-0
          px-4
          py-5
        "
      >
        <button
          type="button"
          onClick={handleLogout}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[#6F9272]
            px-4
            py-3
            text-[14px]
            font-semibold
            text-[#FFFFFF]
            shadow-[0_8px_22px_rgba(111,146,114,0.20)]
            transition-all
            duration-300
            hover:bg-[#5C7D60]
            active:scale-[0.98]
          "
        >
          <LogOut
            className="
              h-[20px]
              w-[20px]
              text-[#FFFFFF]
            "
            strokeWidth={1.8}
          />

          <span className="text-[#FFFFFF]">
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}