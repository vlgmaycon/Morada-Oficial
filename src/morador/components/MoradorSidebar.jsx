import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  Home,
  CreditCard,
  KeyRound,
  Package,
  Megaphone,
  CalendarDays,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";

import useAuth from "@/auth/AuthContext";
import logoMorador from "@/assets/logo-morada-morador.png";

const items = [
  {
    path: "/morador",
    label: "Início",
    icon: Home,
    end: true,
  },
  {
    path: "/morador/boletos",
    label: "Boletos",
    icon: CreditCard,
  },
  {
    path: "/morador/visitantes",
    label: "Visitantes",
    icon: KeyRound,
  },
  {
    path: "/morador/entregas",
    label: "Entregas",
    icon: Package,
  },
  {
    path: "/morador/comunicados",
    label: "Comunicados",
    icon: Megaphone,
  },
  {
    path: "/morador/reservas",
    label: "Reservas",
    icon: CalendarDays,
  },
  {
    path: "/morador/seguranca",
    label: "Segurança",
    icon: ShieldCheck,
  },
  {
    path: "/morador/configuracoes",
    label: "Configurações",
    icon: Settings,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
        bg-[#2A3530]/45
        backdrop-blur-2xl
        shadow-[0_18px_50px_rgba(0,0,0,0.20)]
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
          from-white/[0.08]
          via-white/[0.02]
          to-black/[0.12]
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
          src={logoMorador}
          alt="Morada"
          className="
            w-full
            max-w-[235px]
            object-contain
            drop-shadow-[0_8px_22px_rgba(0,0,0,0.28)]
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
                    w-full
                    items-center
                    gap-4
                    rounded-xl
                    bg-[#89A58F]
                    px-4
                    py-3
                    text-[13px]
                    font-semibold
                    text-white
                    shadow-[0_8px_22px_rgba(137,165,143,0.18)]
                    transition-all
                    duration-300
                  `
                  : `
                    flex
                    w-full
                    items-center
                    gap-4
                    rounded-xl
                    px-4
                    py-3
                    text-[13px]
                    font-medium
                    text-white/80
                    transition-all
                    duration-300
                    hover:bg-white/[0.07]
                    hover:text-white
                  `
              }
            >
              <Icon
                className="
                  h-[20px]
                  w-[20px]
                  shrink-0
                "
                strokeWidth={1.8}
              />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* =====================================================
          SAIR
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
            bg-[#89A58F]
            px-4
            py-3
            text-[13px]
            font-semibold
            text-white
            shadow-[0_8px_22px_rgba(137,165,143,0.14)]
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