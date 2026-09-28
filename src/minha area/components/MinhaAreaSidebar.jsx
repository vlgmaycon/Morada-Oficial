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
        border-white/10
        bg-black/20
        backdrop-blur-2xl
        shadow-[0_12px_35px_rgba(20,20,20,0.28)]
        lg:flex
      "
    >
      {/* =====================================================
          BRILHO INTERNO (igual Login)
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-b
          from-white/10
          via-transparent
          to-black/20
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
          pt-7
          pb-5
        "
      >
        <img
          src={logoApp}
          alt="Morada Oficial"
          className="
            w-full
            max-w-[210px]
            object-contain
            drop-shadow-[0_8px_22px_rgba(0,0,0,0.35)]
          "
        />
      </div>

      {/* Linha divisória */}
      <div className="mx-5 border-t border-white/10" />

      {/* =====================================================
          MENU
      ===================================================== */}

      <nav
        className="
          relative
          mt-4
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
                    gap-3
                    rounded-xl
                    bg-[#89A58F]
                    px-4
                    py-2.5
                    text-[13px]
                    font-semibold
                    text-white
                    transition-all
                    duration-300
                    shadow-[0_6px_18px_rgba(137,165,143,0.18)]
                  `
                  : `
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-2.5
                    text-[13px]
                    font-medium
                    text-white/85
                    transition-all
                    duration-300
                    hover:bg-white/10
                    hover:text-white
                  `
              }
            >
              <div
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-white/10
                "
              >
                <Icon
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />
              </div>

              <span>{item.label}</span>
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
          border-t
          border-white/10
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
            bg-[#89A58F]
            px-4
            py-2.5
            text-[13px]
            font-semibold
            text-white
            transition-all
            duration-300
            hover:bg-[#78967F]
            active:scale-[0.98]
          "
        >
          <LogOut
            className="h-4 w-4"
            strokeWidth={1.8}
          />

          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}