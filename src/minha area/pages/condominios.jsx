import { useEffect, useMemo, useState } from "react";

import {
  ClipboardPlus,
  Search,
  Trash2,
  LockKeyhole,
  X,
  ChevronDown,
  Building2,
  MapPin,
  Phone,
  Mail,
  Home,
  Car,
  Pencil,
} from "lucide-react";

import { auth } from "@/auth/firebase";
import { criarContaAdminTemporaria } from "@/auth/moradaApi";

import CondominioForm from "../components/CondominioForm";

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

/* =========================================================
   PADRÃO VISUAL MORADA OFICIAL
========================================================= */

const CARD_GLASS = `
  rounded-3xl
  border border-white/15
  bg-white/20
  shadow-[0_10px_35px_rgba(20,30,25,0.12)]
  backdrop-blur-2xl
`;

/* =========================================================
   PÁGINA DE CONDOMÍNIOS
========================================================= */

export default function Condominios() {
  const [abaAtiva, setAbaAtiva] = useState("lista");

  const [condominios, setCondominios] = useState([]);

  const [busca, setBusca] = useState("");

  const [condominioEditando, setCondominioEditando] =
    useState(null);

  const [condominioParaExcluir, setCondominioParaExcluir] =
    useState(null);

  const [senhaExclusao, setSenhaExclusao] = useState("");

  const [carregando, setCarregando] = useState(true);

  const [salvando, setSalvando] = useState(false);

  const [excluindo, setExcluindo] = useState(false);

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] = useState("");

  const [condominioAberto, setCondominioAberto] =
    useState(null);

  /* =========================================================
     CARREGAR CONDOMÍNIOS
  ========================================================= */

  async function carregarCondominios() {
    try {
      setErro("");

      const lista = await listarCondominios();

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
     EDITAR CONDOMÍNIO
  ========================================================= */

  function abrirEdicao(condominio) {
    setCondominioEditando(condominio);
    setAbaAtiva("cadastro");
    setErro("");
    setSucesso("");
  }

  /* =========================================================
     SALVAR CONDOMÍNIO
  ========================================================= */

  async function salvarCondominio(dados) {
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      if (condominioEditando?.id) {
        const { id, ...dadosAtualizacao } = dados;

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
      setCondominioAberto(null);
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
     EXPANDIR E RECOLHER CONDOMÍNIO
  ========================================================= */

  function alternarCondominio(id) {
    setCondominioAberto((atual) =>
      atual === id ? null : id
    );
  }

  /* =========================================================
     CONFIRMAÇÃO DE EXCLUSÃO
  ========================================================= */

  function abrirConfirmacaoExclusao(condominio) {
    setCondominioParaExcluir(condominio);
    setSenhaExclusao("");
    setErro("");
    setSucesso("");
  }

  function fecharConfirmacaoExclusao() {
    if (excluindo) return;

    setCondominioParaExcluir(null);
    setSenhaExclusao("");
    setErro("");
  }

  /* =========================================================
     EXCLUIR CONDOMÍNIO
  ========================================================= */

  async function confirmarExclusao() {
    if (!condominioParaExcluir) return;

    const usuarioAtual = auth.currentUser;

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

      const credencial = EmailAuthProvider.credential(
        usuarioAtual.email,
        senhaExclusao
      );

      await reauthenticateWithCredential(
        usuarioAtual,
        credencial
      );

      const idExcluido = condominioParaExcluir.id;

      await excluirCondominio(idExcluido);

      setCondominioAberto((atual) =>
        atual === idExcluido ? null : atual
      );

      setCondominioParaExcluir(null);
      setSenhaExclusao("");

      await carregarCondominios();

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
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password"
      ) {
        setErro(
          "Senha incorreta. A exclusão não foi realizada."
        );
        return;
      }

      if (
        error?.code === "auth/too-many-requests"
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

  const condominiosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return condominios;

    return condominios.filter((condominio) => {
      const campos = [
        condominio.nome,
        condominio.documento,
        condominio.cidade,
        condominio.estado,
        condominio.bairro,
        condominio.endereco,
      ];

      return campos.some((campo) =>
        String(campo || "")
          .toLowerCase()
          .includes(termo)
      );
    });
  }, [condominios, busca]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="morada-enter space-y-6">

      {/* =====================================================
          CABEÇALHO COM SUBTÍTULO
      ===================================================== */}

      <header
        className="
          flex
          flex-col
          gap-5
          px-1
          pt-1
          md:flex-row
          md:items-center
          md:justify-between
        "
      >
        <div>
          <h1
            className="
              text-3xl
              font-semibold
              tracking-[-0.02em]
              text-[#FFFFFF]
              sm:text-4xl
            "
          >
            Condomínios
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
            Gerencie os condomínios cadastrados e consulte
            as informações de cada empreendimento.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirCadastro}
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
          "
        >
          <ClipboardPlus
            className="h-[22px] w-[22px] shrink-0"
            strokeWidth={1.8}
          />

          <span>Novo condomínio</span>
        </button>
      </header>

      {/* =====================================================
          MENSAGEM DE SUCESSO
      ===================================================== */}

      {sucesso && (
        <div
          className={`
            ${CARD_GLASS}
            flex
            items-center
            justify-between
            gap-4
            px-5
            py-4
          `}
        >
          <p className="text-sm font-semibold text-[#FFFFFF]">
            {sucesso}
          </p>

          <button
            type="button"
            onClick={() => setSucesso("")}
            aria-label="Fechar mensagem"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-[#FFFFFF]
              transition-all
              hover:bg-white/10
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* =====================================================
          MENSAGEM DE ERRO
      ===================================================== */}

      {erro && !condominioParaExcluir && (
        <div
          className={`
            ${CARD_GLASS}
            flex
            items-center
            justify-between
            gap-4
            px-5
            py-4
          `}
        >
          <p className="text-sm font-semibold text-[#FFFFFF]">
            {erro}
          </p>

          <button
            type="button"
            onClick={() => setErro("")}
            aria-label="Fechar mensagem"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-[#FFFFFF]
              transition-all
              hover:bg-white/10
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* =====================================================
          FORMULÁRIO
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
          LISTA DE CONDOMÍNIOS
      ===================================================== */}

      {abaAtiva === "lista" && (
        <>
          {/* BARRA DE PESQUISA */}

          <div className="relative">
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
              placeholder="Buscar condomínio..."
              aria-label="Buscar condomínio"
              className="
                h-12
                w-full
                rounded-full
                border
                border-white/15
                bg-white/20
                py-2
                pl-12
                pr-5
                text-[14px]
                text-[#FFFFFF]
                backdrop-blur-2xl
                outline-none
                transition-all
                placeholder:text-white/80
                focus:border-[#6F9272]
                focus:bg-white/25
                focus:ring-2
                focus:ring-[#6F9272]/30
              "
            />
          </div>

          {/* PAINEL PRINCIPAL */}

          <section
            className={`
              ${CARD_GLASS}
              overflow-hidden
              p-5
              sm:p-7
            `}
          >
            <div className="mb-5">
              <h2
                className="
                  text-xl
                  font-semibold
                  text-[#FFFFFF]
                  sm:text-2xl
                "
              >
                Condomínios cadastrados
              </h2>

              <p className="mt-1 text-sm text-[#FFFFFF]">
                Selecione a seta para consultar os dados de um condomínio.
              </p>
            </div>

            {/* CARREGANDO */}

            {carregando && (
              <div className="border-t border-white/15 py-10 text-center">
                <p className="text-sm text-[#FFFFFF]">
                  Carregando condomínios...
                </p>
              </div>
            )}

            {/* LISTA VAZIA */}

            {!carregando &&
              condominios.length === 0 && (
                <div className="border-t border-white/15 py-10 text-center">
                  <Building2
                    className="mx-auto h-8 w-8 text-[#FFFFFF]"
                    strokeWidth={1.6}
                  />

                  <h3 className="mt-4 text-lg font-semibold text-[#FFFFFF]">
                    Nenhum condomínio cadastrado
                  </h3>

                  <p className="mt-2 text-sm text-[#FFFFFF]">
                    Cadastre o primeiro condomínio para começar a organizar a plataforma.
                  </p>

                  <button
                    type="button"
                    onClick={abrirCadastro}
                    className="
                      mt-5
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
                      transition-all
                      hover:bg-[#5C7D60]
                    "
                  >
                    <ClipboardPlus className="h-[22px] w-[22px]" />
                    Cadastrar condomínio
                  </button>
                </div>
              )}

            {/* PESQUISA SEM RESULTADOS */}

            {!carregando &&
              condominios.length > 0 &&
              condominiosFiltrados.length === 0 && (
                <div className="border-t border-white/15 py-10 text-center">
                  <Search
                    className="mx-auto h-8 w-8 text-[#FFFFFF]"
                    strokeWidth={1.8}
                  />

                  <h3 className="mt-4 font-semibold text-[#FFFFFF]">
                    Nenhum resultado encontrado
                  </h3>

                  <p className="mt-2 text-sm text-[#FFFFFF]">
                    Tente pesquisar pelo nome, documento, endereço ou cidade.
                  </p>
                </div>
              )}

            {/* LINHAS DOS CONDOMÍNIOS */}

            {!carregando &&
              condominiosFiltrados.length > 0 && (
                <div className="border-t border-white/15">
                  {condominiosFiltrados.map((condominio) => (
                    <CondominioLinha
                      key={condominio.id}
                      condominio={condominio}
                      expandido={
                        condominioAberto === condominio.id
                      }
                      onAlternar={() =>
                        alternarCondominio(condominio.id)
                      }
                      onEditar={abrirEdicao}
                      onExcluir={abrirConfirmacaoExclusao}
                    />
                  ))}
                </div>
              )}
          </section>
        </>
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
            bg-black/45
            px-5
            py-6
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharConfirmacaoExclusao();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-exclusao-condominio"
            className={`
              ${CARD_GLASS}
              w-full
              max-w-md
              p-6
              sm:p-7
            `}
          >
            <div className="flex items-start gap-4">
              <LockKeyhole
                className="h-7 w-7 shrink-0 text-[#FFFFFF]"
                strokeWidth={1.8}
              />

              <div className="min-w-0">
                <h2
                  id="titulo-exclusao-condominio"
                  className="text-xl font-semibold text-[#FFFFFF]"
                >
                  Confirmar exclusão
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#FFFFFF]">
                  Para excluir{" "}
                  <strong className="text-[#FFFFFF]">
                    {condominioParaExcluir.nome}
                  </strong>
                  , confirme sua senha de Super Admin.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="senha-exclusao"
                className="mb-2 block text-sm font-semibold text-[#FFFFFF]"
              >
                Senha
              </label>

              <input
                id="senha-exclusao"
                type="password"
                value={senhaExclusao}
                onChange={(event) =>
                  setSenhaExclusao(event.target.value)
                }
                placeholder="Digite sua senha"
                autoFocus
                disabled={excluindo}
                className="
                  w-full
                  rounded-2xl
                  border
                  border-white/15
                  bg-white/10
                  px-4
                  py-3
                  text-sm
                  text-[#FFFFFF]
                  outline-none
                  transition-all
                  placeholder:text-white/80
                  focus:border-[#6F9272]
                  focus:ring-2
                  focus:ring-[#6F9272]/30
                  disabled:opacity-60
                "
              />
            </div>

            {erro && (
              <p role="alert" className="mt-4 text-sm text-[#FFFFFF]">
                {erro}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharConfirmacaoExclusao}
                disabled={excluindo}
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
                  transition-all
                  hover:bg-[#5C7D60]
                  disabled:opacity-60
                "
              >
                <Trash2 className="h-[22px] w-[22px]" />

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

/* =========================================================
   LINHA EXPANSÍVEL DO CONDOMÍNIO
========================================================= */

function CondominioLinha({
  condominio,
  expandido,
  onAlternar,
  onEditar,
  onExcluir,
}) {
  const enderecoLinha = [
    condominio.endereco,
    condominio.numero
      ? `nº ${condominio.numero}`
      : "",
    condominio.cidade,
    condominio.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const enderecoCompleto = [
    condominio.endereco,
    condominio.numero
      ? `nº ${condominio.numero}`
      : "",
    condominio.complemento,
    condominio.bairro,
    condominio.cidade,
    condominio.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const areasComuns = Array.isArray(condominio.areasComuns)
    ? condominio.areasComuns
    : [];

  const documentoFormatado =
    formatarDocumento(condominio.documento);

  const telefoneFormatado =
    formatarTelefone(condominio.telefone);

  const cepFormatado =
    formatarCEP(condominio.cep);

  return (
    <div className="border-b border-white/15 last:border-b-0">

      {/* ===================================================
          LINHA PRINCIPAL
      =================================================== */}

      <div
        className="
          flex
          min-h-[72px]
          items-center
          gap-3
          py-3
          sm:gap-5
        "
      >
        <div className="min-w-0 flex-1">
          <p
            className="
              break-words
              text-base
              font-semibold
              leading-6
              text-[#FFFFFF]
              sm:text-lg
            "
          >
            {condominio.nome || "Condomínio sem nome"}
          </p>

          {/* ENDEREÇO RESUMIDO SÓ QUANDO FECHADO */}

          {!expandido && (
            <p
              className="
                mt-1
                break-words
                text-xs
                leading-5
                text-[#FFFFFF]
                sm:text-[13px]
              "
            >
              {enderecoLinha || "Endereço não informado"}
            </p>
          )}
        </div>

        {/* STATUS */}

        <span
          className={`
            shrink-0
            rounded-full
            border
            px-3
            py-1.5
            text-xs
            font-semibold
            text-[#FFFFFF]
            ${
              condominio.ativo
                ? "border-[#6F9272] bg-[#6F9272]"
                : "border-white/25 bg-white/10"
            }
          `}
        >
          {condominio.ativo ? "Ativo" : "Inativo"}
        </span>

        {/* SETA */}

        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={expandido}
          aria-label={
            expandido
              ? `Recolher ${condominio.nome}`
              : `Ver resumo de ${condominio.nome}`
          }
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
            duration-300
            hover:bg-white/10
          "
        >
          <ChevronDown
            className={`
              h-5
              w-5
              transition-transform
              duration-300
              ${expandido ? "rotate-180" : ""}
            `}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* ===================================================
          RESUMO EXPANSÍVEL
          O endereço completo aparece aqui uma única vez.
      =================================================== */}

      {expandido && (
        <div className="space-y-5 pb-5 pt-2">

          {/* CPF / CNPJ */}

          {documentoFormatado && (
            <InfoLinha
              label="CPF / CNPJ"
              valor={documentoFormatado}
            />
          )}

          {/* ENDEREÇO COMPLETO ABAIXO DO DOCUMENTO */}

          {enderecoCompleto && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#FFFFFF]" />

              <div className="min-w-0">
                <p className="text-xs text-[#FFFFFF]">
                  Endereço completo
                </p>

                <p className="mt-1 break-words text-sm text-[#FFFFFF]">
                  {enderecoCompleto}
                </p>
              </div>
            </div>
          )}

          {/* CEP E PAÍS */}

          {(cepFormatado || condominio.pais) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {cepFormatado && (
                <InfoLinha
                  label="CEP"
                  valor={cepFormatado}
                />
              )}

              {condominio.pais && (
                <InfoLinha
                  label="País"
                  valor={condominio.pais}
                />
              )}
            </div>
          )}

          {/* CONTATO */}

          {(telefoneFormatado || condominio.email) && (
            <div className="flex flex-wrap gap-x-6 gap-y-4">
              {telefoneFormatado && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#FFFFFF]" />

                  <div>
                    <p className="text-xs text-[#FFFFFF]">
                      Telefone
                    </p>

                    <p className="mt-1 text-sm text-[#FFFFFF]">
                      {telefoneFormatado}
                    </p>
                  </div>
                </div>
              )}

              {condominio.email && (
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#FFFFFF]" />

                  <div className="min-w-0">
                    <p className="text-xs text-[#FFFFFF]">
                      E-mail
                    </p>

                    <p className="mt-1 break-all text-sm text-[#FFFFFF]">
                      {condominio.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ESTRUTURA */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-x-6
              gap-y-3
              border-y
              border-white/15
              py-4
            "
          >
            <ResumoNumero
              icon={<Building2 className="h-5 w-5" />}
              label="Blocos"
              valor={condominio.blocos || 0}
            />

            <ResumoNumero
              icon={<Home className="h-5 w-5" />}
              label="Apartamentos"
              valor={condominio.apartamentos || 0}
            />

            <ResumoNumero
              icon={<Car className="h-5 w-5" />}
              label="Vagas de garagem"
              valor={condominio.vagasGaragem || 0}
            />

            <ResumoNumero
              icon={<Car className="h-5 w-5" />}
              label="Vagas de visitantes"
              valor={condominio.vagasVisitantes || 0}
            />
          </div>

          {/* ÁREAS COMUNS */}

          {areasComuns.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
                Áreas comuns
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {areasComuns.map((area) => (
                  <span
                    key={area}
                    className="
                      rounded-full
                      border
                      border-white/15
                      bg-white/10
                      px-3
                      py-1.5
                      text-xs
                      font-medium
                      text-[#FFFFFF]
                    "
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AÇÕES */}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/15 pt-4">
            <button
              type="button"
              onClick={() => onEditar(condominio)}
              className="
                inline-flex
                min-h-[58px]
                items-center
                justify-center
                gap-3
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
              "
            >
              <Pencil className="h-[20px] w-[20px]" />
              Editar
            </button>

            <button
              type="button"
              onClick={() => onExcluir(condominio)}
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
                transition-all
                hover:bg-[#5C7D60]
              "
            >
              <Trash2 className="h-[20px] w-[20px]" />
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   INFORMAÇÃO SIMPLES
========================================================= */

function InfoLinha({ label, valor }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[#FFFFFF]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-[#FFFFFF]">
        {valor}
      </p>
    </div>
  );
}

/* =========================================================
   INDICADOR DE ESTRUTURA
========================================================= */

function ResumoNumero({ icon, label, valor }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-[#FFFFFF]">
        {icon}
      </span>

      <span className="text-sm font-semibold text-[#FFFFFF]">
        {valor}
      </span>

      <span className="text-sm text-[#FFFFFF]">
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   FORMATAÇÃO DE DOCUMENTO
========================================================= */

function somenteNumeros(valor = "") {
  return String(valor).replace(/\D/g, "");
}

function formatarDocumento(valor = "") {
  const numeros = somenteNumeros(valor);

  if (!numeros) return "";

  if (numeros.length === 11) {
    return numeros.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );
  }

  if (numeros.length === 14) {
    return numeros.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }

  return valor;
}

/* =========================================================
   FORMATAÇÃO DE TELEFONE
========================================================= */

function formatarTelefone(valor = "") {
  const numeros = somenteNumeros(valor);

  if (numeros.length === 10) {
    return numeros.replace(
      /(\d{2})(\d{4})(\d{4})/,
      "($1) $2-$3"
    );
  }

  if (numeros.length === 11) {
    return numeros.replace(
      /(\d{2})(\d{5})(\d{4})/,
      "($1) $2-$3"
    );
  }

  return valor;
}

/* =========================================================
   FORMATAÇÃO DE CEP
========================================================= */

function formatarCEP(valor = "") {
  const numeros = somenteNumeros(valor);

  if (numeros.length !== 8) return valor;

  return numeros.replace(
    /(\d{5})(\d{3})/,
    "$1-$2"
  );
}