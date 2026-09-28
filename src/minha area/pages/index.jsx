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

export default function MinhaArea() {
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

  async function carregarDashboard() {
    try {
      setCarregando(true);

      /* =====================================================
         CONDOMÍNIOS
      ===================================================== */

      try {
        const totalSnap =
          await getCountFromServer(
            collection(
              db,
              "condominios"
            )
          );

        const ativosSnap =
          await getCountFromServer(
            query(
              collection(
                db,
                "condominios"
              ),
              where(
                "ativo",
                "==",
                true
              )
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
            inativos:
              total - ativos,
          },
        }));
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
        const totalSnap =
          await getCountFromServer(
            query(
              collection(
                db,
                "usuarios"
              ),
              where(
                "role",
                "==",
                "morador"
              )
            )
          );

        const ativosSnap =
          await getCountFromServer(
            query(
              collection(
                db,
                "usuarios"
              ),
              where(
                "role",
                "==",
                "morador"
              ),
              where(
                "ativo",
                "==",
                true
              )
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
            inativos:
              total - ativos,
          },
        }));
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
        const totalSnap =
          await getCountFromServer(
            query(
              collection(
                db,
                "usuarios"
              ),
              where(
                "role",
                "==",
                "sindico"
              )
            )
          );

        const ativosSnap =
          await getCountFromServer(
            query(
              collection(
                db,
                "usuarios"
              ),
              where(
                "role",
                "==",
                "sindico"
              ),
              where(
                "ativo",
                "==",
                true
              )
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
            inativos:
              total - ativos,
          },
        }));
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
        const totalSnap =
          await getCountFromServer(
            collection(
              db,
              "chamados"
            )
          );

        /*
         * Como ainda não definimos oficialmente
         * os valores de status dos chamados,
         * mantemos os contadores específicos
         * em zero até o módulo de Chamados
         * estabelecer essa estrutura.
         */

        setDados((atual) => ({
          ...atual,
          chamados: {
            ...atual.chamados,
            total:
              totalSnap.data().count,
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

  useEffect(() => {
    carregarDashboard();
  }, []);

  const secaoAtual =
    secoes.find(
      (item) =>
        item.id === selecionado
    ) || secoes[0];

  return (
    <div className="morada-enter space-y-6">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <section
        className="
          rounded-3xl
          bg-white
          p-6
          shadow-sm
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div>
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
                font-bold
                text-[#595959]
              "
            >
              Dashboard
            </h1>

            <p
              className="
                mt-2
                text-sm
                text-[#8A8A8A]
              "
            >
              Administração da plataforma Morada.
            </p>
          </div>

          <div
            className="
              rounded-2xl
              bg-[#F3F6F4]
              px-4
              py-3
            "
          >
            <p
              className="
                text-xs
                text-[#8A8A8A]
              "
            >
              Acesso
            </p>

            <p
              className="
                text-sm
                font-semibold
                text-[#6F8D7A]
              "
            >
              Super administrador
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          ATALHOS INFORMATIVOS
      ===================================================== */}

      <section
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {secoes.map((secao) => {
          const Icone =
            secao.icone;

          const ativo =
            selecionado === secao.id;

          const quantidade =
            dados[secao.id]?.total ?? 0;

          return (
            <button
              key={secao.id}
              type="button"
              onClick={() =>
                setSelecionado(
                  secao.id
                )
              }
              className={`
                flex
                min-h-[58px]
                items-center
                justify-between
                gap-3
                rounded-xl
                px-4
                py-3
                text-left
                transition-all
                ${
                  ativo
                    ? "bg-[#6F8D7A] text-white shadow-sm"
                    : "bg-[#6F8D7A] text-white opacity-[0.82] hover:opacity-100"
                }
              `}
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <Icone
                  className="h-5 w-5 shrink-0"
                  strokeWidth={1.8}
                />

                <span
                  className="
                    text-sm
                    font-semibold
                  "
                >
                  {secao.titulo}
                </span>
              </div>

              <span
                className="
                  text-sm
                  font-semibold
                  opacity-90
                "
              >
                {carregando
                  ? "--"
                  : quantidade}
              </span>
            </button>
          );
        })}
      </section>

      {/* =====================================================
          RESUMO SELECIONADO
      ===================================================== */}

      <section
        className="
          rounded-3xl
          bg-white
          p-6
          shadow-sm
        "
      >
        <div
          className="
            flex
            items-start
            gap-4
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#F3F6F4]
              text-[#6F8D7A]
            "
          >
            <secaoAtual.icone
              className="h-6 w-6"
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2
              className="
                font-semibold
                text-[#333]
              "
            >
              {secaoAtual.titulo}
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-[#748078]
              "
            >
              {secaoAtual.descricao}
            </p>
          </div>
        </div>

        {/* ===================================================
            CONDOMÍNIOS
        =================================================== */}

        {selecionado ===
          "condominios" && (
          <div
            className="
              mt-6
              grid
              gap-3
              md:grid-cols-3
            "
          >
            <ResumoItem
              icone={
                <Building2 className="h-4 w-4" />
              }
              titulo="Total"
              valor={
                carregando
                  ? "--"
                  : dados.condominios.total
              }
            />

            <ResumoItem
              icone={
                <CheckCircle2 className="h-4 w-4" />
              }
              titulo="Ativos"
              valor={
                carregando
                  ? "--"
                  : dados.condominios.ativos
              }
            />

            <ResumoItem
              icone={
                <CircleAlert className="h-4 w-4" />
              }
              titulo="Inativos"
              valor={
                carregando
                  ? "--"
                  : dados.condominios.inativos
              }
            />
          </div>
        )}

        {/* ===================================================
            CHAMADOS
        =================================================== */}

        {selecionado ===
          "chamados" && (
          <div
            className="
              mt-6
              grid
              gap-3
              md:grid-cols-3
            "
          >
            <ResumoItem
              icone={
                <Headset className="h-4 w-4" />
              }
              titulo="Total"
              valor={
                carregando
                  ? "--"
                  : dados.chamados.total
              }
            />

            <ResumoItem
              icone={
                <CheckCircle2 className="h-4 w-4" />
              }
              titulo="Respondidos"
              valor={
                carregando
                  ? "--"
                  : dados.chamados.respondidos
              }
            />

            <ResumoItem
              icone={
                <Clock3 className="h-4 w-4" />
              }
              titulo="Aguardando resposta"
              valor={
                carregando
                  ? "--"
                  : dados.chamados.aguardando
              }
            />
          </div>
        )}

        {/* ===================================================
            MORADORES
        =================================================== */}

        {selecionado ===
          "moradores" && (
          <div
            className="
              mt-6
              grid
              gap-3
              md:grid-cols-3
            "
          >
            <ResumoItem
              icone={
                <Users className="h-4 w-4" />
              }
              titulo="Total"
              valor={
                carregando
                  ? "--"
                  : dados.moradores.total
              }
            />

            <ResumoItem
              icone={
                <CheckCircle2 className="h-4 w-4" />
              }
              titulo="Ativos"
              valor={
                carregando
                  ? "--"
                  : dados.moradores.ativos
              }
            />

            <ResumoItem
              icone={
                <CircleAlert className="h-4 w-4" />
              }
              titulo="Inativos"
              valor={
                carregando
                  ? "--"
                  : dados.moradores.inativos
              }
            />
          </div>
        )}

        {/* ===================================================
            SÍNDICOS
        =================================================== */}

        {selecionado ===
          "sindicos" && (
          <div
            className="
              mt-6
              grid
              gap-3
              md:grid-cols-3
            "
          >
            <ResumoItem
              icone={
                <ShieldCheck className="h-4 w-4" />
              }
              titulo="Total"
              valor={
                carregando
                  ? "--"
                  : dados.sindicos.total
              }
            />

            <ResumoItem
              icone={
                <CheckCircle2 className="h-4 w-4" />
              }
              titulo="Ativos"
              valor={
                carregando
                  ? "--"
                  : dados.sindicos.ativos
              }
            />

            <ResumoItem
              icone={
                <CircleAlert className="h-4 w-4" />
              }
              titulo="Inativos"
              valor={
                carregando
                  ? "--"
                  : dados.sindicos.inativos
              }
            />
          </div>
        )}
      </section>

      {/* =====================================================
          ATIVIDADE RECENTE
      ===================================================== */}

      <section
        className="
          rounded-3xl
          bg-white
          p-6
          shadow-sm
        "
      >
        <div>
          <h2
            className="
              text-xl
              font-semibold
              text-[#595959]
            "
          >
            Atividade recente
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-[#8A8A8A]
            "
          >
            Ações recentes realizadas na plataforma.
          </p>
        </div>

        <div
          className="
            mt-6
            rounded-2xl
            bg-[#F8F4EF]
            px-6
            py-10
            text-center
          "
        >
          <p
            className="
              text-sm
              text-[#8A8A8A]
            "
          >
            Nenhuma atividade registrada ainda.
          </p>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   ITEM DE RESUMO
========================================================= */

function ResumoItem({
  icone,
  titulo,
  valor,
}) {
  return (
    <div
      className="
        rounded-2xl
        bg-[#F8F4EF]
        p-4
      "
    >
      <div
        className="
          flex
          items-center
          gap-2
          text-[#6F8D7A]
        "
      >
        {icone}

        <span
          className="
            text-xs
            font-medium
            text-[#748078]
          "
        >
          {titulo}
        </span>
      </div>

      <strong
        className="
          mt-2
          block
          text-2xl
          font-semibold
          text-[#333]
        "
      >
        {valor}
      </strong>
    </div>
  );
}