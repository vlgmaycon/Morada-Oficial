import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Inbox,
  MessageCircle,
  Search,
  Send,
  X,
} from "lucide-react";

import {
  serverTimestamp,
} from "firebase/firestore";

import useAuth from "@/auth/AuthContext";

import {
  atualizarChamado,
  observarChamados,
} from "@/minha area/services/chamadoService";

/* =========================================================
   STATUS DOS CHAMADOS
========================================================= */

const STATUS = {
  ABERTO: "aberto",
  ANDAMENTO: "em_andamento",
  RESOLVIDO: "resolvido",
  FECHADO: "fechado",
};

const STATUS_CONFIG = {
  [STATUS.ABERTO]: {
    label: "Aberto",
    descricao: "Ainda não iniciado",
    icon: CircleAlert,
  },

  [STATUS.ANDAMENTO]: {
    label: "Em andamento",
    descricao: "Em atendimento",
    icon: Clock3,
  },

  [STATUS.RESOLVIDO]: {
    label: "Resolvido",
    descricao: "Problema solucionado",
    icon: CheckCircle2,
  },

  [STATUS.FECHADO]: {
    label: "Fechado",
    descricao: "Atendimento encerrado",
    icon: CheckCircle2,
  },
};

/* =========================================================
   FILTROS
========================================================= */

const FILTROS = [
  {
    id: "todos",
    label: "Todos",
  },
  {
    id: STATUS.ABERTO,
    label: "Abertos",
  },
  {
    id: STATUS.ANDAMENTO,
    label: "Em andamento",
  },
  {
    id: STATUS.RESOLVIDO,
    label: "Resolvidos",
  },
  {
    id: STATUS.FECHADO,
    label: "Fechados",
  },
];

/* =========================================================
   PADRÃO GLASS DA MORADA OFICIAL
========================================================= */

const CARD_GLASS = `
  rounded-3xl
  border border-white/15
  bg-white/20
  shadow-[0_10px_35px_rgba(20,30,25,0.12)]
  backdrop-blur-2xl
`;

const CAMPO_GLASS = `
  w-full
  rounded-2xl
  border border-white/15
  bg-white/10
  px-4 py-3
  text-[14px] text-[#FFFFFF]
  backdrop-blur-xl
  outline-none
  transition-all duration-300
  placeholder:text-white/80
  focus:border-[#6F9272]
  focus:bg-white/15
  focus:ring-2 focus:ring-[#6F9272]/30
`;

/* =========================================================
   PÁGINA DE CHAMADOS
========================================================= */

