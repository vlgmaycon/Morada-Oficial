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
  Copy,
  KeyRound,
  Check,
} from "lucide-react";

import { auth } from "@/auth/firebase";

import {
  criarContaAdminTemporaria,
  atualizarUsuarioAdministrativo,
  enviarRedefinicaoSenha,
} from "@/auth/moradaApi";

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

  const [credenciaisAdmin, setCredenciaisAdmin] =
    useState(null);

  const [copiado, setCopiado] = useState("");

  const [enviandoRedefinicaoUid, setEnviandoRedefinicaoUid] =
    useState("");

  /* =========================================================
     CARREGAR CONDOMÍNIOS
  ========================================================= */

  async function carregarCondominios() {
    try {
      const lista = await listarCondominios();
      setCondominios(lista);
    } catch (error) {
      console.error("Erro ao carregar condomínios:", error);
      setErro("Não foi possível carregar os condomínios.");
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
    setCredenciaisAdmin(null);
  }

  /* =========================================================
     EDITAR CONDOMÍNIO
  ========================================================= */

  function abrirEdicao(condominio) {
    setCondominioEditando(condominio);
    setAbaAtiva("cadastro");
    setErro("");
    setSucesso("");
    setCredenciaisAdmin(null);
  }

  /* =========================================================
     CRIAR ACESSO ADMINISTRATIVO
  ========================================================= */

  async function gerarAcessoAdministrador({
    condominioId,
    nome,
    email,
  }) {
    const resultado = await criarContaAdminTemporaria({
      condominioId,
      nome,
      email,
    });

    setCredenciaisAdmin({
      nome,
      email: resultado.email || email,
      senhaTemporaria: resultado.senhaTemporaria,
    });

    return resultado;
  }

  /* =========================================================
     ENVIAR REDEFINIÇÃO DE SENHA AO ADMINISTRADOR
  ========================================================= */

  async function enviarRedefinicaoAdmin(condominio) {
    const adminUid = String(
      condominio?.acessoAdministrativo?.adminUid || ""
    ).trim();

    if (!adminUid) {
      setErro(
        "Não foi encontrado um acesso administrativo vinculado a este condomínio."
      );
      return;
    }

    setEnviandoRedefinicaoUid(adminUid);
    setErro("");
    setSucesso("");

    try {
      const resultado = await enviarRedefinicaoSenha({
        uid: adminUid,
      });

      setSucesso(
        `E-mail de redefinição de senha enviado para ${resultado.email}.`
      );
    } catch (error) {
      console.error(
        "Erro ao enviar redefinição de senha:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível enviar o e-mail de redefinição de senha."
      );
    } finally {
      setEnviandoRedefinicaoUid("");
    }
  }

  /* =========================================================
     COPIAR CREDENCIAIS
  ========================================================= */

  async function copiarCredencial(tipo, valor) {
    try {
      await navigator.clipboard.writeText(String(valor || ""));
      setCopiado(tipo);

      window.setTimeout(() => {
        setCopiado("");
      }, 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);

      setErro(
        "Não foi possível copiar automaticamente. Selecione e copie o conteúdo manualmente."
      );
    }
  }

  /* =========================================================
     SALVAR CONDOMÍNIO
  ========================================================= */

  async function salvarCondominio(dados) {
    setSalvando(true);
    setErro("");
    setSucesso("");
    setCredenciaisAdmin(null);

    try {
      if (condominioEditando?.id) {
        const { id, ...dadosAtualizacao } = dados;

        /*
         * Primeiro atualiza os dados gerais do condomínio.
         */

        await editarCondominio(
          condominioEditando.id,
          dadosAtualizacao
        );

        /*
         * Verifica se já existe uma conta administrativa
         * vinculada ao condomínio.
         */

        const adminUid = String(
          condominioEditando.acessoAdministrativo?.adminUid || ""
        ).trim();

        if (adminUid) {
          /*
           * Atualiza a conta administrativa existente.
           *
           * A operação utiliza o UID original.
           * Não cria uma nova conta no Firebase.
           *
           * O Worker atualiza:
           * - Firebase Authentication;
           * - Perfil em usuarios/{uid};
           * - Dados do responsável no condomínio.
           */

          try {
            await atualizarUsuarioAdministrativo({
              uid: adminUid,
              nome: dados.nomeResponsavelAdmin,
              email: dados.emailResponsavelAdmin,
            });

            setSucesso(
              "Condomínio e acesso administrativo atualizados com sucesso."
            );

            setErro("");
          } catch (erroSincronizacao) {
            console.error(
              "Erro ao sincronizar administrador:",
              erroSincronizacao
            );

            setSucesso(
              "Os dados do condomínio foram atualizados, mas a conta administrativa precisa ser sincronizada."
            );

            setErro(
              erroSincronizacao?.message ||
                "Não foi possível sincronizar o nome e o e-mail do administrador. Você pode tentar novamente editando o condomínio."
            );
          }
        } else {
          /*
           * Se ainda não existe uma conta administrativa,
           * permite criar o acesso quando estiver pendente.
           */

          const acessoPendente =
            condominioEditando.acessoAdministrativo?.status ===
              "pendente" &&
            !condominioEditando.acessoAdministrativo?.adminUid;

          if (acessoPendente) {
            try {
              await gerarAcessoAdministrador({
                condominioId: condominioEditando.id,
                nome: dados.nomeResponsavelAdmin,
                email: dados.emailResponsavelAdmin,
              });

              setSucesso(
                "Condomínio atualizado e acesso administrativo criado com sucesso."
              );

              setErro("");
            } catch (erroAcesso) {
              console.error(
                "Erro ao criar acesso administrativo:",
                erroAcesso
              );

              setSucesso(
                "Condomínio atualizado. Porém, o acesso administrativo continua pendente. Você poderá tentar novamente editando este condomínio."
              );

              setErro(
                erroAcesso.message ||
                  "Não foi possível criar o acesso administrativo."
              );
            }
          } else {
            setSucesso("Condomínio atualizado com sucesso.");
          }
        }
      } else {
        /*
         * Primeiro salva o condomínio.
         * O ID retornado será usado para vincular o administrador.
         */

        const novoCondominio = await criarCondominio(dados);

        if (!novoCondominio?.id) {
          throw new Error(
            "O condomínio foi processado, mas não recebemos seu identificador. Verifique a lista antes de tentar cadastrar novamente."
          );
        }

        /*
         * Depois cria a conta administrativa no Firebase.
         * Se falhar, não tenta cadastrar o condomínio novamente.
         */

        try {
          await gerarAcessoAdministrador({
            condominioId: novoCondominio.id,
            nome: dados.nomeResponsavelAdmin,
            email: dados.emailResponsavelAdmin,
          });

          setSucesso(
            "Condomínio cadastrado e acesso administrativo criado com sucesso."
          );

          setErro("");
        } catch (erroAcesso) {
          console.error(
            "Condomínio salvo, mas o acesso administrativo falhou:",
            erroAcesso
          );

          setSucesso(
            "Condomínio cadastrado com sucesso, mas o acesso administrativo ficou pendente. Edite esse condomínio na lista para tentar novamente."
          );

          setErro(
            erroAcesso.message ||
              "Não foi possível criar o acesso administrativo."
          );
        }
      }

      await carregarCondominios();

      setCondominioEditando(null);
      setCondominioAberto(null);
      setAbaAtiva("lista");
    } catch (error) {
      console.error("Erro ao salvar condomínio:", error);

      setErro(
        error?.message ||
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
      setErro("Não foi possível identificar sua conta.");
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

      setSucesso("Condomínio excluído com sucesso.");
      setAbaAtiva("lista");
    } catch (error) {
      console.error("Erro ao excluir condomínio:", error);

      if (
        error?.code === "auth/invalid-credential" ||
        error?.code === "auth/wrong-password"
      ) {
        setErro(
          "Senha incorreta. A exclusão não foi realizada."
        );
        return;
      }

      if (error?.code === "auth/too-many-requests") {
        setErro(
          "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente."
        );
        return;
      }

      setErro("Não foi possível excluir o condomínio.");
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
      {/* CABEÇALHO */}

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

      {/* MENSAGEM DE SUCESSO */}

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
              flex h-9 w-9 shrink-0 items-center
              justify-center rounded-xl text-[#FFFFFF]
              transition-all hover:bg-white/10
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* MENSAGEM DE ERRO */}

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
              flex h-9 w-9 shrink-0 items-center
              justify-center rounded-xl text-[#FFFFFF]
              transition-all hover:bg-white/10
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* CREDENCIAIS DO ADMINISTRADOR */}

      {credenciaisAdmin && (
        <section className={`${CARD_GLASS} space-y-5 p-5 sm:p-7`}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6F9272]/30 text-white">
              <KeyRound className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Acesso administrativo criado
              </h2>

              <p className="mt-1 text-sm leading-6 text-white">
                Guarde estas informações e encaminhe ao responsável
                pelo condomínio. A senha é temporária.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <CampoCredencial
              label="Responsável"
              valor={credenciaisAdmin.nome}
              onCopiar={() =>
                copiarCredencial("nome", credenciaisAdmin.nome)
              }
              copiado={copiado === "nome"}
            />

            <CampoCredencial
              label="E-mail de acesso"
              valor={credenciaisAdmin.email}
              onCopiar={() =>
                copiarCredencial("email", credenciaisAdmin.email)
              }
              copiado={copiado === "email"}
            />

            <CampoCredencial
              label="Senha temporária"
              valor={credenciaisAdmin.senhaTemporaria}
              onCopiar={() =>
                copiarCredencial(
                  "senha",
                  credenciaisAdmin.senhaTemporaria
                )
              }
              copiado={copiado === "senha"}
            />
          </div>

          <p className="text-xs leading-5 text-white/90">
            No primeiro acesso, o administrador deverá alterar a
            senha temporária. Esta senha não será exibida novamente
            depois que você sair desta tela.
          </p>

          <button
            type="button"
            onClick={() => setCredenciaisAdmin(null)}
            className="
              inline-flex min-h-[48px] items-center justify-center
              rounded-xl border border-white/20 bg-white/10
              px-4 py-3 text-sm font-semibold text-white
              transition-all hover:bg-white/15
            "
          >
            Fechar credenciais
          </button>
        </section>
      )}

      {/* FORMULÁRIO */}

      {abaAtiva === "cadastro" && (
        <CondominioForm
          initialData={condominioEditando}
          onSubmit={salvarCondominio}
          onCancel={cancelarFormulario}
          salvando={salvando}
        />
      )}

      {/* LISTA DE CONDOMÍNIOS */}

      {abaAtiva === "lista" && (
        <>
          <div className="relative">
            <Search
              className="
                pointer-events-none absolute left-4 top-1/2
                z-10 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]
              "
              strokeWidth={1.8}
            />

            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar condomínio..."
              aria-label="Buscar condomínio"
              className="
                h-12 w-full rounded-full border border-white/15
                bg-white/20 py-2 pl-12 pr-5 text-[14px]
                text-[#FFFFFF] backdrop-blur-2xl outline-none
                transition-all placeholder:text-white/80
                focus:border-[#6F9272] focus:bg-white/25
                focus:ring-2 focus:ring-[#6F9272]/30
              "
            />
          </div>

          <section
            className={`
              ${CARD_GLASS}
              overflow-hidden
              p-5
              sm:p-7
            `}
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-[#FFFFFF] sm:text-2xl">
                Condomínios cadastrados
              </h2>

              <p className="mt-1 text-sm text-[#FFFFFF]">
                Selecione a seta para consultar os dados de um condomínio.
              </p>
            </div>

            {carregando && (
              <div className="border-t border-white/15 py-10 text-center">
                <p className="text-sm text-[#FFFFFF]">
                  Carregando condomínios...
                </p>
              </div>
            )}

            {!carregando && condominios.length === 0 && (
              <div className="border-t border-white/15 py-10 text-center">
                <Building2 className="mx-auto h-8 w-8 text-[#FFFFFF]" />

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
                    mt-5 inline-flex min-h-[58px] items-center
                    justify-center gap-3 rounded-xl bg-[#6F9272]
                    px-4 py-3 text-[14px] font-semibold text-white
                    transition-all hover:bg-[#5C7D60]
                  "
                >
                  <ClipboardPlus className="h-[22px] w-[22px]" />
                  Cadastrar condomínio
                </button>
              </div>
            )}

            {!carregando &&
              condominios.length > 0 &&
              condominiosFiltrados.length === 0 && (
                <div className="border-t border-white/15 py-10 text-center">
                  <Search className="mx-auto h-8 w-8 text-[#FFFFFF]" />

                  <h3 className="mt-4 font-semibold text-[#FFFFFF]">
                    Nenhum resultado encontrado
                  </h3>

                  <p className="mt-2 text-sm text-[#FFFFFF]">
                    Tente pesquisar pelo nome, documento, endereço ou cidade.
                  </p>
                </div>
              )}

            {!carregando && condominiosFiltrados.length > 0 && (
              <div className="border-t border-white/15">
                {condominiosFiltrados.map((condominio) => (
                  <CondominioLinha
                    key={condominio.id}
                    condominio={condominio}
                    expandido={condominioAberto === condominio.id}
                    onAlternar={() =>
                      alternarCondominio(condominio.id)
                    }
                    onEditar={abrirEdicao}
                    onExcluir={abrirConfirmacaoExclusao}
                    onEnviarRedefinicao={enviarRedefinicaoAdmin}
                    enviandoRedefinicaoUid={enviandoRedefinicaoUid}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* MODAL DE EXCLUSÃO */}

      {condominioParaExcluir && (
        <div
          className="
            fixed inset-0 z-50 flex items-center justify-center
            bg-black/45 px-5 py-6 backdrop-blur-sm
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
            className={`${CARD_GLASS} w-full max-w-md p-6 sm:p-7`}
          >
            <div className="flex items-start gap-4">
              <LockKeyhole className="h-7 w-7 shrink-0 text-[#FFFFFF]" />

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
                  w-full rounded-2xl border border-white/15
                  bg-white/10 px-4 py-3 text-sm text-[#FFFFFF]
                  outline-none transition-all placeholder:text-white/80
                  focus:border-[#6F9272] focus:ring-2
                  focus:ring-[#6F9272]/30 disabled:opacity-60
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
                  inline-flex min-h-[58px] items-center justify-center
                  rounded-xl border border-white/20 bg-white/10
                  px-4 py-3 text-[14px] font-semibold text-[#FFFFFF]
                  transition-all hover:bg-white/15 disabled:opacity-50
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="
                  inline-flex min-h-[58px] items-center justify-center
                  gap-3 rounded-xl bg-[#6F9272] px-4 py-3
                  text-[14px] font-semibold text-[#FFFFFF]
                  transition-all hover:bg-[#5C7D60]
                  disabled:opacity-60
                "
              >
                <Trash2 className="h-[22px] w-[22px]" />
                {excluindo ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   CAMPO DE CREDENCIAL
========================================================= */

function CampoCredencial({ label, valor, onCopiar, copiado }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-white/90">
        {label}
      </p>

      <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-3">
        <p className="min-w-0 flex-1 break-all text-sm font-medium text-white">
          {valor}
        </p>

        <button
          type="button"
          onClick={onCopiar}
          aria-label={`Copiar ${label}`}
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-xl text-white transition-all hover:bg-white/15
          "
        >
          {copiado ? (
            <Check className="h-5 w-5" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>
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
  onEnviarRedefinicao,
  enviandoRedefinicaoUid,
}) {
  const enderecoLinha = [
    condominio.endereco,
    condominio.numero ? `nº ${condominio.numero}` : "",
    condominio.cidade,
    condominio.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const enderecoCompleto = [
    condominio.endereco,
    condominio.numero ? `nº ${condominio.numero}` : "",
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

  const cepFormatado = formatarCEP(condominio.cep);

  const adminUid = String(
    condominio.acessoAdministrativo?.adminUid || ""
  ).trim();

  const nomeResponsavelAdmin =
    condominio.nomeResponsavelAdmin ||
    condominio.acessoAdministrativo?.nomeResponsavelAdmin ||
    "";

  const emailResponsavelAdmin =
    condominio.emailResponsavelAdmin ||
    condominio.acessoAdministrativo?.emailResponsavelAdmin ||
    "";

  const enviandoRedefinicao =
    Boolean(adminUid) &&
    enviandoRedefinicaoUid === adminUid;

  const acessoPendente =
    condominio.acessoAdministrativo?.status === "pendente" &&
    !adminUid;

  return (
    <div className="border-b border-white/15 last:border-b-0">
      <div className="flex min-h-[72px] items-center gap-3 py-3 sm:gap-5">
        <div className="min-w-0 flex-1">
          <p className="break-words text-base font-semibold leading-6 text-[#FFFFFF] sm:text-lg">
            {condominio.nome || "Condomínio sem nome"}
          </p>

          {!expandido && (
            <p className="mt-1 break-words text-xs leading-5 text-[#FFFFFF] sm:text-[13px]">
              {enderecoLinha || "Endereço não informado"}
            </p>
          )}
        </div>

        <span
          className={`
            shrink-0 rounded-full border px-3 py-1.5
            text-xs font-semibold text-[#FFFFFF]
            ${
              condominio.ativo
                ? "border-[#6F9272] bg-[#6F9272]"
                : "border-white/25 bg-white/10"
            }
          `}
        >
          {condominio.ativo ? "Ativo" : "Inativo"}
        </span>

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
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-xl text-[#FFFFFF] transition-all duration-300
            hover:bg-white/10
          "
        >
          <ChevronDown
            className={`
              h-5 w-5 transition-transform duration-300
              ${expandido ? "rotate-180" : ""}
            `}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {expandido && (
        <div className="space-y-5 pb-5 pt-2">
          {acessoPendente && (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-sm font-semibold text-white">
                Acesso administrativo pendente
              </p>

              <p className="mt-1 text-xs leading-5 text-white/90">
                O condomínio está cadastrado, mas a conta do
                administrador ainda não foi criada. Selecione
                Editar para revisar os dados e tentar novamente.
              </p>
            </div>
          )}

          {documentoFormatado && (
            <InfoLinha
              label="CPF / CNPJ"
              valor={documentoFormatado}
            />
          )}

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

          {(cepFormatado || condominio.pais) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {cepFormatado && (
                <InfoLinha label="CEP" valor={cepFormatado} />
              )}

              {condominio.pais && (
                <InfoLinha label="País" valor={condominio.pais} />
              )}
            </div>
          )}

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

          {/* RESPONSÁVEL ADMINISTRATIVO */}

          {(adminUid ||
            nomeResponsavelAdmin ||
            emailResponsavelAdmin) && (
            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/10 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/90">
                  Responsável administrativo
                </p>

                {nomeResponsavelAdmin && (
                  <p className="mt-2 break-words text-sm font-semibold text-white">
                    {nomeResponsavelAdmin}
                  </p>
                )}

                {emailResponsavelAdmin && (
                  <p className="mt-1 break-all text-sm text-white/90">
                    {emailResponsavelAdmin}
                  </p>
                )}
              </div>

              {adminUid && (
                <div className="border-t border-white/15 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      onEnviarRedefinicao(condominio)
                    }
                    disabled={enviandoRedefinicao}
                    className="
                      inline-flex min-h-[48px] w-full
                      items-center justify-center gap-3
                      rounded-xl bg-[#6F9272] px-4 py-3
                      text-sm font-semibold text-white
                      transition-all hover:bg-[#5C7D60]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      sm:w-auto
                    "
                  >
                    <KeyRound className="h-5 w-5" />

                    {enviandoRedefinicao
                      ? "Enviando e-mail..."
                      : "Enviar redefinição de senha"}
                  </button>

                  <p className="mt-2 text-xs leading-5 text-white/80">
                    O link será enviado ao e-mail atualmente
                    cadastrado na conta do administrador.
                  </p>
                </div>
              )}
            </div>
          )}

          <div
            className="
              flex flex-wrap items-center gap-x-6 gap-y-3
              border-y border-white/15 py-4
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
                      rounded-full border border-white/15
                      bg-white/10 px-3 py-1.5 text-xs
                      font-medium text-[#FFFFFF]
                    "
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/15 pt-4">
            <button
              type="button"
              onClick={() => onEditar(condominio)}
              className="
                inline-flex min-h-[58px] items-center justify-center
                gap-3 rounded-xl border border-white/20 bg-white/10
                px-4 py-3 text-[14px] font-semibold text-[#FFFFFF]
                transition-all hover:bg-white/15
              "
            >
              <Pencil className="h-[20px] w-[20px]" />
              Editar
            </button>

            <button
              type="button"
              onClick={() => onExcluir(condominio)}
              className="
                inline-flex min-h-[58px] items-center justify-center
                gap-3 rounded-xl bg-[#6F9272] px-4 py-3
                text-[14px] font-semibold text-[#FFFFFF]
                transition-all hover:bg-[#5C7D60]
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
      <p className="text-xs text-[#FFFFFF]">{label}</p>
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
      <span className="shrink-0 text-[#FFFFFF]">{icon}</span>
      <span className="text-sm font-semibold text-[#FFFFFF]">
        {valor}
      </span>
      <span className="text-sm text-[#FFFFFF]">{label}</span>
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