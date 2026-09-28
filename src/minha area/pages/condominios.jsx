import { useEffect, useMemo, useState } from "react";

import {
  ClipboardPlus,
  Building2,
  Search,
  Trash2,
  LockKeyhole,
  X,
} from "lucide-react";

import { auth } from "@/auth/firebase";

import CondominioCard from "../components/CondominioCard";
import CondominioForm from "../components/CondominioForm";
import EmptyState from "../components/EmptyState";

import {
  listarCondominios,
  criarCondominio,
  editarCondominio,
  excluirCondominio,
} from "../services/condominioService";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

export default function Condominios() {
  const [abaAtiva, setAbaAtiva] = useState("lista");

  const [condominios, setCondominios] = useState([]);

  const [busca, setBusca] = useState("");

  const [condominioEditando, setCondominioEditando] =
    useState(null);

  const [condominioParaExcluir, setCondominioParaExcluir] =
    useState(null);

  const [senhaExclusao, setSenhaExclusao] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [excluindo, setExcluindo] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  /* =========================================================
     CARREGAR CONDOMÍNIOS
  ========================================================= */

  async function carregarCondominios() {
    try {
      setErro("");

      const lista =
        await listarCondominios();

      setCondominios(lista);
    } catch (error) {
      console.error(
        "Erro ao carregar condomínios:",
        error
      );

      setErro(
        "Não foi possível carregar os condomínios."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarCondominios();
  }, []);

  /* =========================================================
     ABRIR CADASTRO
  ========================================================= */

  function abrirCadastro() {
    setAbaAtiva("cadastro");
    setCondominioEditando(null);
    setErro("");
    setSucesso("");
  }

  /* =========================================================
     ABRIR LISTAGEM
  ========================================================= */

  function abrirLista() {
    setAbaAtiva("lista");
    setCondominioEditando(null);
    setErro("");
    setSucesso("");
  }

  /* =========================================================
     EDITAR
  ========================================================= */

  function abrirEdicao(condominio) {
    setCondominioEditando(condominio);
    setAbaAtiva("cadastro");
    setErro("");
    setSucesso("");
  }

  /* =========================================================
     SALVAR
  ========================================================= */

  async function salvarCondominio(dados) {
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      if (condominioEditando?.id) {
        const {
          id,
          ...dadosAtualizacao
        } = dados;

        await editarCondominio(
          condominioEditando.id,
          dadosAtualizacao
        );

        setSucesso(
          "Condomínio atualizado com sucesso."
        );
      } else {
        await criarCondominio(dados);

        setSucesso(
          "Condomínio cadastrado com sucesso."
        );
      }

      await carregarCondominios();

      setCondominioEditando(null);
      setAbaAtiva("lista");
    } catch (error) {
      console.error(
        "Erro ao salvar condomínio:",
        error
      );

      setErro(
        "Não foi possível salvar o condomínio."
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =========================================================
     CANCELAR FORMULÁRIO
  ========================================================= */

  function cancelarFormulario() {
    setCondominioEditando(null);
    setErro("");
    setAbaAtiva("lista");
  }

  /* =========================================================
     EXCLUSÃO
  ========================================================= */

  function abrirConfirmacaoExclusao(
    condominio
  ) {
    setCondominioParaExcluir(
      condominio
    );

    setSenhaExclusao("");
    setErro("");
    setSucesso("");
  }

  function fecharConfirmacaoExclusao() {
    if (excluindo) {
      return;
    }

    setCondominioParaExcluir(null);
    setSenhaExclusao("");
    setErro("");
  }

  async function confirmarExclusao() {
    if (!condominioParaExcluir) {
      return;
    }

    const usuarioAtual =
      auth.currentUser;

    if (!usuarioAtual) {
      setErro(
        "Sua sessão expirou. Faça login novamente."
      );

      return;
    }

    if (!usuarioAtual.email) {
      setErro(
        "Não foi possível identificar sua conta."
      );

      return;
    }

    if (!senhaExclusao) {
      setErro(
        "Digite sua senha para confirmar a exclusão."
      );

      return;
    }

    try {
      setExcluindo(true);
      setErro("");
      setSucesso("");

      const credencial =
        EmailAuthProvider.credential(
          usuarioAtual.email,
          senhaExclusao
        );

      await reauthenticateWithCredential(
        usuarioAtual,
        credencial
      );

      await excluirCondominio(
        condominioParaExcluir.id
      );

      await carregarCondominios();

      setCondominioParaExcluir(null);
      setSenhaExclusao("");

      setSucesso(
        "Condomínio excluído com sucesso."
      );

      setAbaAtiva("lista");
    } catch (error) {
      console.error(
        "Erro ao excluir condomínio:",
        error
      );

      if (
        error?.code ===
        "auth/invalid-credential"
      ) {
        setErro(
          "Senha incorreta. A exclusão não foi realizada."
        );

        return;
      }

      if (
        error?.code ===
        "auth/too-many-requests"
      ) {
        setErro(
          "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente."
        );

        return;
      }

      setErro(
        "Não foi possível excluir o condomínio."
      );
    } finally {
      setExcluindo(false);
    }
  }

  /* =========================================================
     PESQUISA
  ========================================================= */

  const condominiosFiltrados =
    useMemo(() => {
      const termo =
        busca.trim().toLowerCase();

      if (!termo) {
        return condominios;
      }

      return condominios.filter(
        (condominio) => {
          const nome =
            String(
              condominio.nome || ""
            ).toLowerCase();

          const documento =
            String(
              condominio.documento || ""
            ).toLowerCase();

          const cidade =
            String(
              condominio.cidade || ""
            ).toLowerCase();

          return (
            nome.includes(termo) ||
            documento.includes(termo) ||
            cidade.includes(termo)
          );
        }
      );
    }, [condominios, busca]);

  return (
    <div className="space-y-6">
      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <section
        className="
          rounded-[30px]
          border
          border-white/10
          bg-black/20
          p-6
          backdrop-blur-2xl
          shadow-[0_20px_50px_rgba(0,0,0,0.18)]
          sm:p-7
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
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
                text-[#B6D0BE]
              "
            >
              Administração
            </p>

            <h1
              className="
                mt-2
                text-3xl
                font-bold
                text-white
                sm:text-4xl
              "
            >
              Condomínios
            </h1>

            <p
              className="
                mt-3
                max-w-2xl
                text-sm
                leading-6
                text-white/70
              "
            >
              Consulte e gerencie todos os
              condomínios cadastrados na plataforma
              Morada Oficial.
            </p>
          </div>

          {/* =================================================
              NOVO CONDOMÍNIO
          ================================================= */}

          <button
            type="button"
            onClick={abrirCadastro}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-[#89A58F]
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-[0_10px_25px_rgba(137,165,143,0.22)]
              transition-all
              duration-300
              hover:bg-[#78967F]
              active:scale-[0.98]
            "
          >
            <ClipboardPlus
              className="h-4 w-4"
              strokeWidth={1.8}
            />

            Novo condomínio
          </button>
        </div>
      </section>

      {/* =====================================================
          BARRA DE NAVEGAÇÃO
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
        "
      >
        {/* ===================================================
            CADASTRAR CONDOMÍNIO
        =================================================== */}

        <button
          type="button"
          onClick={abrirCadastro}
          className={`
            flex
            h-[48px]
            min-h-[48px]
            items-center
            gap-3
            rounded-xl
            border
            px-4
            text-left
            transition-all
            duration-300

            ${
              abaAtiva === "cadastro"
                ? `
                    border-[#89A58F]
                    bg-[#89A58F]
                    text-white
                    shadow-[0_6px_18px_rgba(137,165,143,0.18)]
                  `
                : `
                    border-white/10
                    bg-black/20
                    text-white/85
                    backdrop-blur-xl
                    hover:bg-white/10
                  `
            }
          `}
        >
          <div
            className={`
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center
              rounded-lg

              ${
                abaAtiva === "cadastro"
                  ? "bg-white/15"
                  : "bg-white/10"
              }
            `}
          >
            <ClipboardPlus
              className="h-4 w-4"
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate
                text-[13px]
                font-semibold
              "
            >
              Cadastrar condomínio
            </p>

            <p
              className="
                truncate
                text-[11px]
                text-white/65
              "
            >
              Novo cadastro
            </p>
          </div>
        </button>

        {/* ===================================================
            CONDOMÍNIOS CADASTRADOS
        =================================================== */}

        <button
          type="button"
          onClick={abrirLista}
          className={`
            flex
            h-[48px]
            min-h-[48px]
            items-center
            justify-between
            gap-3
            rounded-xl
            border
            px-4
            text-left
            transition-all
            duration-300

            ${
              abaAtiva === "lista"
                ? `
                    border-[#89A58F]
                    bg-[#89A58F]
                    text-white
                    shadow-[0_6px_18px_rgba(137,165,143,0.18)]
                  `
                : `
                    border-white/10
                    bg-black/20
                    text-white/85
                    backdrop-blur-xl
                    hover:bg-white/10
                  `
            }
          `}
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className={`
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-lg

                ${
                  abaAtiva === "lista"
                    ? "bg-white/15"
                    : "bg-white/10"
                }
              `}
            >
              <Building2
                className="h-4 w-4"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-[13px]
                  font-semibold
                "
              >
                Condomínios cadastrados
              </p>

              <p
                className="
                  truncate
                  text-[11px]
                  text-white/65
                "
              >
                Visualizar registros
              </p>
            </div>
          </div>

          <span
            className={`
              flex
              h-7
              min-w-[28px]
              shrink-0
              items-center
              justify-center
              rounded-full
              px-2
              text-xs
              font-semibold

              ${
                abaAtiva === "lista"
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/80"
              }
            `}
          >
            {carregando
              ? "--"
              : condominios.length}
          </span>
        </button>
      </div>

      {/* =====================================================
          SUCESSO
      ===================================================== */}

      {sucesso && (
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            rounded-xl
            border
            border-[#89A58F]/30
            bg-[#89A58F]/20
            px-4
            py-3
            text-sm
            font-semibold
            text-[#D7F0DE]
            backdrop-blur-xl
          "
        >
          <span>{sucesso}</span>

          <button
            type="button"
            onClick={() => setSucesso("")}
            className="
              rounded-lg
              p-1
              transition-all
              hover:bg-white/10
            "
            aria-label="Fechar mensagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =====================================================
          ERRO
      ===================================================== */}

      {erro &&
        !condominioParaExcluir && (
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              rounded-xl
              border
              border-red-300/20
              bg-red-500/10
              px-4
              py-3
              text-sm
              font-semibold
              text-red-100
              backdrop-blur-xl
            "
          >
            <span>{erro}</span>

            <button
              type="button"
              onClick={() => setErro("")}
              className="
                rounded-lg
                p-1
                transition-all
                hover:bg-white/10
              "
              aria-label="Fechar mensagem"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

      {/* =====================================================
          CADASTRO
      ===================================================== */}

      {abaAtiva === "cadastro" && (
        <CondominioForm
          initialData={condominioEditando}
          onSubmit={salvarCondominio}
          onCancel={cancelarFormulario}
          salvando={salvando}
        />
      )}

      {/* =====================================================
          LISTA
      ===================================================== */}

      {abaAtiva === "lista" && (
        <section
          className="
            rounded-[30px]
            border
            border-white/10
            bg-black/20
            p-6
            backdrop-blur-2xl
            shadow-[0_20px_50px_rgba(0,0,0,0.15)]
            sm:p-7
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-xl
                  font-semibold
                  text-white
                  sm:text-2xl
                "
              >
                Condomínios cadastrados
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-white/65
                "
              >
                Visualize, edite ou exclua um
                condomínio.
              </p>
            </div>

            {condominios.length > 0 && (
              <div
                className="
                  relative
                  w-full
                  md:w-80
                "
              >
                <Search
                  className="
                    absolute
                    left-4
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-white/45
                  "
                  strokeWidth={1.8}
                />

                <input
                  type="text"
                  value={busca}
                  onChange={(event) =>
                    setBusca(
                      event.target.value
                    )
                  }
                  placeholder="Buscar condomínio..."
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/10
                    py-3
                    pl-11
                    pr-4
                    text-sm
                    text-white
                    backdrop-blur-xl
                    outline-none
                    transition-all
                    placeholder:text-white/45
                    focus:border-[#89A58F]/60
                    focus:bg-white/15
                    focus:ring-2
                    focus:ring-[#89A58F]/20
                  "
                />
              </div>
            )}
          </div>

          <div className="mt-8">
            {carregando ? (
              <div
                className="
                  py-12
                  text-center
                  text-sm
                  text-white/65
                "
              >
                Carregando condomínios...
              </div>
            ) : condominios.length === 0 ? (
              <EmptyState
                titulo="Nenhum condomínio cadastrado"
                descricao="Ainda não existe nenhum condomínio cadastrado na plataforma."
                textoBotao="Cadastrar condomínio"
                onAction={abrirCadastro}
              />
            ) : condominiosFiltrados.length === 0 ? (
              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  p-10
                  text-center
                  backdrop-blur-xl
                "
              >
                <Search
                  className="
                    mx-auto
                    h-8
                    w-8
                    text-white/40
                  "
                  strokeWidth={1.8}
                />

                <h3
                  className="
                    mt-4
                    font-semibold
                    text-white
                "
                >
                  Nenhum resultado encontrado
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    text-white/60
                  "
                >
                  Tente pesquisar pelo nome,
                  documento ou cidade.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {condominiosFiltrados.map(
                  (condominio) => (
                    <CondominioCard
                      key={condominio.id}
                      condominio={condominio}
                      onEditar={abrirEdicao}
                      onExcluir={
                        abrirConfirmacaoExclusao
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          MODAL DE EXCLUSÃO
      ===================================================== */}

      {condominioParaExcluir && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            px-5
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharConfirmacaoExclusao();
            }
          }}
        >
          <div
            className="
              w-full
              max-w-md
              rounded-[30px]
              border
              border-white/10
              bg-black/30
              p-7
              backdrop-blur-2xl
              shadow-[0_20px_60px_rgba(0,0,0,0.45)]
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
                  rounded-2xl
                  border
                  border-[#89A58F]/30
                  bg-[#89A58F]/15
                  text-[#B9D4BC]
                "
              >
                <LockKeyhole
                  className="h-5 w-5"
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <h2
                  className="
                    text-xl
                    font-bold
                    text-white
                  "
                >
                  Confirmar exclusão
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-white/70
                  "
                >
                  Para excluir{" "}
                  <strong className="text-white">
                    {
                      condominioParaExcluir.nome
                    }
                  </strong>
                  , confirme sua senha de Super
                  Admin.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="senha-exclusao"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-white/85
                "
              >
                Senha
              </label>

              <input
                id="senha-exclusao"
                type="password"
                value={senhaExclusao}
                onChange={(event) =>
                  setSenhaExclusao(
                    event.target.value
                  )
                }
                placeholder="Digite sua senha"
                autoFocus
                disabled={excluindo}
                className="
                  w-full
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                  px-4
                  py-3
                  text-sm
                  text-white
                  backdrop-blur-xl
                  outline-none
                  transition-all
                  placeholder:text-white/40
                  focus:border-[#89A58F]/60
                  focus:bg-white/15
                  focus:ring-2
                  focus:ring-[#89A58F]/20
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />
            </div>

            {erro && (
              <div
                className="
                  mt-4
                  rounded-xl
                  border
                  border-red-300/20
                  bg-red-500/10
                  px-4
                  py-3
                  text-sm
                  text-red-100
                  backdrop-blur-xl
                "
              >
                {erro}
              </div>
            )}

            <div
              className="
                mt-7
                flex
                flex-col-reverse
                gap-3
                sm:flex-row
                sm:justify-end
              "
            >
              <button
                type="button"
                onClick={
                  fecharConfirmacaoExclusao
                }
                disabled={excluindo}
                className="
                  rounded-xl
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white/70
                  transition-all
                  hover:bg-white/10
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#89A58F]
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition-all
                  duration-300
                  hover:bg-[#78967F]
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <Trash2
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />

                {excluindo
                  ? "Excluindo..."
                  : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}