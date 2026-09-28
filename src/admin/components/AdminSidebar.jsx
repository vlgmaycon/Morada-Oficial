import React from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Landmark,
  Package,
  CalendarDays,
  Megaphone,
  ShieldCheck,
  LogOut,
} from "lucide-react";

import useAuth from "@/auth/AuthContext";
import logoAdmin from "@/assets/logo-morada-admin.png";

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

export default function AdminSidebar() {
  const {
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

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
        top-5
        bottom-5
        z-40
        flex
        w-64
        flex-col
        rounded-[28px]
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(40,52,44,0.08)]
      "
    >
      {/* =====================================================
          LOGO
      ===================================================== */}

      <div className="shrink-0">
        <img
          src={logoAdmin}
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
          const Icon =
            item.icon;

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
          pt-2
        "
      >
        <button
          type="button"
          onClick={
            handleLogout
          }
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