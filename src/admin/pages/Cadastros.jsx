import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserRound,
  UserCheck,
  UserX,
  Clock3,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Hash,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  Filter,
  Home,
} from "lucide-react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/auth/firebase";
import useAuth from "@/auth/AuthContext";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterValor(...valores) {
  return valores.find(
    (valor) => valor !== undefined && valor !== null && String(valor).trim() !== ""
  ) ?? "";
}

function usuarioEhMorador(dados) {
  const perfis = [
    dados?.role,
    dados?.perfil,
    dados?.tipo_usuario,
    dados?.tipoUsuario,
  ];

  return perfis.some((perfil) =>
    ["morador", "residente", "resident"].includes(normalizarTexto(perfil))
  );
}

function obterStatusMorador(dados) {
  const statusOriginal = obterValor(
    dados?.status,
    dados?.situacao,
    dados?.status_cadastro,
    dados?.statusCadastro,
    dados?.status_aprovacao,
    dados?.statusAprovacao
  );

  const status = normalizarTexto(statusOriginal);

  // Pendente tem prioridade sobre o campo ativo,
  // pois um cadastro pendente pode estar com ativo = false.
  if (
    status.includes("pendente") ||
    status.includes("pending") ||
    status.includes("aguardando")
  ) {
    return "Pendente";
  }

  // Situações explicitamente inativas.
  if (
    status.includes("inativo") ||
    status.includes("inactive") ||
    status.includes("bloqueado") ||
    status.includes("blocked") ||
    status.includes("desativado")
  ) {
    return "Inativo";
  }

  if (
    dados?.ativo === false ||
    dados?.active === false ||
    dados?.ativo === "false" ||
    dados?.active === "false" ||
    dados?.ativo === 0 ||
    dados?.active === 0 ||
    dados?.bloqueado === true
  ) {
    return "Inativo";
  }

  return "Ativo";
}

function formatarUnidade(bloco, apartamento) {
  const partes = [];

  if (bloco) partes.push(`Bloco ${bloco}`);
  if (apartamento) partes.push(`Apto ${apartamento}`);

  return partes.length > 0 ? partes.join(" • ") : "Não informado";
}

/* =========================================================
   COMPONENTE DE STATUS
========================================================= */

