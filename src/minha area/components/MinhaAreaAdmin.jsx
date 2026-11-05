import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  Search,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  KeyRound,
  Building2,
  SlidersHorizontal,
  Loader2,
  RefreshCw,
  X,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";

import { db } from "@/auth/firebase";

import {
  atualizarUsuarioAdministrativo,
  enviarRedefinicaoSenha,
  excluirUsuarioAdministrativo,
} from "@/auth/moradaApi";

/* =========================================================
   PERFIS ADMINISTRATIVOS
========================================================= */

const PERFIS_ADMINISTRATIVOS = [
  "admin",
  "sindico",
  "portaria",
];

/* =========================================================
   UTILITÁRIOS
========================================================= */

function obterNome(usuario) {
  return usuario?.nome || usuario?.name || "Usuário sem nome";
}

function obterPerfil(usuario) {
  const perfil = String(
    usuario?.role || usuario?.perfil || ""
  ).toLowerCase();

  if (perfil === "sindico" || perfil === "síndico") {
    return "Síndico";
  }

  if (perfil === "portaria" || perfil === "porteiro") {
    return "Porteiro";
  }

  return "Administrador";
}

function usuarioEstaAtivo(usuario) {
  const status = String(
    usuario?.status || ""
  ).toLowerCase();

  return (
    usuario?.ativo !== false &&
    usuario?.active !== false &&
    ![
      "inativo",
      "inactive",
      "bloqueado",
      "blocked",
    ].includes(status)
  );
}

