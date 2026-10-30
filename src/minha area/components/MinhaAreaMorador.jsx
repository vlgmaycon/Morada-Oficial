
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  limit,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { sendPasswordResetEmail } from "firebase/auth";

import {
  Search,
  Users,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  KeyRound,
  Building2,
  SlidersHorizontal,
  Home,
  Loader2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { auth, db } from "@/auth/firebase";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function somenteNumeros(valor = "") {
  return String(valor).replace(/\D/g, "");
}

function formatarCPF(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 3) return numeros;

  if (numeros.length <= 6) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  }

  if (numeros.length <= 9) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

function formatarTelefone(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (!numeros) return "";

  if (numeros.length <= 2) {
    return `(${numeros}`;
  }

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function obterNome(usuario) {
  return usuario?.nome || usuario?.name || "Morador sem nome";
}

function normalizarPerfil(usuario) {
  return String(
    usuario?.perfil || usuario?.role || ""
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function usuarioEhMorador(usuario) {
  const perfil = normalizarPerfil(usuario);

  return (
    perfil === "morador" ||
    perfil === "residente"
  );
}

function usuarioEstaAtivo(usuario) {
  const status = String(usuario?.status || "")
    .trim()
    .toLowerCase();

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
      "O Firebase não autorizou a consulta ou alteração. " +
      "Precisamos verificar as regras de segurança do Firestore."
    );
  }

  if (error?.code === "auth/invalid-email") {
    return "O e-mail cadastrado para este morador é inválido.";
  }

  if (error?.code === "auth/network-request-failed") {
    return "Não foi possível conectar ao Firebase. Verifique sua internet.";
  }

  return (
    error?.message ||
    "Não foi possível concluir a operação."
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function MinhaAreaMorador() {
  const [moradores, setMoradores] = useState([]);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoSenha, setEnviandoSenha] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [moradorVisualizado, setMoradorVisualizado] = useState(null);
  const [moradorEditando, setMoradorEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    bloco: "",
    apartamento: "",
    tipoUnidade: "",
    ativo: true,
  });

  /* =======================================================
     CARREGAR MORADORES DO FIREBASE
  ======================================================= */

  const carregarMoradores = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const usuariosRef = collection(db, "usuarios");

      /*
       * Consultamos os formatos de perfil utilizados
       * pelo sistema e por cadastros anteriores.
       * Depois unimos os resultados sem duplicar usuários.
       */

      const consultas = await Promise.all([
        getDocs(
          query(
            usuariosRef,
            where("role", "==", "morador")
          )
        ),

        getDocs(
          query(
            usuariosRef,
            where("role", "==", "Morador")
          )
        ),

        getDocs(
          query(
            usuariosRef,
            where("perfil", "==", "morador")
          )
        ),

        getDocs(
          query(
            usuariosRef,
            where("perfil", "==", "Morador")
          )
        ),

        getDocs(
          query(
            usuariosRef,
            where("role", "==", "residente")
          )
        ),

        getDocs(
          query(
            usuariosRef,
            where("perfil", "==", "residente")
          )
        ),
      ]);

      const documentosUnicos = new Map();

      consultas.forEach((resultado) => {
        resultado.docs.forEach((documento) => {
          documentosUnicos.set(
            documento.id,
            documento
          );
        });
      });

      const lista = Array.from(
        documentosUnicos.values()
      )
        .map((documento) => {
          const dados = documento.data();

          return {
            id: documento.id,
            ...dados,

            nome: obterNome(dados),

            cpf: formatarCPF(dados.cpf || ""),

            email: dados.email || "",

            telefone:
              dados.telefone ||
              dados.phone ||
              "",

            condominio:
              dados.condominio_nome ||
              dados.condominioNome ||
              "Condomínio não identificado",

            bloco: dados.bloco || "",

            apartamento:
              dados.apartamento ||
              dados.unidade?.apartamento ||
              dados.unidade?.numero ||
              "",

            tipoUnidade:
              dados.tipoUnidade ||
              dados.tipo_unidade ||
              "",

            ativo: usuarioEstaAtivo(dados),
          };
        })
        .filter((morador) => usuarioEhMorador(morador));

      lista.sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
      );

      setMoradores(lista);
    } catch (error) {
      console.error(
        "[MINHA ÁREA] Erro ao carregar moradores:",
        error
      );

      setErro(obterMensagemErro(error));
      setMoradores([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarMoradores();
  }, [carregarMoradores]);

  /* =======================================================
     PESQUISA E FILTROS
  ======================================================= */

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return moradores.filter((morador) => {
      const correspondePesquisa = [
        morador.nome,
        morador.cpf,
        morador.email,
        morador.telefone,
        morador.condominio,
        morador.bloco,
        morador.apartamento,
        morador.tipoUnidade,
      ].some((valor) =>
        String(valor || "")
          .toLowerCase()
          .includes(termo)
      );

      const status = morador.ativo
        ? "Ativo"
        : "Inativo";

      const correspondeStatus =
        filtroStatus === "Todos" ||
        status === filtroStatus;

      return (
        correspondePesquisa &&
        correspondeStatus
      );
    });
  }, [
    moradores,
    pesquisa,
    filtroStatus,
  ]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const total = moradores.length;

  const ativos = moradores.filter(
    (morador) => morador.ativo
  ).length;

  const inativos = total - ativos;

  const indicadores = [
    {
      titulo: "Total de moradores",
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
     VISUALIZAR MORADOR
  ======================================================= */

  function visualizarMorador(morador) {
    setMoradorVisualizado(morador);
  }

  /* =======================================================
     EDITAR MORADOR
  ======================================================= */

  function editarMorador(morador) {
    setErro("");
    setSucesso("");

    setFormulario({
      nome: morador.nome || "",
      cpf: morador.cpf || "",
      telefone: formatarTelefone(morador.telefone || ""),
      bloco: morador.bloco || "",
      apartamento: morador.apartamento || "",
      tipoUnidade: morador.tipoUnidade || "",
      ativo: morador.ativo,
    });

    setMoradorEditando(morador);
  }

  /* =======================================================
     ALTERAR CAMPO
  ======================================================= */

  function alterarCampo(campo, valor) {
    let valorFinal = valor;

    if (campo === "cpf") {
      valorFinal = formatarCPF(valor);
    }

    if (campo === "telefone") {
      valorFinal = formatarTelefone(valor);
    }

    setFormulario((atual) => ({
      ...atual,
      [campo]: valorFinal,
    }));
  }

  /* =======================================================
     VERIFICAR CPF DUPLICADO
  ======================================================= */

  async function verificarCPFExistente(
    cpfNumerico,
    cpfFormatado,
    idAtual
  ) {
    const usuariosRef = collection(db, "usuarios");

    const consultas = await Promise.all([
      getDocs(
        query(
          usuariosRef,
          where("cpf_normalizado", "==", cpfNumerico),
          limit(5)
        )
      ),

      getDocs(
        query(
          usuariosRef,
          where("cpf", "==", cpfFormatado),
          limit(5)
        )
      ),

      getDocs(
        query(
          usuariosRef,
          where("cpf", "==", cpfNumerico),
          limit(5)
        )
      ),
    ]);

    for (const resultado of consultas) {
      const duplicado = resultado.docs.some(
        (documento) => documento.id !== idAtual
      );

      if (duplicado) {
        return true;
      }
    }

    return false;
  }

  /* =======================================================
     SALVAR ALTERAÇÕES
  ======================================================= */

  async function salvarAlteracoes(evento) {
    evento.preventDefault();

    if (!moradorEditando || salvando) return;

    const nome = String(
      formulario.nome || ""
    ).trim();

    const cpfNumerico = somenteNumeros(
      formulario.cpf
    );

    const cpfFormatado = formatarCPF(
      cpfNumerico
    );

    const telefone = formatarTelefone(
      formulario.telefone
    );

    const bloco = String(
      formulario.bloco || ""
    ).trim();

    const apartamento = String(
      formulario.apartamento || ""
    ).trim();

    if (!nome) {
      setErro("Informe o nome do morador.");
      return;
    }

    if (cpfNumerico.length !== 11) {
      setErro("Informe um CPF válido com 11 números.");
      return;
    }

    if (!moradorEditando.id) {
      setErro("Não foi possível identificar este morador.");
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      const cpfAtual = somenteNumeros(
        moradorEditando.cpf
      );

      /*
       * Quando o CPF for alterado, verificamos
       * se ele já pertence a outro cadastro.
       */

      if (cpfNumerico !== cpfAtual) {
        const cpfDuplicado =
          await verificarCPFExistente(
            cpfNumerico,
            cpfFormatado,
            moradorEditando.id
          );

        if (cpfDuplicado) {
          throw new Error(
            "Este CPF já está vinculado a outro cadastro."
          );
        }
      }

      const usuarioRef = doc(
        db,
        "usuarios",
        moradorEditando.id
      );

      const ativo = formulario.ativo === true;

      await updateDoc(usuarioRef, {
        nome,
        name: nome,

        cpf: cpfFormatado,
        cpf_normalizado: cpfNumerico,

        telefone,
        phone: telefone,

        bloco,
        apartamento,
        tipoUnidade: formulario.tipoUnidade,

        ativo,
        active: ativo,
        status: ativo ? "Ativo" : "Inativo",

        updatedAt: serverTimestamp(),
      });

      setMoradores((atuais) =>
        atuais.map((morador) =>
          morador.id === moradorEditando.id
            ? {
                ...morador,
                nome,
                cpf: cpfFormatado,
                telefone,
                bloco,
                apartamento,
                tipoUnidade: formulario.tipoUnidade,
                ativo,
              }
            : morador
        )
      );

      setMoradorEditando(null);

      setSucesso(
        "Dados do morador atualizados com sucesso."
      );
    } catch (error) {
      console.error(
        "[MINHA ÁREA] Erro ao salvar morador:",
        error
      );

      setErro(obterMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     RECUPERAÇÃO DE SENHA
  ======================================================= */

  async function redefinirSenha(morador) {
    const email = String(
      morador.email || ""
    ).trim();

    if (!email) {
      setErro(
        "Este morador não possui um e-mail cadastrado."
      );
      return;
    }

    setEnviandoSenha(morador.id);
    setErro("");
    setSucesso("");

    try {
      await sendPasswordResetEmail(
        auth,
        email
      );

      setSucesso(
        `Enviamos um link de recuperação de senha para ${email}.`
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
     FECHAR MODAIS
  ======================================================= */

  function fecharModais() {
    if (salvando) return;

    setMoradorVisualizado(null);
    setMoradorEditando(null);
    setErro("");
  }

  /* =======================================================
     UNIDADE PARA EXIBIÇÃO
  ======================================================= */

  function obterUnidade(morador) {
    const partes = [];

    if (morador.bloco) {
      partes.push(`Bloco ${morador.bloco}`);
    }

    if (morador.apartamento) {
      partes.push(`Unidade ${morador.apartamento}`);
    }

    return partes.length > 0
      ? partes.join(", ")
      : "Não informada";
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
              <Users
                className="h-7 w-7 text-[#6F9272]"
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-white">
                Moradores
              </h1>

              <p className="mt-1 text-sm text-white/70">
                Gerencie os cadastros e acessos dos moradores.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={carregarMoradores}
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
          <Home className="mt-0.5 h-5 w-5 shrink-0 text-[#9BC5A0]" />

          <p className="text-sm leading-6 text-white/75">
            Os moradores cadastrados na plataforma aparecerão
            automaticamente nesta listagem, vinculados aos seus
            respectivos condomínios e unidades. Você poderá
            consultar e corrigir os dados quando necessário.
          </p>
        </div>
      </header>

      {/* MENSAGENS */}

      {erro && !moradorEditando && (
        <div className="flex items-start gap-3 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

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
              Cadastro de moradores
            </h2>

            <p className="mt-1 text-sm text-white/65">
              Localize moradores e consulte suas unidades.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
              />

              <input
                type="search"
                value={pesquisa}
                onChange={(event) =>
                  setPesquisa(event.target.value)
                }
                placeholder="Buscar morador..."
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
              <SlidersHorizontal
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
              />

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
          <table className="w-full min-w-[1100px] text-left">
            <thead className="bg-white/[0.04]">
              <tr className="text-xs uppercase tracking-wider text-white/60">
                <th className="px-5 py-4 font-medium">Morador</th>
                <th className="px-5 py-4 font-medium">Telefone</th>
                <th className="px-5 py-4 font-medium">Condomínio</th>
                <th className="px-5 py-4 font-medium">Unidade</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">

              {!carregando &&
                filtrados.map((morador) => (
                  <tr
                    key={morador.id}
                    className="transition-colors hover:bg-white/[0.04]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6F9272]/20">
                          <Users className="h-5 w-5 text-[#9BC5A0]" />
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {morador.nome}
                          </p>

                          <p className="mt-1 text-sm text-white/60">
                            CPF: {morador.cpf || "Não informado"}
                          </p>

                          <p className="mt-1 text-sm text-white/60">
                            {morador.email || "Sem e-mail cadastrado"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-white/75">
                      {morador.telefone || "Não informado"}
                    </td>

                    <td className="px-5 py-4 text-sm text-white/75">
                      {morador.condominio}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-white/75">
                        <Home className="h-4 w-4 text-white/50" />

                        <span>
                          {obterUnidade(morador)}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`
                          inline-flex rounded-full px-3 py-1
                          text-xs font-medium
                          ${
                            morador.ativo
                              ? "bg-emerald-400/15 text-emerald-300"
                              : "bg-red-400/15 text-red-300"
                          }
                        `}
                      >
                        {morador.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Visualizar morador"
                          onClick={() =>
                            visualizarMorador(morador)
                          }
                          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Editar morador"
                          onClick={() =>
                            editarMorador(morador)
                          }
                          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Enviar recuperação de senha"
                          disabled={enviandoSenha === morador.id}
                          onClick={() =>
                            redefinirSenha(morador)
                          }
                          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                          {enviandoSenha === morador.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
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
                      Carregando moradores...
                    </p>
                  </td>
                </tr>
              )}

              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center"
                  >
                    <Users className="mx-auto h-8 w-8 text-white/40" />

                    <p className="mt-3 font-medium text-white">
                      Nenhum morador encontrado
                    </p>

                    <p className="mx-auto mt-1 max-w-md text-sm text-white/55">
                      Quando os moradores forem cadastrados na
                      plataforma e vinculados aos condomínios,
                      aparecerão automaticamente nesta listagem.
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
              : `${filtrados.length} de ${total} morador(es) exibido(s)`}
          </p>
        </footer>
      </section>

      {/* =====================================================
          MODAL DE VISUALIZAÇÃO
      ===================================================== */}

      {moradorVisualizado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm">
          <section className="my-auto w-full max-w-lg rounded-2xl border border-white/15 bg-[#26382F] p-6 shadow-2xl">

            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Dados do morador
                </h2>

                <p className="mt-1 text-sm text-white/60">
                  Informações da conta cadastrada.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModais}
                className="rounded-lg p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">

              <div>
                <p className="text-xs text-white/55">
                  Nome completo
                </p>

                <p className="mt-1 font-medium text-white">
                  {moradorVisualizado.nome}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/55">CPF</p>

                <p className="mt-1 text-white">
                  {moradorVisualizado.cpf || "Não informado"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/55">E-mail</p>

                <p className="mt-1 break-all text-white">
                  {moradorVisualizado.email || "Não informado"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/55">Telefone</p>

                <p className="mt-1 text-white">
                  {moradorVisualizado.telefone || "Não informado"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/55">
                  Condomínio
                </p>

                <p className="mt-1 text-white">
                  {moradorVisualizado.condominio}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/55">
                  Unidade
                </p>

                <p className="mt-1 text-white">
                  {obterUnidade(moradorVisualizado)}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/55">
                  Tipo de unidade
                </p>

                <p className="mt-1 text-white">
                  {moradorVisualizado.tipoUnidade || "Não informado"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/55">Status</p>

                <p
                  className={`mt-1 font-medium ${
                    moradorVisualizado.ativo
                      ? "text-emerald-300"
                      : "text-red-300"
                  }`}
                >
                  {moradorVisualizado.ativo ? "Ativo" : "Inativo"}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={fecharModais}
              className="mt-7 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Fechar
            </button>

          </section>
        </div>
      )}

      {/* =====================================================
          MODAL DE EDIÇÃO
      ===================================================== */}

      {moradorEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm">
          <section className="my-auto w-full max-w-lg rounded-2xl border border-white/15 bg-[#26382F] p-6 shadow-2xl">

            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Editar morador
                </h2>

                <p className="mt-1 text-sm text-white/60">
                  Atualize os dados cadastrais e da unidade.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModais}
                disabled={salvando}
                className="rounded-lg p-2 text-white/65 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={salvarAlteracoes}
              className="mt-6 space-y-4"
            >

              {/* NOME */}

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
                    focus:border-[#6F9272]
                  "
                />
              </div>

              {/* CPF */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  CPF
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={formulario.cpf}
                  onChange={(event) =>
                    alterarCampo("cpf", event.target.value)
                  }
                  required
                  disabled={salvando}
                  maxLength={14}
                  placeholder="000.000.000-00"
                  className="
                    w-full rounded-xl
                    border border-white/15
                    bg-white/[0.08]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    focus:border-[#6F9272]
                  "
                />

                <p className="mt-1 text-xs text-white/50">
                  O CPF também é usado para localizar o cadastro no login.
                </p>
              </div>

              {/* E-MAIL */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  E-mail de acesso
                </label>

                <input
                  type="email"
                  value={moradorEditando.email || ""}
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

                <p className="mt-1 text-xs text-white/50">
                  A troca do e-mail precisa ser feita pelo serviço
                  seguro de autenticação.
                </p>
              </div>

              {/* TELEFONE */}

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
                    focus:border-[#6F9272]
                  "
                />
              </div>

              {/* BLOCO */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Bloco
                </label>

                <input
                  type="text"
                  value={formulario.bloco}
                  onChange={(event) =>
                    alterarCampo("bloco", event.target.value)
                  }
                  disabled={salvando}
                  placeholder="Ex.: A"
                  className="
                    w-full rounded-xl
                    border border-white/15
                    bg-white/[0.08]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    focus:border-[#6F9272]
                  "
                />
              </div>

              {/* APARTAMENTO */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Apartamento / unidade
                </label>

                <input
                  type="text"
                  value={formulario.apartamento}
                  onChange={(event) =>
                    alterarCampo("apartamento", event.target.value)
                  }
                  disabled={salvando}
                  placeholder="Ex.: 205"
                  className="
                    w-full rounded-xl
                    border border-white/15
                    bg-white/[0.08]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    focus:border-[#6F9272]
                  "
                />
              </div>

              {/* TIPO DE UNIDADE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Tipo de unidade
                </label>

                <select
                  value={formulario.tipoUnidade}
                  onChange={(event) =>
                    alterarCampo("tipoUnidade", event.target.value)
                  }
                  disabled={salvando}
                  className="
                    w-full rounded-xl
                    border border-white/15
                    bg-[#24342D]
                    px-4 py-3
                    text-sm text-white
                    outline-none
                    focus:border-[#6F9272]
                  "
                >
                  <option value="">Não informado</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Cobertura">Cobertura</option>
                  <option value="Sala">Sala</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* CONDOMÍNIO */}

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Condomínio
                </label>

                <input
                  type="text"
                  value={moradorEditando.condominio || ""}
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

              {/* STATUS */}

              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/[0.06] p-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Conta ativa
                  </p>

                  <p className="mt-1 text-xs text-white/55">
                    Permite ou bloqueia o acesso deste morador.
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

              {/* ERRO */}

              {erro && (
                <div className="flex items-start gap-2 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              {/* BOTÕES */}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharModais}
                  disabled={salvando}
                  className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
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

    </main>
  );
}
