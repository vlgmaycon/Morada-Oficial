import React from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

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

export default function MoradorSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }

  return (
    <aside
      className="
        fixed
        left-5
        top-[5vh]
        z-40
        flex
        h-[90vh]
        w-64
        flex-col
        rounded-[28px]
        bg-white
        p-5
        shadow-[0_12px_40px_rgba(0,0,0,0.08)]
      "
    >
      {/* =====================================================
          LOGO
      ===================================================== */}

      <div className="shrink-0">
        <img
          src={logoMorador}
          alt="Morada"
          className="w-full max-w-[180px] object-contain"
        />
      </div>

      {/* =====================================================
          MENU
      ===================================================== */}

      <nav
        className="
          mt-8
          flex-1
          space-y-1
          overflow-y-auto
          pr-1
        "
      >
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({
                isActive,
              }) =>
                isActive
                  ? `
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    bg-[#6F8D7A]
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition-all
                  `
                  : `
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-[#5E625D]
                    transition-all
                    hover:bg-[#F7F2EB]
                  `
              }
            >
              <Icon className="h-5 w-5 shrink-0" />

              <span>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* =====================================================
          SAIR
      ===================================================== */}

      <div
        className="
          mt-4
          shrink-0
          border-t
          border-[#F0ECE7]
          pt-4
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
            bg-[#6F8D7A]
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition-all
            hover:bg-[#5F7D6A]
            active:scale-[0.98]
          "
        >
          <LogOut className="h-4 w-4" />

          <span>
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}