import React, {
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

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

import { useNavigate } from "react-router-dom";

import useAuth from "@/auth/AuthContext";
import { db } from "@/auth/firebase";

import logoLogin from "@/assets/logo-morada-login-app.png";
import fundoLogin from "@/assets/fundo-morada-app.png";

/* =========================================================
   FORMATAÇÃO
========================================================= */

function somenteNumeros(valor = "") {
  return String(valor).replace(/\D/g, "");
}

function formatarCPF(valor = "") {
  const numeros = somenteNumeros(valor).slice(
    0,
    11
  );

  if (numeros.length <= 3) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return `${numeros.slice(
      0,
      3
    )}.${numeros.slice(3)}`;
  }

  if (numeros.length <= 9) {
    return `${numeros.slice(
      0,
      3
    )}.${numeros.slice(
      3,
      6
    )}.${numeros.slice(6)}`;
  }

  return `${numeros.slice(
    0,
    3
  )}.${numeros.slice(
    3,
    6
  )}.${numeros.slice(
    6,
    9
  )}-${numeros.slice(9)}`;
}

function formatarIdentificador(valor = "") {
  const texto = String(valor);

  if (
    /[a-zA-Z@]/.test(texto)
  ) {
    return texto;
  }

  return formatarCPF(texto);
}

/* =========================================================
   ENDEREÇO DO CONDOMÍNIO
========================================================= */

function obterEnderecoCondominio(
  condominio
) {
  if (!condominio) {
    return "";
  }

  if (
    typeof condominio.endereco ===
    "string"
  ) {
    return condominio.endereco;
  }

  if (
    condominio.endereco &&
    typeof condominio.endereco ===
      "object"
  ) {
    const endereco =
      condominio.endereco;

    const partes = [
      endereco.rua,
      endereco.numero,
      endereco.bairro,
      endereco.cidade,
      endereco.estado,
      endereco.cep,
    ].filter(Boolean);

    return partes.join(" - ");
  }

  const partes = [
    condominio.rua,
    condominio.numero,
    condominio.bairro,
    condominio.cidade,
    condominio.estado,
    condominio.cep,
  ].filter(Boolean);

  return partes.join(" - ");
}

/* =========================================================
   MENSAGEM DE ERRO DE LOGIN
========================================================= */