export default function Chamados() {
  const { user } = useAuth();

  const [chamados, setChamados] = useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

  const [filtro, setFiltro] =
    useState("todos");

  const [
    chamadoSelecionado,
    setChamadoSelecionado,
  ] = useState(null);

  /* =======================================================
     CARREGAMENTO EM TEMPO REAL
  ======================================================= */

  useEffect(() => {
    setCarregando(true);
    setErro("");

    const cancelar = observarChamados(
      (lista) => {
        setChamados(lista);
        setCarregando(false);
        setErro("");
      },
      (error) => {
        console.error(
          "Erro ao carregar chamados:",
          error
        );

        setErro(
          "Não foi possível carregar os chamados."
        );

        setCarregando(false);
      }
    );

    return cancelar;
  }, []);

  /* =======================================================
     FILTRAGEM
  ======================================================= */

  const chamadosFiltrados = useMemo(() => {
    const termo = busca
      .trim()
      .toLowerCase();

    return chamados.filter((chamado) => {
      const status = normalizarStatus(
        chamado.status
      );

      const correspondeFiltro =
        filtro === "todos" ||
        status === filtro;

      if (!correspondeFiltro) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const texto = [
        chamado.titulo,
        chamado.assunto,
        chamado.descricao,
        chamado.mensagem,
        chamado.tipo,
        chamado.categoria,
        chamado.condominioNome,
        chamado.nomeCondominio,
        chamado.usuarioNome,
        chamado.nomeUsuario,
        chamado.criadoPorNome,
        chamado.criadoPorEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [chamados, busca, filtro]);

  /* =======================================================
     CONTADORES
  ======================================================= */

  const contadores = useMemo(() => {
    return {
      todos: chamados.length,

      [STATUS.ABERTO]: chamados.filter(
        (item) =>
          normalizarStatus(item.status) ===
          STATUS.ABERTO
      ).length,

      [STATUS.ANDAMENTO]: chamados.filter(
        (item) =>
          normalizarStatus(item.status) ===
          STATUS.ANDAMENTO
      ).length,

      [STATUS.RESOLVIDO]: chamados.filter(
        (item) =>
          normalizarStatus(item.status) ===
          STATUS.RESOLVIDO
      ).length,

      [STATUS.FECHADO]: chamados.filter(
        (item) =>
          normalizarStatus(item.status) ===
          STATUS.FECHADO
      ).length,
    };
  }, [chamados]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="morada-enter space-y-6">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <header className="px-1 pt-1">
        <h1
          className="
            text-3xl
            font-semibold
            tracking-[-0.02em]
            text-[#FFFFFF]
          "
        >
          Chamados
        </h1>

        <p
          className="
            mt-2
            max-w-2xl
            text-sm
            leading-6
            text-[#FFFFFF]
          "
        >
          Acompanhe reclamações, feedbacks,
          sugestões, dúvidas e problemas
          enviados pelos usuários.
        </p>
      </header>

      {/* =====================================================
          BARRA DE PESQUISA
      ===================================================== */}

      <section className="relative">

        <Search
          className="
            pointer-events-none
            absolute
            left-4
            top-1/2
            z-10
            h-5
            w-5
            -translate-y-1/2
            text-[#FFFFFF]
          "
          strokeWidth={1.8}
        />

        <input
          type="text"
          value={busca}
          onChange={(event) =>
            setBusca(event.target.value)
          }
          placeholder="Pesquisar chamado..."
          aria-label="Pesquisar chamados"
          className={`
            ${CAMPO_GLASS}
            h-12
            min-h-0
            rounded-full
            py-2
            pl-12
            pr-5
          `}
        />

      </section>

      {/* =====================================================
          BARRA ÚNICA DE FILTROS
      ===================================================== */}

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
            sm:grid-cols-3
            xl:grid-cols-5
          "
        >
          {FILTROS.map((item) => {
            const selecionado =
              filtro === item.id;

            const quantidade =
              contadores[item.id] ?? 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setFiltro(item.id)
                }
                aria-pressed={selecionado}
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
                    selecionado
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
                <span className="text-[#FFFFFF]">
                  {item.label}
                </span>

                <span
                  className="
                    shrink-0
                    text-[#FFFFFF]
                  "
                >
                  {carregando
                    ? "—"
                    : quantidade}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          ERRO
      ===================================================== */}

      {erro && (
        <section
          className={`
            ${CARD_GLASS}
            flex
            items-center
            gap-3
            p-5
          `}
        >
          <CircleAlert
            className="
              h-5
              w-5
              shrink-0
              text-[#FFFFFF]
            "
            strokeWidth={1.8}
          />

          <p className="text-sm text-[#FFFFFF]">
            {erro}
          </p>
        </section>
      )}

      {/* =====================================================
          CARREGANDO
      ===================================================== */}

      {carregando && (
        <section
          className={`
            ${CARD_GLASS}
            flex
            min-h-[190px]
            items-center
            justify-center
            p-6
          `}
        >
          <p className="text-sm text-[#FFFFFF]">
            Carregando chamados...
          </p>
        </section>
      )}

      {/* =====================================================
          NENHUM RESULTADO
      ===================================================== */}

      {!carregando &&
        !erro &&
        chamadosFiltrados.length === 0 && (
          <section
            className={`
              ${CARD_GLASS}
              flex
              min-h-[260px]
              flex-col
              items-center
              justify-center
              p-8
              text-center
            `}
          >
            <Inbox
              className="
                h-9
                w-9
                text-[#FFFFFF]
              "
              strokeWidth={1.6}
            />

            <h2
              className="
                mt-5
                text-lg
                font-semibold
                text-[#FFFFFF]
              "
            >
              {busca
                ? "Nenhum chamado encontrado"
                : "Nenhum chamado registrado"}
            </h2>

            <p
              className="
                mt-2
                max-w-md
                text-sm
                leading-6
                text-[#FFFFFF]
              "
            >
              {busca
                ? "Tente pesquisar por outro termo ou escolha outro filtro."
                : "Quando um usuário enviar uma reclamação, feedback, sugestão ou problema, ele aparecerá aqui."}
            </p>
          </section>
        )}

      {/* =====================================================
          LISTA DE CHAMADOS
      ===================================================== */}

      {!carregando &&
        !erro &&
        chamadosFiltrados.length > 0 && (
          <section
            className="
              grid
              grid-cols-1
              gap-4
              xl:grid-cols-2
            "
          >
            {chamadosFiltrados.map(
              (chamado) => (
                <ChamadoCard
                  key={chamado.id}
                  chamado={chamado}
                  onAbrir={() =>
                    setChamadoSelecionado(
                      chamado
                    )
                  }
                />
              )
            )}
          </section>
        )}

      {/* =====================================================
          MODAL DO CHAMADO
      ===================================================== */}

      {chamadoSelecionado && (
        <ChamadoModal
          chamado={chamadoSelecionado}
          user={user}
          onFechar={() =>
            setChamadoSelecionado(null)
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   CARD INDIVIDUAL DO CHAMADO
   Um único card de glass
========================================================= */

function ChamadoCard({
  chamado,
  onAbrir,
}) {
  const status =
    normalizarStatus(chamado.status);

  const configuracao =
    obterConfiguracaoStatus(status);

  const IconeStatus =
    configuracao.icon;

  const titulo =
    chamado.titulo ||
    chamado.assunto ||
    "Chamado sem assunto";

  const tipo =
    chamado.tipo ||
    chamado.categoria ||
    "Chamado";

  const solicitante =
    chamado.usuarioNome ||
    chamado.nomeUsuario ||
    chamado.criadoPorNome ||
    chamado.usuario?.nome ||
    chamado.autor?.nome ||
    "Usuário";

  const condominio =
    chamado.condominioNome ||
    chamado.nomeCondominio ||
    chamado.condominio?.nome ||
    "";

  const descricao =
    chamado.descricao ||
    chamado.mensagem ||
    chamado.detalhes ||
    "Nenhuma descrição informada.";

  const temResposta =
    Boolean(chamado.respostaAdmin);

  return (
    <button
      type="button"
      onClick={onAbrir}
      className={`
        ${CARD_GLASS}
        w-full
        overflow-hidden
        p-5
        text-left
        text-[#FFFFFF]
        transition-all
        duration-300
        hover:border-[#6F9272]
        sm:p-6
      `}
    >
      {/* CABEÇALHO */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div className="min-w-0">

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <span
              className="
                rounded-full
                border
                border-[#6F9272]
                bg-[#6F9272]/20
                px-3
                py-1
                text-xs
                font-semibold
                text-[#FFFFFF]
              "
            >
              {tipo}
            </span>

            <span className="text-xs text-[#FFFFFF]">
              #{String(chamado.id || "").slice(0, 8)}
            </span>
          </div>

          <h2
            className="
              mt-3
              break-words
              text-lg
              font-semibold
              text-[#FFFFFF]
            "
          >
            {titulo}
          </h2>

        </div>

        {/* STATUS COM ÍCONE LIVRE */}

        <span
          className="
            flex
            shrink-0
            items-center
            gap-2
            text-[13px]
            font-semibold
            text-[#FFFFFF]
          "
        >
          <IconeStatus
            className="
              h-5
              w-5
              text-[#FFFFFF]
            "
            strokeWidth={1.8}
          />

          {configuracao.label}
        </span>
      </div>

      {/* DESCRIÇÃO */}

      <p
        className="
          mt-4
          line-clamp-2
          text-sm
          leading-6
          text-[#FFFFFF]
        "
      >
        {descricao}
      </p>

      {/* INFORMAÇÕES */}

      <div
        className="
          mt-5
          flex
          flex-wrap
          items-center
          gap-x-3
          gap-y-2
          text-xs
          text-[#FFFFFF]
        "
      >
        <span className="text-[#FFFFFF]">
          {solicitante}
        </span>

        {condominio && (
          <>
            <span className="text-white/80">
              •
            </span>

            <span className="text-[#FFFFFF]">
              {condominio}
            </span>
          </>
        )}

        <span className="text-white/80">
          •
        </span>

        <span className="text-[#FFFFFF]">
          {formatarData(chamado.createdAt)}
        </span>
      </div>

      {/* RETORNO — SEM CARD INTERNO */}

      <div
        className="
          mt-5
          flex
          items-center
          justify-between
          gap-3
          border-t
          border-white/15
          pt-4
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
          "
        >
          <MessageCircle
            className="
              h-5
              w-5
              shrink-0
              text-[#FFFFFF]
            "
            strokeWidth={1.8}
          />

          <span
            className="
              text-[13px]
              font-medium
              text-[#FFFFFF]
            "
          >
            {temResposta
              ? "Retorno registrado"
              : "Aguardando retorno"}
          </span>
        </div>

        <span
          className="
            shrink-0
            text-[13px]
            font-semibold
            text-[#FFFFFF]
          "
        >
          Ver chamado →
        </span>
      </div>
    </button>
  );
}

/* =========================================================
   MODAL DO CHAMADO
========================================================= */

function ChamadoModal({
  chamado,
  user,
  onFechar,
}) {
  const [resposta, setResposta] =
    useState(chamado.respostaAdmin || "");

  const [status, setStatus] =
    useState(normalizarStatus(chamado.status));

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const titulo =
    chamado.titulo ||
    chamado.assunto ||
    "Chamado sem assunto";

  const tipo =
    chamado.tipo ||
    chamado.categoria ||
    "Chamado";

  const descricao =
    chamado.descricao ||
    chamado.mensagem ||
    chamado.detalhes ||
    "Nenhuma descrição informada.";

  const solicitante =
    chamado.usuarioNome ||
    chamado.nomeUsuario ||
    chamado.criadoPorNome ||
    chamado.usuario?.nome ||
    chamado.autor?.nome ||
    "Usuário";

  const email =
    chamado.usuarioEmail ||
    chamado.emailUsuario ||
    chamado.criadoPorEmail ||
    chamado.usuario?.email ||
    chamado.autor?.email ||
    "";

  const condominio =
    chamado.condominioNome ||
    chamado.nomeCondominio ||
    chamado.condominio?.nome ||
    "";

  /* =====================================================
     SALVAR RETORNO
  ===================================================== */

  async function salvarRetorno() {
    if (!chamado.id) {
      return;
    }

    if (
      status === STATUS.RESOLVIDO ||
      status === STATUS.FECHADO
    ) {
      if (!resposta.trim()) {
        setErro(
          "Informe o retorno antes de concluir o chamado."
        );

        return;
      }
    }

    try {
      setSalvando(true);
      setErro("");

      await atualizarChamado(
        chamado.id,
        {
          status,

          respostaAdmin:
            resposta.trim(),

          respondidoEm:
            resposta.trim()
              ? serverTimestamp()
              : chamado.respondidoEm ||
                null,

          respondidoPor:
            resposta.trim()
              ? {
                  uid: user?.uid || "",
                  nome:
                    user?.nome ||
                    user?.email ||
                    "Super Admin",
                  email: user?.email || "",
                }
              : chamado.respondidoPor ||
                null,
        }
      );

      onFechar();
    } catch (error) {
      console.error(
        "Erro ao atualizar chamado:",
        error
      );

      setErro(
        "Não foi possível salvar o retorno. Verifique as permissões do Firebase."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-chamado"
        className={`
          relative
          flex
          max-h-[90vh]
          w-full
          max-w-3xl
          flex-col
          overflow-hidden
          ${CARD_GLASS}
        `}
      >
        {/* BRILHO DE VIDRO */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-br
            from-white/[0.08]
            via-transparent
            to-white/[0.02]
          "
        />

        {/* CABEÇALHO DO MODAL */}

        <div
          className="
            relative
            z-10
            flex
            items-start
            justify-between
            gap-4
            border-b
            border-white/15
            p-5
            sm:p-6
          "
        >
          <div className="min-w-0">

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
              "
            >
              <span
                className="
                  rounded-full
                  border
                  border-[#6F9272]
                  bg-[#6F9272]/20
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-[#FFFFFF]
                "
              >
                {tipo}
              </span>

              <span className="break-all text-xs text-[#FFFFFF]">
                #{chamado.id}
              </span>
            </div>

            <h2
              id="titulo-modal-chamado"
              className="
                mt-3
                break-words
                text-xl
                font-semibold
                text-[#FFFFFF]
                sm:text-2xl
              "
            >
              {titulo}
            </h2>

          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar chamado"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-[#FFFFFF]
              transition-all
              hover:bg-white/10
            "
          >
            <X
              className="h-5 w-5 text-[#FFFFFF]"
              strokeWidth={1.8}
            />
          </button>

        </div>

        {/* CONTEÚDO DO MODAL */}

        <div
          className="
            relative
            z-10
            overflow-y-auto
            p-5
            sm:p-6
          "
        >

          {/* INFORMAÇÕES DO SOLICITANTE */}

          <div
            className="
              grid
              grid-cols-1
              gap-x-6
              gap-y-4
              border-b
              border-white/15
              pb-5
              sm:grid-cols-2
            "
          >
            <InfoItem
              label="Solicitante"
              value={solicitante}
            />

            {email && (
              <InfoItem
                label="E-mail"
                value={email}
              />
            )}

            {condominio && (
              <InfoItem
                label="Condomínio"
                value={condominio}
              />
            )}

            <InfoItem
              label="Enviado em"
              value={formatarDataCompleta(
                chamado.createdAt
              )}
            />
          </div>

          {/* RELATO */}

          <section
            className="
              border-b
              border-white/15
              py-5
            "
          >
            <div className="flex items-center gap-3">

              <MessageCircle
                className="h-5 w-5 text-[#FFFFFF]"
                strokeWidth={1.8}
              />

              <h3
                className="
                  text-[15px]
                  font-semibold
                  text-[#FFFFFF]
                "
              >
                Relato do usuário
              </h3>

            </div>

            <p
              className="
                mt-3
                whitespace-pre-wrap
                text-sm
                leading-7
                text-[#FFFFFF]
              "
            >
              {descricao}
            </p>
          </section>

          {/* RETORNO ANTERIOR */}

          {chamado.respostaAdmin && (
            <section
              className="
                border-b
                border-white/15
                py-5
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3
                "
              >
                <h3
                  className="
                    text-[15px]
                    font-semibold
                    text-[#FFFFFF]
                  "
                >
                  Último retorno
                </h3>

                <span className="text-xs text-[#FFFFFF]">
                  {formatarDataCompleta(
                    chamado.respondidoEm
                  )}
                </span>
              </div>

              <p
                className="
                  mt-3
                  whitespace-pre-wrap
                  text-sm
                  leading-7
                  text-[#FFFFFF]
                "
              >
                {chamado.respostaAdmin}
              </p>

              {chamado.respondidoPor?.nome && (
                <p className="mt-3 text-xs text-[#FFFFFF]">
                  Respondido por{" "}
                  {chamado.respondidoPor.nome}
                </p>
              )}
            </section>
          )}

          {/* ATENDIMENTO */}

          <section className="pt-5">

            <h3
              className="
                text-lg
                font-semibold
                text-[#FFFFFF]
              "
            >
              Atendimento
            </h3>

            <p
              className="
                mt-1
                text-sm
                leading-6
                text-[#FFFFFF]
              "
            >
              Registre o retorno e atualize o
              andamento deste chamado.
            </p>

            {/* STATUS */}

            <div className="mt-5">
              <label
                htmlFor="status-chamado"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-[#FFFFFF]
                "
              >
                Status
              </label>

              <select
                id="status-chamado"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className={CAMPO_GLASS}
              >
                <option
                  value={STATUS.ABERTO}
                  className="bg-[#334438] text-white"
                >
                  Aberto
                </option>

                <option
                  value={STATUS.ANDAMENTO}
                  className="bg-[#334438] text-white"
                >
                  Em andamento
                </option>

                <option
                  value={STATUS.RESOLVIDO}
                  className="bg-[#334438] text-white"
                >
                  Resolvido
                </option>

                <option
                  value={STATUS.FECHADO}
                  className="bg-[#334438] text-white"
                >
                  Fechado
                </option>
              </select>
            </div>

            {/* RESPOSTA */}

            <div className="mt-5">

              <label
                htmlFor="retorno-chamado"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-[#FFFFFF]
                "
              >
                Retorno ao usuário
              </label>

              <textarea
                id="retorno-chamado"
                value={resposta}
                onChange={(event) =>
                  setResposta(event.target.value)
                }
                rows={6}
                placeholder="Escreva aqui o retorno para o usuário..."
                className={`
                  ${CAMPO_GLASS}
                  resize-y
                  leading-6
                `}
              />

            </div>

            {/* ERRO */}

            {erro && (
              <p
                role="alert"
                className="
                  mt-4
                  border-t
                  border-white/15
                  pt-4
                  text-sm
                  text-[#FFFFFF]
                "
              >
                {erro}
              </p>
            )}

          </section>
        </div>

        {/* RODAPÉ DO MODAL */}

        <div
          className="
            relative
            z-10
            flex
            flex-col-reverse
            gap-3
            border-t
            border-white/15
            p-5
            sm:flex-row
            sm:justify-end
            sm:p-6
          "
        >
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            className="
              inline-flex
              min-h-[58px]
              items-center
              justify-center
              rounded-xl
              border
              border-white/20
              bg-white/10
              px-4
              py-3
              text-[14px]
              font-semibold
              text-[#FFFFFF]
              transition-all
              hover:bg-white/15
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={salvarRetorno}
            disabled={salvando}
            className="
              inline-flex
              min-h-[58px]
              items-center
              justify-center
              gap-3
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
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <Send
              className="h-[22px] w-[22px] text-[#FFFFFF]"
              strokeWidth={1.8}
            />

            <span className="text-[#FFFFFF]">
              {salvando
                ? "Salvando..."
                : "Salvar retorno"}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFORMAÇÃO SIMPLES
   Sem card adicional
========================================================= */

function InfoItem({
  label,
  value,
}) {
  return (
    <div className="min-w-0">

      <p
        className="
          text-xs
          font-medium
          text-[#FFFFFF]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          break-words
          text-sm
          font-medium
          text-[#FFFFFF]
        "
      >
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   NORMALIZAR STATUS
========================================================= */

function normalizarStatus(status) {
  if (!status) {
    return STATUS.ABERTO;
  }

  const valor = String(status).toLowerCase();

  if (
    valor === "aberto" ||
    valor === "open"
  ) {
    return STATUS.ABERTO;
  }

  if (
    valor === "em_andamento" ||
    valor === "andamento" ||
    valor === "em andamento" ||
    valor === "in_progress"
  ) {
    return STATUS.ANDAMENTO;
  }

  if (
    valor === "resolvido" ||
    valor === "resolved"
  ) {
    return STATUS.RESOLVIDO;
  }

  if (
    valor === "fechado" ||
    valor === "closed"
  ) {
    return STATUS.FECHADO;
  }

  return STATUS.ABERTO;
}

/* =========================================================
   CONFIGURAÇÃO VISUAL DO STATUS
========================================================= */

function obterConfiguracaoStatus(status) {
  return (
    STATUS_CONFIG[status] ||
    STATUS_CONFIG[STATUS.ABERTO]
  );
}

/* =========================================================
   CONVERTER DATA
========================================================= */

function converterData(valor) {
  if (!valor) {
    return null;
  }

  if (typeof valor?.toDate === "function") {
    return valor.toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (typeof valor?.toMillis === "function") {
    return new Date(valor.toMillis());
  }

  if (typeof valor === "string") {
    const data = new Date(valor);

    return Number.isNaN(data.getTime())
      ? null
      : data;
  }

  return null;
}

/* =========================================================
   FORMATAR DATA
========================================================= */

function formatarData(valor) {
  const data = converterData(valor);

  if (!data) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(data);
}

/* =========================================================
   FORMATAR DATA COMPLETA
========================================================= */

function formatarDataCompleta(valor) {
  const data = converterData(valor);

  if (!data) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(data);
}