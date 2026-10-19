
import React, { useEffect, useState } from "react";

import { collection, getDocs } from "firebase/firestore";

import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Mail,
  LockKeyhole,
  UserRound,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import useAuth from "@/auth/AuthContext";
import { db } from "@/auth/firebase";

import fundoLogin from "@/assets/fundo-morada-login.png";

/* =========================================================
   FORMATAÇÃO
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

function formatarIdentificador(valor = "") {
  if (/[a-zA-Z@]/.test(String(valor))) {
    return valor;
  }

  return formatarCPF(valor);
}

function obterEnderecoCondominio(condominio) {
  if (!condominio) return "";

  if (typeof condominio.endereco === "string") {
    return [
      condominio.endereco,
      condominio.numero ? `nº ${condominio.numero}` : "",
      condominio.bairro,
      condominio.cidade,
      condominio.estado,
      condominio.cep,
    ]
      .filter(Boolean)
      .join(" - ");
  }

  if (
    condominio.endereco &&
    typeof condominio.endereco === "object"
  ) {
    const endereco = condominio.endereco;

    return [
      endereco.rua,
      endereco.numero,
      endereco.bairro,
      endereco.cidade,
      endereco.estado,
      endereco.cep,
    ]
      .filter(Boolean)
      .join(" - ");
  }

  return [
    condominio.rua,
    condominio.numero,
    condominio.bairro,
    condominio.cidade,
    condominio.estado,
    condominio.cep,
  ]
    .filter(Boolean)
    .join(" - ");
}

function obterMensagemErroLogin(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail, CPF ou senha incorretos.";

    case "auth/invalid-email":
      return "O e-mail informado é inválido.";

    case "auth/user-disabled":
      return "Esta conta está desativada.";

    case "auth/too-many-requests":
      return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";

    case "auth/network-request-failed":
      return "Não foi possível conectar ao servidor. Verifique sua internet.";

    default:
      return (
        error?.message ||
        "Não foi possível realizar o login. Tente novamente."
      );
  }
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [condominio, setCondominio] = useState("");
  const [condominioSelecionado, setCondominioSelecionado] =
    useState(null);

  const [condominios, setCondominios] = useState([]);
  const [carregandoCondominios, setCarregandoCondominios] =
    useState(true);
  const [condominiosCarregados, setCondominiosCarregados] =
    useState(false);
  const [erroCondominios, setErroCondominios] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  /* =======================================================
     CARREGAR CATÁLOGO PÚBLICO UMA VEZ
     Evita interromper a consulta ao alterar o estado
     de carregamento.
  ======================================================= */

  useEffect(() => {
    let ativo = true;

    async function carregarCondominios() {
      setCarregandoCondominios(true);
      setErroCondominios("");

      try {
        const resultado = await getDocs(
          collection(db, "condominios_publicos")
        );

        if (!ativo) return;

        const lista = resultado.docs.map((documento) => {
          const dados = documento.data();

          return {
            id: documento.id,
            ...dados,
            nome: dados.nome || "Condomínio sem nome",
            endereco: obterEnderecoCondominio(dados),
          };
        });

        lista.sort((a, b) =>
          String(a.nome || "").localeCompare(
            String(b.nome || ""),
            "pt-BR"
          )
        );

        setCondominios(lista);
        setCondominiosCarregados(true);
      } catch (error) {
        console.error(
          "[LOGIN] Erro ao carregar catálogo:",
          error?.code || error?.message
        );

        if (ativo) {
          setErroCondominios(
            "Não foi possível carregar os condomínios. Verifique a conexão e as regras do Firestore."
          );
        }
      } finally {
        if (ativo) {
          setCarregandoCondominios(false);
        }
      }
    }

    carregarCondominios();

    return () => {
      ativo = false;
    };
  }, []);

  /* =======================================================
     SUGESTÕES
  ======================================================= */

  const termoCondominio = condominio.trim().toLowerCase();

  const sugestoes = condominios.filter((item) => {
    if (!termoCondominio) return false;

    const nome = String(item.nome || "").toLowerCase();
    const endereco = String(item.endereco || "").toLowerCase();

    return (
      nome.includes(termoCondominio) ||
      endereco.includes(termoCondominio)
    );
  });

  /* =======================================================
     REDIRECIONAR POR PERFIL
  ======================================================= */

  function direcionarConta(conta) {
    if (conta?.role === "super_admin") {
      navigate("/minha-area", { replace: true });
      return true;
    }

    if (
      conta?.role === "admin" ||
      conta?.role === "sindico" ||
      conta?.role === "portaria"
    ) {
      navigate("/admin", { replace: true });
      return true;
    }

    if (conta?.role === "morador") {
      navigate("/morador", { replace: true });
      return true;
    }

    return false;
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  async function handleSubmit(evento) {
    evento.preventDefault();

    if (carregando) return;

    setErro("");

    if (!identificador.trim()) {
      setErro("Informe seu CPF ou e-mail.");
      return;
    }

    if (!password) {
      setErro("Informe sua senha.");
      return;
    }

    const usandoEmail = identificador.includes("@");

    if (!condominioSelecionado && !usandoEmail) {
      setErro(
        "Para entrar com CPF, selecione seu condomínio."
      );
      return;
    }

    setCarregando(true);

    try {
      const conta = await login(
        identificador,
        password,
        condominioSelecionado
      );

      if (!conta) {
        setErro(
          "Não foi possível validar seu acesso. Confira os dados e tente novamente."
        );
        return;
      }

      const redirecionado = direcionarConta(conta);

      if (!redirecionado) {
        setErro(
          "Seu perfil não possui acesso ao aplicativo."
        );
      }
    } catch (error) {
      console.error(
        "[LOGIN] Erro:",
        error?.code || error?.message
      );

      setErro(obterMensagemErroLogin(error));
    } finally {
      setCarregando(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#18241F]">
      {/* FUNDO */}

      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fundoLogin})` }}
      />

      {/* CONTEÚDO */}

      <div className="relative z-10 min-h-[100dvh] w-full px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1500px] flex-col justify-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          {/* PAINEL DE LOGIN */}

          <div className="ml-auto flex w-full justify-center lg:w-[48%] lg:justify-end">
            <div className="w-full max-w-[500px] rounded-[30px] border border-white/15 bg-black/10 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-8 lg:p-9">
              <div className="mb-7">
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Bem-vindo
                </h1>

                <p className="mt-2 text-sm text-white/65">
                  Faça login para continuar.
                </p>
              </div>

              {erro && (
                <div
                  role="alert"
                  className="mb-5 rounded-2xl border border-white/10 bg-[#B85C4E]/75 px-4 py-3 text-sm leading-5 text-white backdrop-blur-md"
                >
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* CPF OU E-MAIL */}

                <div>
                  <label
                    htmlFor="identificador"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    CPF ou e-mail
                  </label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />

                    <input
                      id="identificador"
                      type="text"
                      placeholder="Digite seu CPF ou e-mail"
                      value={identificador}
                      onChange={(evento) => {
                        setIdentificador(
                          formatarIdentificador(evento.target.value)
                        );
                        setErro("");
                      }}
                      className="w-full rounded-2xl border border-white/20 bg-white/[0.08] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/40 focus:border-white/40 focus:bg-white/[0.12] focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      autoComplete="username"
                      inputMode={
                        /[a-zA-Z@]/.test(identificador)
                          ? "email"
                          : "numeric"
                      }
                      required
                      disabled={carregando}
                    />
                  </div>
                </div>

                {/* SENHA */}

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    Senha
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />

                    <input
                      id="password"
                      type={mostrarSenha ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(evento) => {
                        setPassword(evento.target.value);
                        setErro("");
                      }}
                      className="w-full rounded-2xl border border-white/20 bg-white/[0.08] py-3.5 pl-12 pr-12 text-sm text-white outline-none transition-all placeholder:text-white/40 focus:border-white/40 focus:bg-white/[0.12] focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      autoComplete="current-password"
                      required
                      disabled={carregando}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarSenha((valor) => !valor)
                      }
                      disabled={carregando}
                      className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-xl p-2 text-white/55 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
                      aria-label={
                        mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {mostrarSenha ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-white/50">
                    Moradores podem utilizar o CPF cadastrado como
                    identificador. Administradores devem entrar com
                    o e-mail do responsável.
                  </p>
                </div>

                {/* CONDOMÍNIO */}

                <div className="relative">
                  <label
                    htmlFor="condominio"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    Condomínio
                    <span className="ml-1 font-normal text-white/45">
                      (obrigatório, exceto para Super Admin)
                    </span>
                  </label>

                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />

                    <input
                      id="condominio"
                      type="text"
                      placeholder="Digite o nome do condomínio"
                      value={condominio}
                      onChange={(evento) => {
                        setCondominio(evento.target.value);
                        setCondominioSelecionado(null);
                        setErro("");
                      }}
                      className="w-full rounded-2xl border border-white/20 bg-white/[0.08] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/40 focus:border-white/40 focus:bg-white/[0.12] focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={carregando}
                      autoComplete="off"
                    />
                  </div>

                  {carregandoCondominios && termoCondominio && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      Carregando condomínios...
                    </div>
                  )}

                  {erroCondominios && (
                    <p role="alert" className="mt-2 text-xs font-medium text-white/75">
                      {erroCondominios}
                    </p>
                  )}

                  {!condominioSelecionado &&
                    termoCondominio.length > 0 &&
                    !carregandoCondominios && (
                      <div className="absolute left-0 right-0 z-30 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-white/15 bg-[#26342E]/95 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                        {sugestoes.length > 0 ? (
                          sugestoes.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setCondominio(item.nome);
                                setCondominioSelecionado(item);
                                setErro("");
                              }}
                              disabled={carregando}
                              className="w-full border-b border-white/10 px-4 py-3.5 text-left transition-all last:border-b-0 hover:bg-white/10 disabled:opacity-60"
                            >
                              <div className="flex items-start gap-3">
                                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#A8BFAB]" />

                                <div className="min-w-0">
                                  <p className="font-medium text-white">
                                    {item.nome}
                                  </p>

                                  {item.endereco && (
                                    <p className="mt-1 text-xs leading-5 text-white/50">
                                      {item.endereco}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="p-4 text-sm text-white/55">
                            Nenhum condomínio encontrado.
                          </p>
                        )}
                      </div>
                    )}

                  {condominioSelecionado && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3.5">
                      <div className="flex items-start gap-3">
                        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#A8BFAB]" />

                        <div className="min-w-0">
                          <p className="font-semibold text-white">
                            {condominioSelecionado.nome}
                          </p>

                          {condominioSelecionado.endereco && (
                            <p className="mt-1 text-sm leading-5 text-white/50">
                              {condominioSelecionado.endereco}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!condominioSelecionado && !condominio && (
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      Selecione o condomínio vinculado à sua conta.
                      O Super Admin é a única função que entra sem essa seleção.
                    </p>
                  )}
                </div>

                {/* ENTRAR */}

                <button
                  type="submit"
                  disabled={carregando}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6F8D7A] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(111,141,122,0.22)] transition-all hover:bg-[#5F7D6A] hover:shadow-[0_14px_35px_rgba(111,141,122,0.28)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Entrar
                    </>
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-white/65 transition hover:text-white hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ */}

      <div className="absolute bottom-4 left-5 z-10 flex items-center gap-2 text-xs text-white/40 sm:left-8 lg:left-12 xl:left-20">
        <Mail className="h-3.5 w-3.5" />
        Acesso seguro à plataforma Morada.
      </div>
    </div>
  );
}