function obterMensagemErro(error) {
  if (error?.code === "permission-denied") {
    return (
      "O Firebase não autorizou a consulta. " +
      "Precisamos verificar as regras de segurança do Firestore."
    );
  }

  if (error?.code === "auth/network-request-failed") {
    return (
      "Não foi possível conectar ao Firebase. " +
      "Verifique sua internet."
    );
  }

  return (
    error?.message ||
    "Não foi possível concluir a operação."
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function MinhaAreaAdmin() {
  const [administradores, setAdministradores] = useState([]);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoSenha, setEnviandoSenha] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [adminVisualizado, setAdminVisualizado] = useState(null);
  const [adminEditando, setAdminEditando] = useState(null);
  const [adminParaExcluir, setAdminParaExcluir] = useState(null);

  const [formulario, setFormulario] = useState({
    nome: "",
    email: "",
    telefone: "",
    ativo: true,
  });

  /* =======================================================
     CARREGAR ADMINISTRADORES DO FIREBASE
  ======================================================= */

  const carregarAdministradores = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const consulta = query(
        collection(db, "usuarios"),
        where("role", "in", PERFIS_ADMINISTRATIVOS)
      );

      const resultado = await getDocs(consulta);

      const lista = resultado.docs.map((documento) => {
        const dados = documento.data();

        return {
          id: documento.id,
          ...dados,
          nome: obterNome(dados),
          email: dados.email || "",
          telefone: dados.telefone || "",
          condominio:
            dados.condominio_nome ||
            dados.condominioNome ||
            "Condomínio não identificado",
          perfilLabel: obterPerfil(dados),
          ativo: usuarioEstaAtivo(dados),
        };
      });

      lista.sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
      );

      setAdministradores(lista);
    } catch (error) {
      console.error(
        "[MINHA ÁREA] Erro ao carregar administradores:",
        error
      );

      setErro(obterMensagemErro(error));
      setAdministradores([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarAdministradores();
  }, [carregarAdministradores]);

  /* =======================================================
     PESQUISA E FILTROS
  ======================================================= */

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return administradores.filter((admin) => {
      const correspondePesquisa = [
        admin.nome,
        admin.email,
        admin.telefone,
        admin.condominio,
        admin.perfilLabel,
      ].some((valor) =>
        String(valor || "")
          .toLowerCase()
          .includes(termo)
      );

      const status = admin.ativo ? "Ativo" : "Inativo";

      const correspondeStatus =
        filtroStatus === "Todos" ||
        status === filtroStatus;

      return correspondePesquisa && correspondeStatus;
    });
  }, [administradores, pesquisa, filtroStatus]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const total = administradores.length;

  const ativos = administradores.filter(
    (admin) => admin.ativo
  ).length;

  const inativos = total - ativos;

  const indicadores = [
    {
      titulo: "Total de administradores",
      valor: total,
      icon: Users,
    },
    {
      titulo: "Contas ativas",
      valor: ativos,
      icon: UserCheck,
    },
    {
      titulo: "Contas inativas",
      valor: inativos,
      icon: UserX,
    },
  ];

  /* =======================================================
     ABRIR VISUALIZAÇÃO
  ======================================================= */

  function visualizarAdministrador(admin) {
    setErro("");
    setSucesso("");
    setAdminVisualizado(admin);
  }

  /* =======================================================
     ABRIR EDIÇÃO
  ======================================================= */

  function editarAdministrador(admin) {
    setErro("");
    setSucesso("");

    setFormulario({
      nome: admin.nome || "",
      email: admin.email || "",
      telefone: admin.telefone || "",
      ativo: admin.ativo,
    });

    setAdminEditando(admin);
  }

  /* =======================================================
     ALTERAR CAMPO
  ======================================================= */

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  /* =======================================================
     SALVAR ALTERAÇÕES
     Atualiza Authentication e Firestore pelo Worker.
  ======================================================= */

  async function salvarAlteracoes(evento) {
    evento.preventDefault();

    if (!adminEditando || salvando) return;

    const nome = String(
      formulario.nome || ""
    ).trim();

    const email = String(
      formulario.email || ""
    )
      .trim()
      .toLowerCase();

    const telefone = String(
      formulario.telefone || ""
    ).trim();

    if (!nome) {
      setErro("Informe o nome do administrador.");
      return;
    }

    if (!email) {
      setErro("Informe o e-mail do administrador.");
      return;
    }

    if (!adminEditando.id) {
      setErro("Não foi possível identificar esta conta.");
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      await atualizarUsuarioAdministrativo({
        uid: adminEditando.id,
        nome,
        email,
        telefone,
        ativo: formulario.ativo === true,
      });

      setAdminEditando(null);

      setFormulario({
        nome: "",
        email: "",
        telefone: "",
        ativo: true,
      });

      setSucesso(
        "Dados do administrador atualizados com sucesso."
      );

      await carregarAdministradores();
    } catch (error) {
      console.error(
        "[MINHA ÁREA] Erro ao salvar administrador:",
        error
      );

      setErro(obterMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     ENVIAR RECUPERAÇÃO DE SENHA PELO WORKER
  ======================================================= */

  async function redefinirSenha(admin) {
    if (!admin?.id) {
      setErro(
        "Não foi possível identificar esta conta."
      );
      return;
    }

    setEnviandoSenha(admin.id);
    setErro("");
    setSucesso("");

    try {
      const resultado = await enviarRedefinicaoSenha({
        uid: admin.id,
      });

      setSucesso(
        `Enviamos um link de recuperação de senha para ${resultado.email}.`
      );
    } catch (error) {
      console.error(
        "[MINHA ÁREA] Erro ao enviar recuperação de senha:",
        error
      );

      setErro(obterMensagemErro(error));
    } finally {
      setEnviandoSenha("");
    }
  }

  /* =======================================================
     ABRIR CONFIRMAÇÃO DE EXCLUSÃO
  ======================================================= */

  function abrirExclusao(admin) {
    setErro("");
    setSucesso("");
    setAdminParaExcluir(admin);
  }

  /* =======================================================
     FECHAR CONFIRMAÇÃO DE EXCLUSÃO
  ======================================================= */

  function fecharExclusao() {
    if (excluindo) return;

    setAdminParaExcluir(null);
    setErro("");
  }

  /* =======================================================
     EXCLUIR ADMINISTRADOR PELO WORKER
  ======================================================= */

  async function confirmarExclusao() {
    if (!adminParaExcluir || excluindo) return;

    setExcluindo(true);
    setErro("");
    setSucesso("");

    try {
      const resultado = await excluirUsuarioAdministrativo({
        uid: adminParaExcluir.id,
      });

      setAdminParaExcluir(null);
      setAdminVisualizado(null);
      setAdminEditando(null);

      setSucesso(
        resultado.condominioDesvinculado
          ? "Administrador excluído. O acesso administrativo do condomínio voltou ao estado pendente."
          : "Administrador excluído com sucesso."
      );

      await carregarAdministradores();
    } catch (error) {
      console.error(
        "[MINHA ÁREA] Erro ao excluir administrador:",
        error
      );

      setErro(obterMensagemErro(error));
    } finally {
      setExcluindo(false);
    }
  }

  /* =======================================================
     FECHAR MODAIS
  ======================================================= */

  function fecharModais() {
    if (salvando || excluindo) return;

    setAdminVisualizado(null);
    setAdminEditando(null);
    setAdminParaExcluir(null);
    setErro("");
  }

  /* =======================================================
     RENDERIZAÇÃO
  ======================================================= */

  return (
    <main className="space-y-6">

      {/* CABEÇALHO */}

      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#6F9272]/15 p-3">
              <ShieldCheck
                className="h-7 w-7 text-[#6F9272]"
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-white">
                Administradores
              </h1>

              <p className="mt-1 text-sm text-white/70">
                Gerencie os cadastros e os acessos administrativos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={carregarAdministradores}
            disabled={carregando}
            title="Atualizar lista"
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl border border-white/15
              bg-white/[0.06] text-white/75
              transition hover:bg-white/10 hover:text-white
              disabled:opacity-50
            "
          >
            <RefreshCw
              className={`h-4 w-4 ${
                carregando ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-[#6F9272]/25 bg-[#6F9272]/10 p-4">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9BC5A0]" />

          <p className="text-sm leading-6 text-white/75">
            O primeiro administrador é criado junto com o cadastro
            do condomínio. Na tela de Condomínios, informe o nome
            e o e-mail do responsável administrativo. Os acessos
            criados aparecerão automaticamente nesta listagem.
          </p>
        </div>
      </header>

      {/* MENSAGEM DE ERRO */}

      {erro && !adminEditando && !adminParaExcluir && (
        <div className="flex items-start gap-3 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* MENSAGEM DE SUCESSO */}

      {sucesso && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      {/* INDICADORES */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {indicadores.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.titulo}
              className="
                rounded-2xl
                border border-white/15
                bg-white/[0.08]
                p-5
                shadow-[0_12px_35px_rgba(0,0,0,0.06)]
                backdrop-blur-xl
              "
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/70">
                    {item.titulo}
                  </p>

                  <p className="mt-3 text-3xl font-semibold text-white">
                    {carregando ? "--" : item.valor}
                  </p>
                </div>

                <div className="rounded-xl bg-[#6F9272]/20 p-3">
                  <Icon
                    className="h-6 w-6 text-[#9BC5A0]"
                    strokeWidth={1.8}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* LISTAGEM */}

      <section
        className="
          overflow-hidden
          rounded-2xl
          border border-white/15
          bg-white/[0.08]
          shadow-[0_12px_35px_rgba(0,0,0,0.06)]
          backdrop-blur-xl
        "
      >
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Cadastro de administradores
            </h2>

            <p className="mt-1 text-sm text-white/65">
              Consulte os dados e acompanhe o status das contas.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />

              <input
                type="search"
                value={pesquisa}
                onChange={(event) =>
                  setPesquisa(event.target.value)
                }
                placeholder="Buscar administrador..."
                className="
                  w-full rounded-xl
                  border border-white/15
                  bg-white/[0.06]
                  py-2.5 pl-10 pr-4
                  text-sm text-white
                  outline-none
                  placeholder:text-white/45
                  focus:border-[#6F9272]
                  sm:w-64
                "
              />
            </div>

            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />

              <select
                value={filtroStatus}
                onChange={(event) =>
                  setFiltroStatus(event.target.value)
                }
                className="
                  w-full appearance-none rounded-xl
                  border border-white/15
                  bg-[#24342D]
                  py-2.5 pl-10 pr-8
                  text-sm text-white
                  outline-none
                  focus:border-[#6F9272]
                "
              >
                <option value="Todos">Todos os status</option>
                <option value="Ativo">Ativos</option>
                <option value="Inativo">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABELA */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-white/[0.04]">
              <tr className="text-xs uppercase tracking-wider text-white/60">
                <th className="px-5 py-4 font-medium">
                  Administrador
                </th>

                <th className="px-5 py-4 font-medium">
                  Telefone
                </th>

                <th className="px-5 py-4 font-medium">
                  Condomínio
                </th>

                <th className="px-5 py-4 font-medium">
                  Perfil
                </th>

                <th className="px-5 py-4 font-medium">
                  Status
                </th>

                <th className="px-5 py-4 text-right font-medium">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {!carregando &&
                filtrados.map((admin) => (
                  <tr
                    key={admin.id}
                    className="transition-colors hover:bg-white/[0.04]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6F9272]/20">
                          <Building2 className="h-5 w-5 text-[#9BC5A0]" />
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {admin.nome}
                          </p>

                          <p className="mt-1 text-sm text-white/60">
                            {admin.email || "Sem e-mail cadastrado"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-white/75">
                      {admin.telefone || "Não informado"}
                    </td>

                    <td className="px-5 py-4 text-sm text-white/75">
                      {admin.condominio}
                    </td>

                    <td className="px-5 py-4 text-sm text-white/75">
                      {admin.perfilLabel}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`
                          inline-flex rounded-full px-3 py-1
                          text-xs font-medium
                          ${
                            admin.ativo
                              ? "bg-emerald-400/15 text-emerald-300"
                              : "bg-red-400/15 text-red-300"
                          }
                        `}
                      >
                        {admin.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Visualizar administrador"
                          onClick={() =>
                            visualizarAdministrador(admin)
                          }
                          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Editar administrador"
                          onClick={() =>
                            editarAdministrador(admin)
                          }
                          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Enviar recuperação de senha"
                          disabled={enviandoSenha === admin.id}
                          onClick={() =>
                            redefinirSenha(admin)
                          }
                          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                          {enviandoSenha === admin.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          title="Excluir administrador"
                          onClick={() => abrirExclusao(admin)}
                          className="rounded-lg p-2 text-red-300/80 transition hover:bg-red-400/10 hover:text-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {carregando && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#9BC5A0]" />

                    <p className="mt-3 text-sm text-white/65">
                      Carregando administradores...
                    </p>
                  </td>
                </tr>
              )}

              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="mx-auto h-8 w-8 text-white/40" />

                    <p className="mt-3 font-medium text-white">
                      Nenhum administrador encontrado
                    </p>

                    <p className="mx-auto mt-1 max-w-md text-sm text-white/55">
                      Quando você cadastrar um condomínio e informar
                      o responsável administrativo, o acesso criado
                      aparecerá automaticamente aqui.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="border-t border-white/10 px-5 py-4">
          <p className="text-sm text-white/60">
            {carregando
              ? "Consultando cadastros..."
              : `${filtrados.length} de ${total} administrador(es) exibido(s)`}
          </p>
        </footer>
      </section>

      {/* =====================================================
          MODAL DE VISUALIZAÇÃO
      ===================================================== */}

      {adminVisualizado && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            overflow-y-auto
            bg-black/65 p-4 backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharModais();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-visualizacao-admin"
            className="
              my-auto w-full max-w-lg
              rounded-2xl border border-white/15
              bg-[#26382F] p-6 shadow-2xl
            "
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="titulo-visualizacao-admin"
                  className="text-xl font-semibold text-white"
                >
                  Administrador
                </h2>

                <p className="mt-1 text-sm text-white/60">
                  Informações da conta cadastrada.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModais}
                aria-label="Fechar"
                className="rounded-lg p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs text-white/55">Nome</p>
                <p className="mt-1 font-medium text-white">
                  {adminVisualizado.nome}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#9BC5A0]" />

                <div className="min-w-0">
                  <p className="text-xs text-white/55">E-mail</p>
                  <p className="mt-1 break-all text-white">
                    {adminVisualizado.email || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#9BC5A0]" />

                <div>
                  <p className="text-xs text-white/55">Telefone</p>
                  <p className="mt-1 text-white">
                    {adminVisualizado.telefone || "Não informado"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-white/55">Condomínio</p>
                <p className="mt-1 text-white">
                  {adminVisualizado.condominio}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/55">Perfil</p>
                <p className="mt-1 text-white">
                  {adminVisualizado.perfilLabel}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/55">Status</p>
                <p
                  className={`mt-1 font-medium ${
                    adminVisualizado.ativo
                      ? "text-emerald-300"
                      : "text-red-300"
                  }`}
                >
                  {adminVisualizado.ativo ? "Ativo" : "Inativo"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fecharModais}
              className="
                mt-7 w-full rounded-xl
                border border-white/15 bg-white/10
                px-4 py-3 text-sm font-semibold text-white
                transition hover:bg-white/15
              "
            >
              Fechar
            </button>
          </section>
        </div>
      )}

      {/* =====================================================
          MODAL DE EDIÇÃO
      ===================================================== */}

      {adminEditando && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            overflow-y-auto
            bg-black/65 p-4 backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharModais();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-edicao-admin"
            className="
              my-auto w-full max-w-lg
              rounded-2xl border border-white/15
              bg-[#26382F] p-6 shadow-2xl
            "
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="titulo-edicao-admin"
                  className="text-xl font-semibold text-white"
                >
                  Editar administrador
                </h2>

                <p className="mt-1 text-sm text-white/60">
                  Altere os dados cadastrais desta conta.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModais}
                disabled={salvando}
                aria-label="Fechar"
                className="rounded-lg p-2 text-white/65 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={salvarAlteracoes}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Nome completo
                </label>

                <input
                  type="text"
                  value={formulario.nome}
                  onChange={(event) =>
                    alterarCampo("nome", event.target.value)
                  }
                  required
                  disabled={salvando}
                  className="
                    w-full rounded-xl
                    border border-white/15
                    bg-white/[0.08]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-white/40
                    focus:border-[#6F9272]
                  "
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  E-mail de acesso
                </label>

                <input
                  type="email"
                  value={formulario.email}
                  onChange={(event) =>
                    alterarCampo("email", event.target.value)
                  }
                  required
                  disabled={salvando}
                  className="
                    w-full rounded-xl
                    border border-white/15
                    bg-white/[0.08]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-white/40
                    focus:border-[#6F9272]
                  "
                />

                <p className="mt-1 text-xs text-white/50">
                  O novo e-mail será atualizado também na conta
                  de autenticação do Firebase.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Telefone
                </label>

                <input
                  type="tel"
                  value={formulario.telefone}
                  onChange={(event) =>
                    alterarCampo("telefone", event.target.value)
                  }
                  disabled={salvando}
                  placeholder="(00) 00000-0000"
                  className="
                    w-full rounded-xl
                    border border-white/15
                    bg-white/[0.08]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    placeholder:text-white/40
                    focus:border-[#6F9272]
                  "
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Condomínio
                </label>

                <input
                  type="text"
                  value={adminEditando.condominio || ""}
                  readOnly
                  className="
                    w-full rounded-xl
                    border border-white/10
                    bg-white/[0.04]
                    px-4 py-3
                    text-sm text-white/55
                    outline-none
                    cursor-not-allowed
                  "
                />
              </div>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/[0.06] p-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Conta ativa
                  </p>

                  <p className="mt-1 text-xs text-white/55">
                    Permite ou bloqueia o acesso deste administrador.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={formulario.ativo}
                  onChange={(event) =>
                    alterarCampo("ativo", event.target.checked)
                  }
                  disabled={salvando}
                  className="h-5 w-5 accent-[#6F9272]"
                />
              </label>

              {erro && (
                <div className="flex items-start gap-2 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharModais}
                  disabled={salvando}
                  className="
                    rounded-xl border border-white/15
                    bg-white/10 px-5 py-3
                    text-sm font-semibold text-white
                    transition hover:bg-white/15
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-xl bg-[#6F9272]
                    px-5 py-3
                    text-sm font-semibold text-white
                    transition hover:bg-[#5C7D60]
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                >
                  {salvando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar alterações"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* =====================================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
      ===================================================== */}

      {adminParaExcluir && (
        <div
          className="
            fixed inset-0 z-[110]
            flex items-center justify-center
            overflow-y-auto
            bg-black/70 p-4 backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharExclusao();
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-exclusao-admin"
            className="
              my-auto w-full max-w-md
              rounded-2xl border border-white/15
              bg-[#26382F] p-6 shadow-2xl
            "
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-400/10">
                <Trash2 className="h-6 w-6 text-red-300" />
              </div>

              <div>
                <h2
                  id="titulo-exclusao-admin"
                  className="text-xl font-semibold text-white"
                >
                  Excluir administrador?
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/70">
                  Você está prestes a excluir o acesso de:
                </p>

                <p className="mt-2 break-words font-semibold text-white">
                  {adminParaExcluir.nome}
                </p>

                <p className="mt-1 break-all text-sm text-white/65">
                  {adminParaExcluir.email}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-red-300/15 bg-red-400/[0.06] p-4">
              <p className="text-sm leading-6 text-white/80">
                A conta será removida do Firebase Authentication
                e o perfil correspondente será excluído do Firestore.
                Os dados do condomínio serão preservados.
              </p>

              <p className="mt-2 text-sm font-medium text-white">
                Esta operação não poderá ser desfeita automaticamente.
              </p>
            </div>

            {erro && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharExclusao}
                disabled={excluindo}
                className="
                  rounded-xl border border-white/15
                  bg-white/10 px-5 py-3
                  text-sm font-semibold text-white
                  transition hover:bg-white/15
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
                  inline-flex items-center justify-center gap-2
                  rounded-xl bg-red-500/80
                  px-5 py-3
                  text-sm font-semibold text-white
                  transition hover:bg-red-500
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {excluindo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Confirmar exclusão
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}