function obterMensagemErroLogin(
  error
) {
  if (!error) {
    return "Não foi possível realizar o login.";
  }

  switch (error?.code) {
    case "auth/invalid-credential":
      return "E-mail ou senha incorretos.";

    case "auth/wrong-password":
      return "E-mail ou senha incorretos.";

    case "auth/user-not-found":
      return "Não existe uma conta com este e-mail.";

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

  const navigate =
    useNavigate();

  const [
    identificador,
    setIdentificador,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [
    condominio,
    setCondominio,
  ] = useState("");

  const [
    condominioSelecionado,
    setCondominioSelecionado,
  ] = useState(null);

  const [
    condominios,
    setCondominios,
  ] = useState([]);

  const [
    carregandoCondominios,
    setCarregandoCondominios,
  ] = useState(false);

  const [
    condominiosCarregados,
    setCondominiosCarregados,
  ] = useState(false);

  const [
    erroCondominios,
    setErroCondominios,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  /* =======================================================
     CARREGAR CONDOMÍNIOS
  ======================================================= */

  useEffect(() => {
    const termo =
      condominio.trim();

    if (
      !termo ||
      condominiosCarregados ||
      carregandoCondominios
    ) {
      return;
    }

    let ativo = true;

    async function carregarCondominios() {
      setCarregandoCondominios(
        true
      );

      setErroCondominios("");

      try {
        const referencia =
          collection(
            db,
            "condominios"
          );

        const resultado =
          await getDocs(
            referencia
          );

        if (!ativo) {
          return;
        }

        const lista =
          resultado.docs.map(
            (documento) => {
              const dados =
                documento.data();

              return {
                id: documento.id,

                ...dados,

                nome:
                  dados?.nome ||
                  "Condomínio sem nome",

                endereco:
                  obterEnderecoCondominio(
                    dados
                  ),
              };
            }
          );

        lista.sort(
          (a, b) =>
            String(
              a.nome || ""
            ).localeCompare(
              String(
                b.nome || ""
              ),
              "pt-BR"
            )
        );

        setCondominios(
          lista
        );

        setCondominiosCarregados(
          true
        );
      } catch (error) {
        console.error(
          "Erro ao carregar condomínios:",
          error
        );

        if (ativo) {
          setErroCondominios(
            "Não foi possível carregar os condomínios."
          );
        }
      } finally {
        if (ativo) {
          setCarregandoCondominios(
            false
          );
        }
      }
    }

    carregarCondominios();

    return () => {
      ativo = false;
    };
  }, [
    condominio,
    condominiosCarregados,
    carregandoCondominios,
  ]);

  /* =======================================================
     SUGESTÕES
  ======================================================= */

  const termoCondominio =
    condominio
      .trim()
      .toLowerCase();

  const sugestoes =
    condominios.filter(
      (item) => {
        const nome =
          String(
            item?.nome || ""
          ).toLowerCase();

        const endereco =
          String(
            item?.endereco || ""
          ).toLowerCase();

        return (
          nome.includes(
            termoCondominio
          ) ||
          endereco.includes(
            termoCondominio
          )
        );
      }
    );

  /* =======================================================
     LOGIN
  ======================================================= */

  async function handleSubmit(
    evento
  ) {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");

    /* =====================================================
       VALIDAÇÕES
    ===================================================== */

    if (
      !identificador.trim()
    ) {
      setErro(
        "Informe seu CPF ou e-mail."
      );

      return;
    }

    if (!password) {
      setErro(
        "Informe sua senha."
      );

      return;
    }

    /* =====================================================
       LOGIN
    ===================================================== */

    setCarregando(true);

    try {
      /* ===================================================
         SUPER ADMIN SEM CONDOMÍNIO
      =================================================== */

      if (
        !condominioSelecionado
      ) {
        const conta =
          await login(
            identificador,
            password,
            null
          );

        if (
          conta?.role ===
          "super_admin"
        ) {
          navigate(
            "/minha-area",
            {
              replace: true,
            }
          );

          return;
        }

        setErro(
          "Para acessar como Admin ou Morador, selecione um condomínio."
        );

        return;
      }

      /* ===================================================
         LOGIN COM CONDOMÍNIO
      =================================================== */

      const conta =
        await login(
          identificador,
          password,
          condominioSelecionado
        );

      if (!conta) {
        setErro(
          "Não foi possível validar seu acesso."
        );

        return;
      }

      /* ===================================================
         SUPER ADMIN
      =================================================== */

      if (
        conta.role ===
        "super_admin"
      ) {
        navigate(
          "/minha-area",
          {
            replace: true,
          }
        );

        return;
      }

      /* ===================================================
         ADMIN / SÍNDICO / PORTARIA
      =================================================== */

      if (
        conta.role === "admin" ||
        conta.role === "sindico" ||
        conta.role === "portaria"
      ) {
        navigate(
          "/admin",
          {
            replace: true,
          }
        );

        return;
      }

      /* ===================================================
         MORADOR
      =================================================== */

      if (
        conta.role ===
        "morador"
      ) {
        navigate(
          "/morador",
          {
            replace: true,
          }
        );

        return;
      }

      setErro(
        "Seu perfil não possui acesso ao aplicativo."
      );
    } catch (error) {
      console.error(
        "[LOGIN] Erro completo:",
        error
      );

      console.error(
        "[LOGIN] Código:",
        error?.code
      );

      console.error(
        "[LOGIN] Mensagem:",
        error?.message
      );

      setErro(
        obterMensagemErroLogin(
          error
        )
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        relative
        min-h-[100dvh]
        overflow-hidden
        bg-[#18241F]
      "
    >
      {/* ===================================================
          FUNDO
      =================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-cover
          bg-center
          bg-no-repeat
        "
        style={{
          backgroundImage: `url(${fundoLogin})`,
        }}
      />

      {/* ===================================================
          ESCURECIMENTO
      =================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-black/30
        "
      />

      {/* ===================================================
          GRADIENTE SUAVE
      =================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-black/30
          via-transparent
          to-black/20
        "
      />

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <div
        className="
          relative
          z-10
          min-h-[100dvh]
          w-full
          px-5
          py-8
          sm:px-8
          lg:px-12
          xl:px-20
        "
      >
        <div
          className="
            mx-auto
            flex
            min-h-[calc(100dvh-4rem)]
            w-full
            max-w-[1500px]
            flex-col
            justify-center
            gap-10
            lg:flex-row
            lg:items-center
            lg:justify-between
            lg:gap-16
          "
        >
          {/* =================================================
              LOGO — CENTRO ESQUERDO / PARTE SUPERIOR
          ================================================= */}

          <div
            className="
              flex
              w-full
              justify-center
              lg:absolute
              lg:left-[29%]
              lg:top-[16%]
              lg:w-auto
              lg:-translate-x-1/2
            "
          >
            <img
              src={logoLogin}
              alt="Morada"
              className="
                w-[260px]
                max-w-full
                object-contain
                drop-shadow-[0_12px_35px_rgba(0,0,0,0.26)]
                sm:w-[310px]
                md:w-[340px]
                lg:w-[390px]
                xl:w-[430px]
              "
            />
          </div>

          {/* =================================================
              LOGIN — DIREITA
          ================================================= */}

          <div
            className="
              ml-auto
              flex
              w-full
              justify-center
              lg:w-[48%]
              lg:justify-end
            "
          >
            <div
              className="
                w-full
                max-w-[500px]
                rounded-[30px]
                border
                border-white/15
                bg-black/10
                p-6
                shadow-[0_25px_80px_rgba(0,0,0,0.18)]
                backdrop-blur-2xl
                sm:p-8
                lg:p-9
              "
            >
              {/* =============================================
                  TÍTULO
              ============================================= */}

              <div className="mb-7">
                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                    text-white
                    sm:text-4xl
                  "
                >
                  Bem-vindo
                </h1>

                <p
                  className="
                    mt-2
                    text-sm
                    text-white/65
                  "
                >
                  Faça login para continuar.
                </p>
              </div>

              {/* =============================================
                  ERRO
              ============================================= */}

              {erro && (
                <div
                  className="
                    mb-5
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#B85C4E]/75
                    px-4
                    py-3
                    text-sm
                    leading-5
                    text-white
                    backdrop-blur-md
                  "
                >
                  {erro}
                </div>
              )}

              {/* =============================================
                  FORMULÁRIO
              ============================================= */}

              <form
                onSubmit={
                  handleSubmit
                }
                className="
                  space-y-5
                "
              >
                {/* ===========================================
                    CPF / E-MAIL
                =========================================== */}

                <div>
                  <label
                    htmlFor="identificador"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-white
                    "
                  >
                    CPF ou e-mail
                  </label>

                  <div className="relative">
                    <UserRound
                      className="
                        pointer-events-none
                        absolute
                        left-4
                        top-1/2
                        h-5
                        w-5
                        -translate-y-1/2
                        text-white/50
                      "
                      strokeWidth={1.8}
                    />

                    <input
                      id="identificador"
                      type="text"
                      placeholder="Digite seu CPF ou e-mail"
                      value={
                        identificador
                      }
                      onChange={(
                        evento
                      ) => {
                        setIdentificador(
                          formatarIdentificador(
                            evento.target
                              .value
                          )
                        );

                        setErro("");
                      }}
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-white/20
                        bg-white/[0.08]
                        py-3.5
                        pl-12
                        pr-4
                        text-sm
                        text-white
                        outline-none
                        transition-all
                        placeholder:text-white/40
                        focus:border-white/40
                        focus:bg-white/[0.12]
                        focus:ring-2
                        focus:ring-white/10
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                      autoComplete="username"
                      inputMode={
                        /[a-zA-Z@]/.test(
                          identificador
                        )
                          ? "email"
                          : "numeric"
                      }
                      required
                      disabled={
                        carregando
                      }
                    />
                  </div>
                </div>

                {/* ===========================================
                    SENHA
                =========================================== */}

                <div>
                  <label
                    htmlFor="password"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-white
                    "
                  >
                    Senha
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      className="
                        pointer-events-none
                        absolute
                        left-4
                        top-1/2
                        h-5
                        w-5
                        -translate-y-1/2
                        text-white/50
                      "
                      strokeWidth={1.8}
                    />

                    <input
                      id="password"
                      type={
                        mostrarSenha
                          ? "text"
                          : "password"
                      }
                      placeholder="Digite sua senha"
                      value={
                        password
                      }
                      onChange={(
                        evento
                      ) => {
                        setPassword(
                          evento.target
                            .value
                        );

                        setErro("");
                      }}
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-white/20
                        bg-white/[0.08]
                        py-3.5
                        pl-12
                        pr-12
                        text-sm
                        text-white
                        outline-none
                        transition-all
                        placeholder:text-white/40
                        focus:border-white/40
                        focus:bg-white/[0.12]
                        focus:ring-2
                        focus:ring-white/10
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                      autoComplete="current-password"
                      required
                      disabled={
                        carregando
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarSenha(
                          (valor) =>
                            !valor
                        )
                      }
                      disabled={
                        carregando
                      }
                      className="
                        absolute
                        right-3
                        top-1/2
                        flex
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-xl
                        p-2
                        text-white/55
                        transition-all
                        hover:bg-white/10
                        hover:text-white
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                      aria-label={
                        mostrarSenha
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      {mostrarSenha ? (
                        <EyeOff
                          className="h-5 w-5"
                          strokeWidth={1.8}
                        />
                      ) : (
                        <Eye
                          className="h-5 w-5"
                          strokeWidth={1.8}
                        />
                      )}
                    </button>
                  </div>

                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-white/50
                    "
                  >
                    Para acesso de moradores,
                    a senha inicial pode ser o
                    CPF cadastrado.
                  </p>
                </div>

                {/* ===========================================
                    CONDOMÍNIO
                =========================================== */}

                <div className="relative">
                  <label
                    htmlFor="condominio"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-white
                    "
                  >
                    Condomínio

                    <span
                      className="
                        ml-1
                        font-normal
                        text-white/45
                      "
                    >
                      (Admin e Morador)
                    </span>
                  </label>

                  <div className="relative">
                    <Building2
                      className="
                        pointer-events-none
                        absolute
                        left-4
                        top-1/2
                        h-5
                        w-5
                        -translate-y-1/2
                        text-white/50
                      "
                      strokeWidth={1.8}
                    />

                    <input
                      id="condominio"
                      type="text"
                      placeholder="Digite o nome do condomínio"
                      value={
                        condominio
                      }
                      onChange={(
                        evento
                      ) => {
                        setCondominio(
                          evento.target
                            .value
                        );

                        setCondominioSelecionado(
                          null
                        );

                        setErro("");
                      }}
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-white/20
                        bg-white/[0.08]
                        py-3.5
                        pl-12
                        pr-4
                        text-sm
                        text-white
                        outline-none
                        transition-all
                        placeholder:text-white/40
                        focus:border-white/40
                        focus:bg-white/[0.12]
                        focus:ring-2
                        focus:ring-white/10
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                      disabled={
                        carregando
                      }
                      autoComplete="off"
                    />
                  </div>

                  {/* =========================================
                      CARREGANDO
                  ========================================= */}

                  {carregandoCondominios &&
                    termoCondominio && (
                      <div
                        className="
                          mt-2
                          flex
                          items-center
                          gap-2
                          text-xs
                          text-white/55
                        "
                      >
                        <Loader2
                          className="
                            h-3.5
                            w-3.5
                            animate-spin
                            text-white
                          "
                          strokeWidth={1.8}
                        />

                        Carregando condomínios...
                      </div>
                    )}

                  {/* =========================================
                      ERRO
                  ========================================= */}

                  {erroCondominios &&
                    termoCondominio && (
                      <p
                        className="
                          mt-2
                          text-xs
                          font-medium
                          text-white/75
                        "
                      >
                        {
                          erroCondominios
                        }
                      </p>
                    )}

                  {/* =========================================
                      SUGESTÕES
                  ========================================= */}

                  {!condominioSelecionado &&
                    termoCondominio.length >
                      0 &&
                    !carregandoCondominios && (
                      <div
                        className="
                          absolute
                          left-0
                          right-0
                          z-30
                          mt-2
                          max-h-60
                          overflow-y-auto
                          rounded-2xl
                          border
                          border-white/15
                          bg-[#26342E]/95
                          shadow-[0_20px_50px_rgba(0,0,0,0.25)]
                          backdrop-blur-xl
                        "
                      >
                        {sugestoes.length >
                        0 ? (
                          sugestoes.map(
                            (item) => (
                              <button
                                key={
                                  item.id
                                }
                                type="button"
                                onClick={() => {
                                  setCondominio(
                                    item.nome
                                  );

                                  setCondominioSelecionado(
                                    item
                                  );

                                  setErro(
                                    ""
                                  );
                                }}
                                disabled={
                                  carregando
                                }
                                className="
                                  w-full
                                  border-b
                                  border-white/10
                                  px-4
                                  py-3.5
                                  text-left
                                  transition-all
                                  last:border-b-0
                                  hover:bg-white/10
                                  disabled:cursor-not-allowed
                                  disabled:opacity-60
                                "
                              >
                                <div
                                  className="
                                    flex
                                    items-start
                                    gap-3
                                  "
                                >
                                  <Building2
                                    className="
                                      mt-0.5
                                      h-5
                                      w-5
                                      shrink-0
                                      text-[#A8BFAB]
                                    "
                                    strokeWidth={
                                      1.8
                                    }
                                  />

                                  <div className="min-w-0">
                                    <p
                                      className="
                                        font-medium
                                        text-white
                                      "
                                    >
                                      {
                                        item.nome
                                      }
                                    </p>

                                    {item.endereco && (
                                      <p
                                        className="
                                          mt-1
                                          text-xs
                                          leading-5
                                          text-white/50
                                        "
                                      >
                                        {
                                          item.endereco
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          )
                        ) : (
                          <p
                            className="
                              p-4
                              text-sm
                              text-white/55
                            "
                          >
                            Nenhum condomínio encontrado.
                          </p>
                        )}
                      </div>
                    )}

                  {/* =========================================
                      SELECIONADO
                  ========================================= */}

                  {condominioSelecionado && (
                    <div
                      className="
                        mt-3
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/[0.08]
                        p-3.5
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          gap-3
                        "
                      >
                        <Building2
                          className="
                            mt-0.5
                            h-5
                            w-5
                            shrink-0
                            text-[#A8BFAB]
                          "
                          strokeWidth={1.8}
                        />

                        <div className="min-w-0">
                          <p
                            className="
                              font-semibold
                              text-white
                            "
                          >
                            {
                              condominioSelecionado.nome
                            }
                          </p>

                          {condominioSelecionado.endereco && (
                            <p
                              className="
                                mt-1
                                text-sm
                                leading-5
                                text-white/50
                              "
                            >
                              {
                                condominioSelecionado.endereco
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =========================================
                      ORIENTAÇÃO
                  ========================================= */}

                  {!condominioSelecionado &&
                    !condominio && (
                      <p
                        className="
                          mt-2
                          text-xs
                          leading-5
                          text-white/45
                        "
                      >
                        Super Admin não precisa
                        selecionar condomínio.
                      </p>
                    )}
                </div>

                {/* =============================================
                    BOTÃO ENTRAR
                ============================================= */}

                <button
                  type="submit"
                  disabled={
                    carregando
                  }
                  className="
                    mt-2
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-[#6F8D7A]
                    px-5
                    py-3.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-[0_10px_30px_rgba(111,141,122,0.22)]
                    transition-all
                    hover:bg-[#5F7D6A]
                    hover:shadow-[0_14px_35px_rgba(111,141,122,0.28)]
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {carregando ? (
                    <>
                      <Loader2
                        className="
                          h-4
                          w-4
                          animate-spin
                        "
                        strokeWidth={1.8}
                      />

                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn
                        className="h-4 w-4"
                        strokeWidth={1.8}
                      />

                      Entrar
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          RODAPÉ
      ===================================================== */}

      <div
        className="
          absolute
          bottom-4
          left-5
          z-10
          flex
          items-center
          gap-2
          text-xs
          text-white/40
          sm:left-8
          lg:left-12
          xl:left-20
        "
      >
        <Mail
          className="h-3.5 w-3.5"
          strokeWidth={1.8}
        />

        Acesso seguro à plataforma Morada.
      </div>
    </div>
  );
}