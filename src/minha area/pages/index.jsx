import React, {
  useEffect,
  useState,
} from "react";

import {
  Building2,
  Users,
  ShieldCheck,
  Headset,
  CheckCircle2,
  Clock3,
  CircleAlert,
} from "lucide-react";

import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/auth/firebase";
import useAuth from "@/auth/AuthContext";

/* ======================================================
   SEÇÕES DO DASHBOARD
====================================================== */

const secoes = [
  {
    id: "condominios",
    titulo: "Condomínios",
    descricao: "Resumo dos condomínios da plataforma.",
    icone: Building2,
  },
  {
    id: "chamados",
    titulo: "Chamados",
    descricao: "Resumo dos chamados registrados.",
    icone: Headset,
  },
  {
    id: "moradores",
    titulo: "Moradores",
    descricao: "Resumo dos moradores cadastrados.",
    icone: Users,
  },
  {
    id: "sindicos",
    titulo: "Síndicos",
    descricao: "Resumo dos síndicos cadastrados.",
    icone: ShieldCheck,
  },
];

/* ======================================================
   DASHBOARD
====================================================== */

export default function MinhaArea() {
  const { user } = useAuth();

  const [selecionado, setSelecionado] =
    useState("condominios");

  const [dados, setDados] = useState({
    condominios: {
      total: 0,
      ativos: 0,
      inativos: 0,
    },

    chamados: {
      total: 0,
      respondidos: 0,
      aguardando: 0,
    },

    moradores: {
      total: 0,
      ativos: 0,
      inativos: 0,
    },

    sindicos: {
      total: 0,
      ativos: 0,
      inativos: 0,
    },
  });

  const [carregando, setCarregando] =
    useState(true);

  /* ======================================================
     CARREGAR DADOS
  ====================================================== */

  async function carregarDashboard() {
    try {
      setCarregando(true);

      /* ================================================
         CONDOMÍNIOS
      ================================================ */

      try {
        const totalSnap =
          await getCountFromServer(
            collection(db, "condominios")
          );

        const ativosSnap =
          await getCountFromServer(
            query(
              collection(db, "condominios"),
              where("ativo", "==", true)
            )
          );

        const total =
          totalSnap.data().count;

        const ativos =
          ativosSnap.data().count;

        setDados((atual) => ({
          ...atual,
          condominios: {
            total,
            ativos,
            inativos: total - ativos,
          },
        }));
      } catch (error) {
        console.warn(
          "Não foi possível consultar condomínios:",
          error
        );
      }

      /* ================================================
         MORADORES
      ================================================ */

      try {
        const totalSnap =
          await getCountFromServer(
            query(
              collection(db, "usuarios"),
              where("role", "==", "morador")
            )
          );

        const ativosSnap =
          await getCountFromServer(
            query(
              collection(db, "usuarios"),
              where("role", "==", "morador"),
              where("ativo", "==", true)
            )
          );

        const total =
          totalSnap.data().count;

        const ativos =
          ativosSnap.data().count;

        setDados((atual) => ({
          ...atual,
          moradores: {
            total,
            ativos,
            inativos: total - ativos,
          },
        }));
      } catch (error) {
        console.warn(
          "Não foi possível consultar moradores:",
          error
        );
      }

      /* ================================================
         SÍNDICOS
      ================================================ */

      try {
        const totalSnap =
          await getCountFromServer(
            query(
              collection(db, "usuarios"),
              where("role", "==", "sindico")
            )
          );

        const ativosSnap =
          await getCountFromServer(
            query(
              collection(db, "usuarios"),
              where("role", "==", "sindico"),
              where("ativo", "==", true)
            )
          );

        const total =
          totalSnap.data().count;

        const ativos =
          ativosSnap.data().count;

        setDados((atual) => ({
          ...atual,
          sindicos: {
            total,
            ativos,
            inativos: total - ativos,
          },
        }));
      } catch (error) {
        console.warn(
          "Não foi possível consultar síndicos:",
          error
        );
      }

      /* ================================================
         CHAMADOS
      ================================================ */

      try {
        const totalSnap =
          await getCountFromServer(
            collection(db, "chamados")
          );

        setDados((atual) => ({
          ...atual,
          chamados: {
            ...atual.chamados,
            total: totalSnap.data().count,
          },
        }));
      } catch (error) {
        console.warn(
          "Não foi possível consultar chamados:",
          error
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  /* ======================================================
     CARREGAMENTO INICIAL
  ====================================================== */

  useEffect(() => {
    carregarDashboard();
  }, []);

  /* ======================================================
     SEÇÃO ATUAL
  ====================================================== */

  const secaoAtual =
    secoes.find(
      (item) => item.id === selecionado
    ) || secoes[0];

  const IconeSecao = secaoAtual.icone;

  /* ======================================================
     USUÁRIO
  ====================================================== */

  const nomeUsuario =
    user?.nome ||
    user?.name ||
    "Usuário";

  const primeiroNome =
    nomeUsuario.trim().split(" ")[0];

  /* ======================================================
     DADOS DA SEÇÃO ATUAL
  ====================================================== */

  const dadosSecao = dados[selecionado];

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="morada-enter space-y-6">

      {/* ==================================================
          CABEÇALHO
      ================================================== */}

      <header className="px-1 pt-1">
        <h1
          className="
            text-3xl
            font-semibold
            tracking-[-0.02em]
            text-[#FFFFFF]
          "
        >
          Olá, {primeiroNome}!
        </h1>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-[#FFFFFF]
          "
        >
          Bem-vindo de volta. Aqui está o resumo da
          plataforma Morada Oficial.
        </p>
      </header>

      {/* ==================================================
          BARRA DE SELEÇÃO
          Mesmo padrão visual de Chamados
      ================================================== */}

      <section
        className="
          overflow-hidden
          rounded-2xl
          border-2
          border-[#6F9272]
          bg-transparent
          p-1
        "
      >
        <div
          className="
            grid
            grid-cols-2
            gap-1
            sm:grid-cols-4
          "
        >
          {secoes.map((secao) => {
            const Icone = secao.icone;

            const ativo =
              selecionado === secao.id;

            const quantidade =
              dados[secao.id]?.total ?? 0;

            return (
              <button
                key={secao.id}
                type="button"
                onClick={() =>
                  setSelecionado(secao.id)
                }
                aria-pressed={ativo}
                className={`
                  flex
                  min-h-[46px]
                  min-w-0
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  px-2
                  py-2
                  text-center
                  text-[13px]
                  font-semibold
                  text-[#FFFFFF]
                  transition-all
                  duration-300
                  sm:px-3
                  sm:text-[14px]
                  ${
                    ativo
                      ? `
                        bg-[#6F9272]
                        shadow-[0_8px_22px_rgba(111,146,114,0.20)]
                      `
                      : `
                        bg-transparent
                        hover:bg-[#6F9272]/15
                      `
                  }
                `}
              >
                <Icone
                  className="
                    h-[18px]
                    w-[18px]
                    shrink-0
                    text-[#FFFFFF]
                  "
                  strokeWidth={1.8}
                />

                <span className="text-[#FFFFFF]">
                  {secao.titulo}
                </span>

                <span
                  className="
                    shrink-0
                    text-[#FFFFFF]
                  "
                >
                  {carregando ? "—" : quantidade}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================================================
          RESUMO SELECIONADO
      ================================================== */}

      <section
        className="
          rounded-3xl
          border
          border-white/15
          bg-white/20
          p-6
          shadow-[0_10px_35px_rgba(20,30,25,0.12)]
          backdrop-blur-2xl
        "
      >
        {/* CABEÇALHO DO RESUMO */}

        <div className="flex items-start gap-4">
          <IconeSecao
            className="
              mt-0.5
              h-7
              w-7
              shrink-0
              text-[#FFFFFF]
            "
            strokeWidth={1.8}
          />

          <div>
            <h2
              className="
                text-lg
                font-semibold
                text-[#FFFFFF]
              "
            >
              {secaoAtual.titulo}
            </h2>

            <p className="mt-1 text-sm text-[#FFFFFF]">
              {secaoAtual.descricao}
            </p>
          </div>
        </div>

        {/* ================================================
            CARDS DOS INDICADORES
        ================================================ */}

        <div
          className="
            mt-7
            grid
            grid-cols-1
            gap-4
            md:grid-cols-3
          "
        >
          {/* TOTAL */}

          <ResumoItem
            icone={
              selecionado === "condominios" ? (
                <Building2 className="h-6 w-6" />
              ) : selecionado === "chamados" ? (
                <Headset className="h-6 w-6" />
              ) : selecionado === "moradores" ? (
                <Users className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )
            }
            titulo="Total"
            valor={
              carregando
                ? "--"
                : dadosSecao?.total ?? 0
            }
          />

          {/* ATIVOS / RESPONDIDOS */}

          <ResumoItem
            icone={
              <CheckCircle2 className="h-6 w-6" />
            }
            titulo={
              selecionado === "chamados"
                ? "Respondidos"
                : "Ativos"
            }
            valor={
              carregando
                ? "--"
                : selecionado === "chamados"
                ? dadosSecao?.respondidos ?? 0
                : dadosSecao?.ativos ?? 0
            }
          />

          {/* INATIVOS / AGUARDANDO */}

          <ResumoItem
            icone={
              selecionado === "chamados" ? (
                <Clock3 className="h-6 w-6" />
              ) : (
                <CircleAlert className="h-6 w-6" />
              )
            }
            titulo={
              selecionado === "chamados"
                ? "Aguardando resposta"
                : "Inativos"
            }
            valor={
              carregando
                ? "--"
                : selecionado === "chamados"
                ? dadosSecao?.aguardando ?? 0
                : dadosSecao?.inativos ?? 0
            }
          />
        </div>
      </section>

      {/* ==================================================
          ATIVIDADE RECENTE
      ================================================== */}

      <section
        className="
          rounded-3xl
          border
          border-white/15
          bg-white/20
          p-6
          shadow-[0_10px_35px_rgba(20,30,25,0.12)]
          backdrop-blur-2xl
        "
      >
        <div>
          <h2
            className="
              text-xl
              font-semibold
              text-[#FFFFFF]
            "
          >
            Atividade recente
          </h2>

          <p className="mt-1 text-sm text-[#FFFFFF]">
            Ações recentes realizadas na plataforma.
          </p>
        </div>

        <div
          className="
            mt-7
            flex
            min-h-[100px]
            items-center
            justify-center
          "
        >
          <p className="text-sm text-[#FFFFFF]">
            Nenhuma atividade registrada ainda.
          </p>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   CARD INDIVIDUAL DOS INDICADORES
========================================================= */

function ResumoItem({
  icone,
  titulo,
  valor,
}) {
  return (
    <div
      className="
        flex
        min-h-[110px]
        items-center
        gap-4
        rounded-2xl
        bg-[#6F9272]
        px-5
        py-5
        text-[#FFFFFF]
        shadow-[0_8px_22px_rgba(111,146,114,0.16)]
        transition-all
        duration-300
        hover:bg-[#5C7D60]
      "
    >
      <div className="shrink-0 text-[#FFFFFF]">
        {icone}
      </div>

      <div>
        <span
          className="
            block
            text-[14px]
            font-medium
            text-[#FFFFFF]
          "
        >
          {titulo}
        </span>

        <strong
          className="
            mt-2
            block
            text-3xl
            font-semibold
            leading-none
            text-[#FFFFFF]
          "
        >
          {valor}
        </strong>
      </div>
    </div>
  );
}