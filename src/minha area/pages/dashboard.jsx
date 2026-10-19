import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  Building2,
  Users,
  ShieldCheck,
  Bell,
  ArrowRight,
} from "lucide-react";

import { db } from "@/auth/firebase";

import useAuth from "@/auth/AuthContext";

import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";

export default function Dashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [totais, setTotais] = useState({
    condominios: 0,
    moradores: 0,
    sindicos: 0,
    chamados: 0,
  });

  async function carregarResumo() {
    const resultado = {
      condominios: 0,
      moradores: 0,
      sindicos: 0,
      chamados: 0,
    };

    try {
      /* =====================================================
         CONDOMÍNIOS
      ===================================================== */

      try {
        const snap = await getCountFromServer(
          collection(db, "condominios")
        );

        resultado.condominios = snap.data().count;
      } catch (error) {
        console.warn(
          "Não foi possível consultar condomínios:",
          error
        );
      }

      /* =====================================================
         MORADORES
      ===================================================== */

      try {
        const snap = await getCountFromServer(
          query(
            collection(db, "usuarios"),
            where("role", "==", "morador")
          )
        );

        resultado.moradores = snap.data().count;
      } catch (error) {
        console.warn(
          "Não foi possível consultar moradores:",
          error
        );
      }

      /* =====================================================
         SÍNDICOS
      ===================================================== */

      try {
        const snap = await getCountFromServer(
          query(
            collection(db, "usuarios"),
            where("role", "==", "sindico")
          )
        );

        resultado.sindicos = snap.data().count;
      } catch (error) {
        console.warn(
          "Não foi possível consultar síndicos:",
          error
        );
      }

      /* =====================================================
         CHAMADOS
      ===================================================== */

      try {
        const snap = await getCountFromServer(
          collection(db, "chamados")
        );

        resultado.chamados = snap.data().count;
      } catch (error) {
        console.warn(
          "Não foi possível consultar chamados:",
          error
        );
      }

      setTotais(resultado);
    } catch (error) {
      console.error(
        "Erro ao carregar dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarResumo();
  }, []);

  const nomeUsuario =
    user?.nome ||
    user?.name ||
    "Usuário";

  return (
    <div className="space-y-6">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className="px-1 pt-1">

        <p
          className="
            text-sm
            font-medium
            text-[#6F8D7A]
          "
        >
          Minha Área
        </p>

        <h1
          className="
            mt-1
            text-3xl
            font-semibold
            tracking-[-0.02em]
            text-[#595959]
          "
        >
          Olá, {nomeUsuario}!
        </h1>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-[#8A8A8A]
          "
        >
          Bem-vindo de volta. Aqui está um resumo da
          plataforma Morada Oficial.
        </p>

      </div>

      {/* =====================================================
          INDICADORES
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        <ResumoCard
          icon={<Building2 size={21} />}
          titulo="Condomínios"
          valor={
            loading
              ? "--"
              : totais.condominios
          }
        />

        <ResumoCard
          icon={<Users size={21} />}
          titulo="Moradores"
          valor={
            loading
              ? "--"
              : totais.moradores
          }
        />

        <ResumoCard
          icon={<ShieldCheck size={21} />}
          titulo="Síndicos"
          valor={
            loading
              ? "--"
              : totais.sindicos
          }
        />

        <ResumoCard
          icon={<Bell size={21} />}
          titulo="Chamados"
          valor={
            loading
              ? "--"
              : totais.chamados
          }
        />
      </div>

      {/* =====================================================
          AÇÕES RÁPIDAS
      ===================================================== */}

      <div
        className="
          rounded-[28px]
          bg-white
          p-6
          shadow-[0_10px_35px_rgba(40,52,44,0.08)]
        "
      >
        <div>
          <h2
            className="
              text-lg
              font-semibold
              text-[#595959]
            "
          >
            Ações rápidas
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-[#8A8A8A]
            "
          >
            Acesse rapidamente as principais
            funções administrativas.
          </p>
        </div>

        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-3
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          <AcaoCard
            titulo="Cadastrar condomínio"
            descricao="Adicione um novo condomínio à plataforma."
            to="/minha-area/condominios"
          />

          <AcaoCard
            titulo="Chamados"
            descricao="Consulte os chamados registrados."
            to="/minha-area/chamados"
          />

          <AcaoCard
            titulo="Configurações"
            descricao="Gerencie as configurações da Minha Área."
            to="/minha-area/configuracoes"
          />
        </div>
      </div>

      {/* =====================================================
          INFORMAÇÕES
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          xl:grid-cols-2
        "
      >

        {/* Próximos módulos */}

        <div
          className="
            rounded-[28px]
            bg-white
            p-6
            shadow-[0_10px_35px_rgba(40,52,44,0.08)]
          "
        >
          <h2
            className="
              text-lg
              font-semibold
              text-[#595959]
            "
          >
            Próximos módulos
          </h2>

          <div className="mt-5 space-y-3">
            <ModuloLinha
              titulo="Cadastro de condomínios"
              concluido
            />

            <ModuloLinha
              titulo="Cadastro de síndicos"
            />

            <ModuloLinha
              titulo="Cadastro de moradores"
            />

            <ModuloLinha
              titulo="Reservas de áreas comuns"
            />

            <ModuloLinha
              titulo="Encomendas e correspondências"
            />

            <ModuloLinha
              titulo="Comunicados e avisos"
            />
          </div>
        </div>

        {/* Status */}

        <div
          className="
            rounded-[28px]
            bg-white
            p-6
            shadow-[0_10px_35px_rgba(40,52,44,0.08)]
          "
        >
          <h2
            className="
              text-lg
              font-semibold
              text-[#595959]
            "
          >
            Status do sistema
          </h2>

          <div className="mt-5 space-y-4">
            <StatusLinha
              titulo="Firebase Authentication"
              status="Ativo"
            />

            <StatusLinha
              titulo="Firestore Database"
              status="Ativo"
            />

            <StatusLinha
              titulo="Firebase Storage"
              status="Ativo"
            />

            <StatusLinha
              titulo="Google Maps"
              status="Em preparação"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CARD DE INDICADOR
========================================================= */

function ResumoCard({
  icon,
  titulo,
  valor,
}) {
  return (
    <div
      className="
        rounded-[24px]
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(40,52,44,0.06)]
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-[#F3F6F4]
          text-[#6F8D7A]
        "
      >
        {icon}
      </div>

      <p
        className="
          mt-4
          text-xs
          font-medium
          text-[#8A8A8A]
        "
      >
        {titulo}
      </p>

      <p
        className="
          mt-1
          text-3xl
          font-semibold
          text-[#595959]
        "
      >
        {valor}
      </p>
    </div>
  );
}

/* =========================================================
   AÇÃO RÁPIDA
========================================================= */

function AcaoCard({
  titulo,
  descricao,
  to,
}) {
  return (
    <Link
      to={to}
      className="
        group
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-[#E8E3DD]
        bg-white
        p-4
        transition-all
        hover:bg-[#F7F2EB]
      "
    >
      <div>
        <h3
          className="
            text-sm
            font-semibold
            text-[#595959]
          "
        >
          {titulo}
        </h3>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-[#8A8A8A]
          "
        >
          {descricao}
        </p>
      </div>

      <ArrowRight
        size={17}
        className="
          shrink-0
          text-[#8A8A8A]
          transition-all
          group-hover:text-[#6F8D7A]
        "
      />
    </Link>
  );
}

/* =========================================================
   LINHA DE MÓDULO
========================================================= */

function ModuloLinha({
  titulo,
  concluido = false,
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-xl
        bg-[#F8F4EF]
        px-4
        py-3
      "
    >
      <span
        className={`
          flex
          h-5
          w-5
          items-center
          justify-center
          rounded-full
          text-[10px]
          font-bold
          ${
            concluido
              ? "bg-[#6F8D7A] text-white"
              : "border border-[#C9D4CD] bg-white text-[#8A8A8A]"
          }
        `}
      >
        {concluido ? "✓" : ""}
      </span>

      <span
        className="
          text-sm
          text-[#5E625D]
        "
      >
        {titulo}
      </span>
    </div>
  );
}

/* =========================================================
   LINHA DE STATUS
========================================================= */

function StatusLinha({
  titulo,
  status,
}) {
  const ativo = status === "Ativo";

  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
      "
    >
      <span
        className="
          text-sm
          text-[#5E625D]
        "
      >
        {titulo}
      </span>

      <span
        className={`
          rounded-full
          px-3
          py-1
          text-[11px]
          font-bold
          ${
            ativo
              ? "bg-[#F3F6F4] text-[#6F8D7A]"
              : "bg-[#F7F2EB] text-[#8A8A8A]"
          }
        `}
      >
        {status}
      </span>
    </div>
  );
}