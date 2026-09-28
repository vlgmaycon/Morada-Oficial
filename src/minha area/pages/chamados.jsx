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
   STATUS
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
   PÁGINA
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
     CARREGAR CHAMADOS
  ======================================================= */

  useEffect(() => {
    setCarregando(true);
    setErro("");

    const cancelar = observarChamados(
      (lista) => {
        setChamados(lista);
        setCarregando(false);
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

      aberto: chamados.filter(
        (item) =>
          normalizarStatus(item.status) ===
          STATUS.ABERTO
      ).length,

      em_andamento: chamados.filter(
        (item) =>
          normalizarStatus(item.status) ===
          STATUS.ANDAMENTO
      ).length,

      resolvido: chamados.filter(
        (item) =>
          normalizarStatus(item.status) ===
          STATUS.RESOLVIDO
      ).length,

      fechado: chamados.filter(
        (item) =>
          normalizarStatus(item.status) ===
          STATUS.FECHADO
      ).length,
    };
  }, [chamados]);

  return (
    <div
      className="
        morada-enter
        space-y-5
        sm:space-y-6
      "
    >
      {/* =====================================================
          CABEÇALHO PADRÃO
      ===================================================== */}

      <section
        className="
          rounded-3xl
          bg-white
          p-5
          shadow-sm
          sm:p-6
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
              text-2xl
              font-bold
              text-[#595959]
              sm:text-3xl
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
              text-[#8A8A8A]
            "
          >
            Acompanhe reclamações, feedbacks,
            sugestões, dúvidas e problemas
            enviados pelos usuários.
          </p>
        </div>
      </section>

      {/* =====================================================
          PESQUISA
      ===================================================== */}

      <section
        className="
          rounded-3xl
          bg-white
          p-4
          shadow-sm
          sm:p-5
        "
      >
        <div
          className="
            relative
            w-full
          "
        >
          <Search
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-[#748078]
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
            className="
              w-full
              rounded-xl
              border-0
              bg-[#F8F4EF]
              py-3
              pl-11
              pr-4
              text-sm
              text-[#595959]
              outline-none
              placeholder:text-[#748078]
              focus:ring-2
              focus:ring-[#EEF4EE]
            "
          />
        </div>
      </section>

      {/* =====================================================
          FILTROS
      ===================================================== */}

      <section
        className="
          rounded-3xl
          bg-white
          p-4
          shadow-sm
          sm:p-5
        "
      >
        <div
          className="
            flex
            gap-2
            overflow-x-auto
            pb-1
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
                className={`
                  flex
                  shrink-0
                  items-center
                  gap-2
                  rounded-xl
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  transition-all
                  ${
                    selecionado
                      ? "bg-[#6F8D7A] text-white"
                      : "bg-[#F8F4EF] text-[#595959] hover:bg-[#F3F6F4]"
                  }
                `}
              >
                <span>
                  {item.label}
                </span>

                <span
                  className={`
                    rounded-full
                    px-2
                    py-0.5
                    text-xs
                    ${
                      selecionado
                        ? "bg-white/15 text-white"
                        : "bg-white text-[#748078]"
                    }
                  `}
                >
                  {quantidade}
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
          className="
            rounded-3xl
            bg-white
            p-6
            shadow-sm
          "
        >
          <div
            className="
              rounded-2xl
              bg-[#F8F4EF]
              p-5
            "
          >
            <p
              className="
                text-sm
                font-medium
                text-[#595959]
              "
            >
              {erro}
            </p>
          </div>
        </section>
      )}

      {/* =====================================================
          CARREGANDO
      ===================================================== */}

      {carregando && (
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
              min-h-[240px]
              items-center
              justify-center
            "
          >
            <p
              className="
                text-sm
                text-[#748078]
              "
            >
              Carregando chamados...
            </p>
          </div>
        </section>
      )}

      {/* =====================================================
          SEM RESULTADOS
      ===================================================== */}

      {!carregando &&
        !erro &&
        chamadosFiltrados.length === 0 && (
          <section
            className="
              rounded-3xl
              bg-white
              p-6
              shadow-sm
              sm:p-8
            "
          >
            <div
              className="
                flex
                min-h-[260px]
                flex-col
                items-center
                justify-center
                text-center
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF4EE]
                  text-[#6F8D7A]
                "
              >
                <Inbox
                  className="h-6 w-6"
                  strokeWidth={1.8}
                />
              </div>

              <h2
                className="
                  mt-4
                  text-lg
                  font-semibold
                  text-[#333]
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
                  text-[#748078]
                "
              >
                {busca
                  ? "Tente pesquisar por outro termo ou altere o filtro."
                  : "Quando um usuário enviar uma reclamação, feedback, sugestão ou problema, ele aparecerá aqui."}
              </p>
            </div>
          </section>
        )}

      {/* =====================================================
          LISTA
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
          MODAL
      ===================================================== */}

      {chamadoSelecionado && (
        <ChamadoModal
          chamado={chamadoSelecionado}
          user={user}
          onFechar={() =>
            setChamadoSelecionado(
              null
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   CARD DO CHAMADO
========================================================= */

function ChamadoCard({
  chamado,
  onAbrir,
}) {
  const status =
    normalizarStatus(
      chamado.status
    );

  const configuracao =
    obterConfiguracaoStatus(
      status
    );

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
    Boolean(
      chamado.respostaAdmin
    );

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="
        w-full
        rounded-3xl
        bg-white
        p-5
        text-left
        shadow-sm
        transition-all
        hover:-translate-y-[1px]
        hover:shadow-md
        sm:p-6
      "
    >
      {/* ===================================================
          TOPO
      =================================================== */}

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
                bg-[#F8F4EF]
                px-3
                py-1
                text-xs
                font-semibold
                text-[#595959]
              "
            >
              {tipo}
            </span>

            <span
              className="
                text-xs
                text-[#8A8A8A]
              "
            >
              #{String(
                chamado.id || ""
              ).slice(0, 8)}
            </span>
          </div>

          <h2
            className="
              mt-3
              truncate
              text-base
              font-semibold
              text-[#333]
              sm:text-lg
            "
          >
            {titulo}
          </h2>
        </div>

        <span
          className="
            flex
            shrink-0
            items-center
            gap-1.5
            rounded-full
            bg-[#EEF4EE]
            px-3
            py-1.5
            text-xs
            font-semibold
            text-[#6F8D7A]
          "
        >
          <IconeStatus
            className="h-3.5 w-3.5"
            strokeWidth={1.8}
          />

          {configuracao.label}
        </span>
      </div>

      {/* ===================================================
          DESCRIÇÃO
      =================================================== */}

      <p
        className="
          mt-4
          line-clamp-2
          text-sm
          leading-6
          text-[#748078]
        "
      >
        {descricao}
      </p>

      {/* ===================================================
          META
      =================================================== */}

      <div
        className="
          mt-5
          flex
          flex-wrap
          items-center
          gap-x-4
          gap-y-2
          text-xs
          text-[#748078]
        "
      >
        <span>
          {solicitante}
        </span>

        {condominio && (
          <>
            <span className="text-[#C8D0CB]">
              •
            </span>

            <span>
              {condominio}
            </span>
          </>
        )}

        <span className="text-[#C8D0CB]">
          •
        </span>

        <span>
          {formatarData(
            chamado.createdAt
          )}
        </span>
      </div>

      {/* ===================================================
          RETORNO
      =================================================== */}

      <div
        className={`
          mt-5
          flex
          items-center
          justify-between
          gap-3
          rounded-2xl
          px-4
          py-3
          ${
            temResposta
              ? "bg-[#EEF4EE]"
              : "bg-[#F8F4EF]"
          }
        `}
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
              h-4
              w-4
              shrink-0
              text-[#6F8D7A]
            "
            strokeWidth={1.8}
          />

          <span
            className="
              truncate
              text-xs
              font-medium
              text-[#595959]
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
            text-xs
            font-semibold
            text-[#6F8D7A]
          "
        >
          Ver chamado
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
    useState(
      chamado.respostaAdmin || ""
    );

  const [status, setStatus] =
    useState(
      normalizarStatus(
        chamado.status
      )
    );

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
                  uid:
                    user?.uid || "",
                  nome:
                    user?.nome ||
                    user?.email ||
                    "Super Admin",
                  email:
                    user?.email ||
                    "",
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
        bg-black/20
        p-4
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-3xl
          flex-col
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-[0_20px_60px_rgba(40,52,44,0.16)]
        "
      >
        {/* =================================================
            CABEÇALHO DO MODAL
        ================================================= */}

        <div
          className="
            flex
            items-start
            justify-between
            gap-4
            border-b
            border-[#EEE9E3]
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
                gap-2
              "
            >
              <span
                className="
                  rounded-full
                  bg-[#EEF4EE]
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-[#6F8D7A]
                "
              >
                {tipo}
              </span>

              <span
                className="
                  text-xs
                  text-[#8A8A8A]
                "
              >
                #{chamado.id}
              </span>
            </div>

            <h2
              className="
                mt-3
                text-xl
                font-bold
                text-[#333]
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
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-[#748078]
              transition-all
              hover:bg-[#F8F4EF]
            "
          >
            <X
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* =================================================
            CONTEÚDO
        ================================================= */}

        <div
          className="
            overflow-y-auto
            p-5
            sm:p-6
          "
        >
          {/* ===============================================
              INFORMAÇÕES
          =============================================== */}

          <div
            className="
              grid
              grid-cols-1
              gap-3
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

          {/* ===============================================
              RELATO
          =============================================== */}

          <div
            className="
              mt-6
              rounded-2xl
              bg-[#F8F4EF]
              p-4
              sm:p-5
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <MessageCircle
                className="
                  h-4
                  w-4
                  text-[#6F8D7A]
                "
                strokeWidth={1.8}
              />

              <h3
                className="
                  text-sm
                  font-semibold
                  text-[#595959]
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
                text-[#595959]
              "
            >
              {descricao}
            </p>
          </div>

          {/* ===============================================
              RETORNO ANTERIOR
          =============================================== */}

          {chamado.respostaAdmin && (
            <div
              className="
                mt-4
                rounded-2xl
                bg-[#EEF4EE]
                p-4
                sm:p-5
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <h3
                  className="
                    text-sm
                    font-semibold
                    text-[#595959]
                  "
                >
                  Último retorno
                </h3>

                <span
                  className="
                    text-xs
                    text-[#748078]
                  "
                >
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
                  text-[#595959]
                "
              >
                {chamado.respostaAdmin}
              </p>

              {chamado.respondidoPor
                ?.nome && (
                <p
                  className="
                    mt-3
                    text-xs
                    text-[#748078]
                  "
                >
                  Respondido por{" "}
                  {
                    chamado.respondidoPor
                      .nome
                  }
                </p>
              )}
            </div>
          )}

          {/* ===============================================
              ATENDIMENTO
          =============================================== */}

          <div
            className="
              mt-6
              border-t
              border-[#EEE9E3]
              pt-6
            "
          >
            <div>
              <h3
                className="
                  text-lg
                  font-semibold
                  text-[#333]
                "
              >
                Atendimento
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  text-[#748078]
                "
              >
                Registre o retorno e atualize o
                andamento deste chamado.
              </p>
            </div>

            {/* STATUS */}

            <div className="mt-5">
              <label
                htmlFor="status-chamado"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-[#595959]
                "
              >
                Status
              </label>

              <select
                id="status-chamado"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border-0
                  bg-[#F8F4EF]
                  px-4
                  py-3
                  text-sm
                  text-[#595959]
                  outline-none
                  focus:ring-2
                  focus:ring-[#EEF4EE]
                "
              >
                <option
                  value={STATUS.ABERTO}
                >
                  Aberto
                </option>

                <option
                  value={STATUS.ANDAMENTO}
                >
                  Em andamento
                </option>

                <option
                  value={STATUS.RESOLVIDO}
                >
                  Resolvido
                </option>

                <option
                  value={STATUS.FECHADO}
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
                  text-[#595959]
                "
              >
                Retorno ao usuário
              </label>

              <textarea
                id="retorno-chamado"
                value={resposta}
                onChange={(event) =>
                  setResposta(
                    event.target.value
                  )
                }
                rows={6}
                placeholder="Escreva aqui o retorno para o usuário..."
                className="
                  w-full
                  resize-y
                  rounded-xl
                  border-0
                  bg-[#F8F4EF]
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-[#595959]
                  outline-none
                  placeholder:text-[#748078]
                  focus:ring-2
                  focus:ring-[#EEF4EE]
                "
              />
            </div>

            {/* ERRO */}

            {erro && (
              <p
                className="
                  mt-3
                  rounded-xl
                  bg-[#F8F4EF]
                  px-4
                  py-3
                  text-sm
                  text-[#595959]
                "
              >
                {erro}
              </p>
            )}
          </div>
        </div>

        {/* =================================================
            RODAPÉ
        ================================================= */}

        <div
          className="
            flex
            flex-col-reverse
            gap-3
            border-t
            border-[#EEE9E3]
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
              rounded-xl
              px-5
              py-3
              text-sm
              font-semibold
              text-[#595959]
              transition-all
              hover:bg-[#F8F4EF]
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
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#6F8D7A]
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition-all
              hover:bg-[#5F7D6A]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <Send
              className="h-4 w-4"
              strokeWidth={1.8}
            />

            {salvando
              ? "Salvando..."
              : "Salvar retorno"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ITEM DE INFORMAÇÃO
========================================================= */

function InfoItem({
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-2xl
        bg-[#F8F4EF]
        px-4
        py-3
      "
    >
      <p
        className="
          text-xs
          text-[#748078]
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
          text-[#595959]
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function normalizarStatus(status) {
  if (!status) {
    return STATUS.ABERTO;
  }

  const valor = String(
    status
  ).toLowerCase();

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

function obterConfiguracaoStatus(
  status
) {
  return (
    STATUS_CONFIG[status] ||
    STATUS_CONFIG[STATUS.ABERTO]
  );
}

/* =========================================================
   DATA
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

function formatarDataCompleta(
  valor
) {
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

function converterData(valor) {
  if (!valor) {
    return null;
  }

  if (
    typeof valor?.toDate === "function"
  ) {
    return valor.toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor?.toMillis ===
    "function"
  ) {
    return new Date(
      valor.toMillis()
    );
  }

  if (typeof valor === "string") {
    const data = new Date(valor);

    return Number.isNaN(
      data.getTime()
    )
      ? null
      : data;
  }

  return null;
}