function StatusPill({ status }) {
  const configuracoes = {
    Ativo: {
      icone: CheckCircle2,
      classe: "bg-emerald-400/10 text-emerald-300 border-emerald-300/20",
    },
    Inativo: {
      icone: XCircle,
      classe: "bg-rose-400/10 text-rose-300 border-rose-300/20",
    },
    Pendente: {
      icone: Clock3,
      classe: "bg-amber-400/10 text-amber-200 border-amber-300/20",
    },
  };

  const config = configuracoes[status] || configuracoes.Ativo;
  const Icone = config.icone;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${config.classe}`}
    >
      <Icone size={13} />
      {status}
    </span>
  );
}

/* =========================================================
   CARD DE RESUMO
========================================================= */

function CardResumo({
  titulo,
  quantidade,
  descricao,
  icone: Icone,
  selecionado,
  onClick,
  corIcone = "text-white",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border p-4 text-left backdrop-blur-2xl transition duration-200 sm:p-5 ${
        selecionado
          ? "border-[#8DBA91]/50 bg-[#6F9272]/20 shadow-[0_0_25px_rgba(111,146,114,0.10)]"
          : "border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.10]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/65">{titulo}</p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {quantidade}
          </p>

          <p className="mt-1 text-xs text-white/45">{descricao}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.07] p-3">
          <Icone size={21} className={corIcone} />
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   PÁGINA CADASTROS
========================================================= */

export default function Cadastros() {
  const {
    user,
    condominioId,
    condominioNome,
    carregando: carregandoAuth,
  } = useAuth();

  const [moradores, setMoradores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const idCondominio = String(
    condominioId ||
      user?.condominio_id ||
      user?.condominioId ||
      ""
  ).trim();

  /* =======================================================
     BUSCAR MORADORES DO CONDOMÍNIO DO ADMINISTRADOR
  ======================================================= */

  const carregarMoradores = useCallback(async () => {
    if (carregandoAuth) return;

    if (!idCondominio) {
      setMoradores([]);
      setErro(
        "Não foi possível identificar o condomínio vinculado a este usuário."
      );
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const usuariosRef = collection(db, "usuarios");

      /*
       * O sistema utiliza condominio_id como campo principal.
       * A segunda consulta também considera condominioId
       * para localizar registros antigos que utilizem esse formato.
       *
       * As consultas são limitadas ao condomínio do administrador.
       */

      const resultados = await Promise.allSettled([
        getDocs(
          query(
            usuariosRef,
            where("condominio_id", "==", idCondominio)
          )
        ),

        getDocs(
          query(
            usuariosRef,
            where("condominioId", "==", idCondominio)
          )
        ),
      ]);

      const consultasConcluidas = resultados.filter(
        (resultado) => resultado.status === "fulfilled"
      );

      if (consultasConcluidas.length === 0) {
        const falha = resultados.find(
          (resultado) => resultado.status === "rejected"
        );

        throw falha?.reason || new Error("Falha ao consultar moradores.");
      }

      // Evita duplicidade caso o mesmo documento apareça nas duas consultas.
      const documentosUnicos = new Map();

      consultasConcluidas.forEach((resultado) => {
        resultado.value.forEach((documento) => {
          documentosUnicos.set(documento.id, documento);
        });
      });

      const listaMoradores = [];

      documentosUnicos.forEach((documento) => {
        const dados = documento.data() || {};

        // A página exibe somente moradores e residentes.
        if (!usuarioEhMorador(dados)) return;

        const nome = obterValor(
          dados.nome,
          dados.name,
          dados.displayName,
          "Morador sem nome"
        );

        const email = obterValor(
          dados.email,
          dados.e_mail
        );

        const telefone = obterValor(
          dados.telefone,
          dados.phone,
          dados.celular
        );

        const cpf = obterValor(
          dados.cpf,
          dados.CPF
        );

        const bloco = obterValor(
          dados.bloco,
          dados.unidade?.bloco
        );

        const apartamento = obterValor(
          dados.apartamento,
          dados.unidade?.apartamento,
          dados.unidade?.numero,
          dados.unidade_numero,
          dados.numero_unidade
        );

        const status = obterStatusMorador(dados);

        listaMoradores.push({
          id: documento.id,
          nome,
          email,
          telefone,
          cpf,
          bloco: String(bloco),
          apartamento: String(apartamento),
          unidade: formatarUnidade(bloco, apartamento),
          status,
        });
      });

      listaMoradores.sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", {
          sensitivity: "base",
        })
      );

      setMoradores(listaMoradores);
    } catch (error) {
      console.error("Erro ao carregar moradores:", error);

      if (error?.code === "permission-denied") {
        setErro(
          "O Firebase não autorizou a consulta dos moradores deste condomínio. Será necessário verificar as regras de acesso do Firestore."
        );
      } else {
        setErro(
          "Não foi possível carregar os moradores. Verifique sua conexão e tente novamente."
        );
      }
    } finally {
      setCarregando(false);
    }
  }, [carregandoAuth, idCondominio]);

  useEffect(() => {
    carregarMoradores();
  }, [carregarMoradores]);

  /* =======================================================
     CONTADORES
  ======================================================= */

  const totalMoradores = moradores.length;

  const totalAtivos = moradores.filter(
    (morador) => morador.status === "Ativo"
  ).length;

  const totalInativos = moradores.filter(
    (morador) => morador.status === "Inativo"
  ).length;

  const totalPendentes = moradores.filter(
    (morador) => morador.status === "Pendente"
  ).length;

  /* =======================================================
     PESQUISA E FILTROS
  ======================================================= */

  const moradoresFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    return moradores.filter((morador) => {
      const correspondeStatus =
        filtroStatus === "Todos" ||
        morador.status === filtroStatus;

      const camposPesquisa = [
        morador.nome,
        morador.email,
        morador.telefone,
        morador.cpf,
        morador.bloco,
        morador.apartamento,
        morador.unidade,
      ];

      const correspondePesquisa =
        !termo ||
        camposPesquisa.some((campo) =>
          normalizarTexto(campo).includes(termo)
        );

      return correspondeStatus && correspondePesquisa;
    });
  }, [moradores, pesquisa, filtroStatus]);

  /* =======================================================
     ESTADO DE CARREGAMENTO
  ======================================================= */

  if (carregandoAuth || carregando) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl">
            <LoaderCircle
              size={27}
              className="animate-spin text-[#A4C5A5]"
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-white">
              Carregando moradores
            </p>
            <p className="mt-1 text-xs text-white/50">
              Consultando os cadastros do condomínio...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     TELA PRINCIPAL
  ======================================================= */

  return (
    <div className="w-full space-y-6 pb-8">

      {/* CABEÇALHO */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#8DBA91]/25 bg-[#6F9272]/15">
            <Users size={23} className="text-[#A9CCA9]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Cadastros
              </h1>

              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Consulta
              </span>
            </div>

            <p className="mt-1 text-sm text-white/55">
              Consulte os moradores cadastrados no seu condomínio.
            </p>

            {condominioNome && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[#A9CCA9]">
                <Building2 size={13} />
                <span>{condominioNome}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={carregarMoradores}
          disabled={carregando}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-medium text-white/80 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
        >
          <RefreshCw size={15} />
          Atualizar
        </button>
      </div>

      {/* ERRO DE CARREGAMENTO */}

      {erro && (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-rose-300"
            />

            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-200">
                Não foi possível carregar os cadastros
              </p>

              <p className="mt-1 text-sm leading-relaxed text-white/65">
                {erro}
              </p>

              <button
                type="button"
                onClick={carregarMoradores}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-300/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/20"
              >
                <RefreshCw size={13} />
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {!erro && (
        <>
          {/* CARDS DE RESUMO */}

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <CardResumo
              titulo="Total de moradores"
              quantidade={totalMoradores}
              descricao="Cadastros encontrados"
              icone={Users}
              selecionado={filtroStatus === "Todos"}
              onClick={() => setFiltroStatus("Todos")}
            />

            <CardResumo
              titulo="Ativos"
              quantidade={totalAtivos}
              descricao="Cadastros ativos"
              icone={UserCheck}
              corIcone="text-emerald-300"
              selecionado={filtroStatus === "Ativo"}
              onClick={() => setFiltroStatus("Ativo")}
            />

            <CardResumo
              titulo="Inativos"
              quantidade={totalInativos}
              descricao="Cadastros inativos"
              icone={UserX}
              corIcone="text-rose-300"
              selecionado={filtroStatus === "Inativo"}
              onClick={() => setFiltroStatus("Inativo")}
            />

            <CardResumo
              titulo="Pendentes"
              quantidade={totalPendentes}
              descricao="Aguardando regularização"
              icone={Clock3}
              corIcone="text-amber-200"
              selecionado={filtroStatus === "Pendente"}
              onClick={() => setFiltroStatus("Pendente")}
            />
          </div>

          {/* ÁREA DE LISTAGEM */}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#102019]/35 shadow-[0_15px_45px_rgba(0,0,0,0.10)] backdrop-blur-2xl">

            {/* TOPO DA LISTAGEM */}

            <div className="border-b border-white/10 p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Moradores cadastrados
                  </h2>

                  <p className="mt-1 text-xs text-white/45">
                    Consulte os dados e a situação dos moradores.
                  </p>
                </div>

                <div className="relative w-full lg:max-w-sm">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                  />

                  <input
                    type="text"
                    value={pesquisa}
                    onChange={(event) =>
                      setPesquisa(event.target.value)
                    }
                    placeholder="Buscar por nome, CPF, unidade..."
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#8DBA91]/50 focus:bg-white/[0.09]"
                  />
                </div>
              </div>

              {/* FILTROS */}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <div className="mr-1 inline-flex items-center gap-1.5 text-xs text-white/45">
                  <Filter size={13} />
                  Situação:
                </div>

                {["Todos", "Ativo", "Inativo", "Pendente"].map(
                  (status) => {
                    const selecionado = filtroStatus === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFiltroStatus(status)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                          selecionado
                            ? "border-[#8DBA91]/40 bg-[#6F9272]/25 text-[#C4E1C4]"
                            : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/80"
                        }`}
                      >
                        {status}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* RESULTADO NO COMPUTADOR */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.025]">
                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Morador
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Unidade
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Contato
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      CPF
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Situação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {moradoresFiltrados.map((morador) => (
                    <tr
                      key={morador.id}
                      className="border-b border-white/[0.06] transition last:border-0 hover:bg-white/[0.035]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07]">
                            <UserRound
                              size={18}
                              className="text-[#A9CCA9]"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {morador.nome}
                            </p>

                            <p className="mt-0.5 text-xs text-white/40">
                              Cadastro de morador
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-white/75">
                          <Home
                            size={15}
                            className="shrink-0 text-white/35"
                          />
                          {morador.unidade}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-white/70">
                            <Mail
                              size={13}
                              className="shrink-0 text-white/35"
                            />
                            <span className="max-w-[190px] truncate">
                              {morador.email || "E-mail não informado"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <Phone
                              size={13}
                              className="shrink-0 text-white/35"
                            />
                            {morador.telefone || "Telefone não informado"}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-white/65">
                          {morador.cpf || "Não informado"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill status={morador.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {moradoresFiltrados.length === 0 && (
                <div className="flex flex-col items-center px-5 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                    <UserRound
                      size={25}
                      className="text-white/35"
                    />
                  </div>

                  <p className="mt-4 text-sm font-medium text-white/80">
                    Nenhum morador encontrado
                  </p>

                  <p className="mt-1 max-w-sm text-xs text-white/40">
                    Não encontramos cadastros correspondentes à sua pesquisa
                    ou ao filtro selecionado.
                  </p>
                </div>
              )}
            </div>

            {/* RESULTADO NO CELULAR */}

            <div className="space-y-3 p-3 md:hidden">
              {moradoresFiltrados.map((morador) => (
                <div
                  key={morador.id}
                  className="rounded-xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07]">
                        <UserRound
                          size={18}
                          className="text-[#A9CCA9]"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {morador.nome}
                        </p>

                        <p className="mt-1 text-xs text-white/50">
                          {morador.unidade}
                        </p>
                      </div>
                    </div>

                    <StatusPill status={morador.status} />
                  </div>

                  <div className="mt-4 space-y-2 border-t border-white/[0.07] pt-3">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Mail size={14} className="shrink-0 text-white/35" />
                      <span className="break-all">
                        {morador.email || "E-mail não informado"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Phone size={14} className="shrink-0 text-white/35" />
                      {morador.telefone || "Telefone não informado"}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Hash size={14} className="shrink-0 text-white/35" />
                      CPF: {morador.cpf || "Não informado"}
                    </div>
                  </div>
                </div>
              ))}

              {moradoresFiltrados.length === 0 && (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <UserRound
                    size={28}
                    className="text-white/35"
                  />

                  <p className="mt-3 text-sm font-medium text-white/80">
                    Nenhum morador encontrado
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    Tente mudar a pesquisa ou o filtro.
                  </p>
                </div>
              )}
            </div>

            {/* RODAPÉ */}

            <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-white/45">
                Exibindo{" "}
                <span className="font-semibold text-white/75">
                  {moradoresFiltrados.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-white/75">
                  {totalMoradores}
                </span>{" "}
                moradores
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <ShieldCheck size={13} className="text-[#91B994]" />
                Consulta somente leitura
              </div>
            </div>
          </section>

          {/* AVISO DE PERMISSÃO */}

          <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-[#A9CCA9]"
            />

            <p className="text-xs leading-relaxed text-white/50">
              Esta área é destinada exclusivamente à consulta dos moradores
              do condomínio. O administrador não possui opções para cadastrar,
              editar, excluir ou alterar os dados dos moradores.
            </p>
          </div>
        </>
      )}
    </div>
  );
}