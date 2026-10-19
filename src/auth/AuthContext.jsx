
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/auth/firebase";

const AuthContext = createContext(null);

/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarEmail(valor) {
  return String(valor || "").trim().toLowerCase();
}

function normalizarCPF(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function obterIdRegistro(registro) {
  if (!registro) return "";

  return registro.id || registro._id || registro.ID || "";
}

function obterPerfilUsuario(usuario) {
  const perfil = usuario?.perfil || usuario?.role || "Morador";
  const perfilNormalizado = String(perfil).trim().toLowerCase();

  if (
    perfilNormalizado === "administrador" ||
    perfilNormalizado === "admin"
  ) {
    return "admin";
  }

  if (
    perfilNormalizado === "sindico" ||
    perfilNormalizado === "síndico"
  ) {
    return "sindico";
  }

  if (perfilNormalizado === "portaria") {
    return "portaria";
  }

  if (
    perfilNormalizado === "super_admin" ||
    perfilNormalizado === "superadmin"
  ) {
    return "super_admin";
  }

  return "morador";
}

function usuarioEstaAtivo(usuario) {
  if (!usuario) return false;

  if (
    usuario.ativo === false ||
    usuario.active === false
  ) {
    return false;
  }

  const status = String(usuario.status || "")
    .trim()
    .toLowerCase();

  return ![
    "inativo",
    "inactive",
    "bloqueado",
    "blocked",
  ].includes(status);
}

function obterNomeUsuario(usuario) {
  return usuario?.nome || usuario?.name || "Usuário";
}

function obterCondominioId(usuario, condominio) {
  return (
    usuario?.condominio_id ||
    usuario?.condominioId ||
    condominio?.id ||
    ""
  );
}

function obterCondominioNome(usuario, condominio) {
  return (
    usuario?.condominio_nome ||
    usuario?.condominioNome ||
    condominio?.nome ||
    ""
  );
}

const PERFIS_ADMINISTRATIVOS = [
  "admin",
  "sindico",
  "portaria",
];

/* =========================================================
   CRIAR CONTA DA SESSÃO
========================================================= */

function criarContaDoUsuario(
  usuario,
  firebaseUser,
  condominio = null
) {
  const role = obterPerfilUsuario(usuario);

  return {
    id: obterIdRegistro(usuario) || firebaseUser?.uid || "",
    uid: firebaseUser?.uid || "",
    name: obterNomeUsuario(usuario),
    nome: obterNomeUsuario(usuario),
    email: firebaseUser?.email || usuario?.email || "",
    role,
    perfil: usuario?.perfil || role,
    telefone: usuario?.telefone || "",
    cpf: usuario?.cpf || "",
    bloco: usuario?.bloco || "",
    apartamento: usuario?.apartamento || "",
    tipoUnidade: usuario?.tipoUnidade || "",
    unidadeId: usuario?.unidadeId || "",
    unidade: usuario?.unidade || null,

    condominio_id: obterCondominioId(usuario, condominio),
    condominio_nome: obterCondominioNome(usuario, condominio),

    ativo: usuario?.ativo !== false && usuario?.active !== false,

    foto: usuario?.foto || firebaseUser?.photoURL || "",

    dependentes: Array.isArray(usuario?.dependentes)
      ? usuario.dependentes
      : [],

    veiculos: Array.isArray(usuario?.veiculos)
      ? usuario.veiculos
      : [],

    ultimo_acesso: usuario?.ultimo_acesso || "",
  };
}

/* =========================================================
   BUSCAR USUÁRIO POR CPF
========================================================= */

async function buscarUsuarioPorCPF(cpfInformado) {
  const cpf = normalizarCPF(cpfInformado);

  if (cpf.length !== 11) return null;

  const usuariosRef = collection(db, "usuarios");

  try {
    const consultaNormalizada = query(
      usuariosRef,
      where("cpf_normalizado", "==", cpf),
      limit(1)
    );

    const resultado = await getDocs(consultaNormalizada);

    if (!resultado.empty) {
      const documento = resultado.docs[0];

      return {
        id: documento.id,
        data: documento.data(),
      };
    }
  } catch (erro) {
    console.warn(
      "Aviso ao consultar CPF normalizado:",
      erro?.code || erro?.message
    );
  }

  try {
    const consultaCPF = query(
      usuariosRef,
      where("cpf", "==", cpf),
      limit(1)
    );

    const resultado = await getDocs(consultaCPF);

    if (!resultado.empty) {
      const documento = resultado.docs[0];

      return {
        id: documento.id,
        data: documento.data(),
      };
    }
  } catch (erro) {
    console.warn(
      "Aviso ao consultar CPF:",
      erro?.code || erro?.message
    );
  }

  return null;
}

/* =========================================================
   BUSCAR USUÁRIO PELO UID
========================================================= */

async function buscarUsuarioPorUID(uid) {
  if (!uid) return null;

  const referencia = doc(db, "usuarios", uid);
  const documento = await getDoc(referencia);

  if (!documento.exists()) return null;

  return {
    id: documento.id,
    data: documento.data(),
  };
}

/* =========================================================
   BUSCAR CONDOMÍNIO PELO ID VINCULADO AO USUÁRIO
========================================================= */

async function buscarCondominioPorId(id) {
  if (!id) return null;

  const referencia = doc(
    db,
    "condominios",
    String(id)
  );

  const documento = await getDoc(referencia);

  if (!documento.exists()) return null;

  return {
    id: documento.id,
    ...documento.data(),
  };
}

/* =========================================================
   VALIDAR CONDOMÍNIO SELECIONADO
========================================================= */

async function buscarCondominio(
  usuario,
  condominioSelecionado
) {
  const condominioIdSelecionado =
    condominioSelecionado?.id || "";

  const condominioIdUsuario =
    usuario?.condominio_id ||
    usuario?.condominioId ||
    "";

  if (!condominioIdUsuario || !condominioIdSelecionado) {
    return null;
  }

  if (
    String(condominioIdUsuario) !==
    String(condominioIdSelecionado)
  ) {
    return null;
  }

  return buscarCondominioPorId(condominioIdUsuario);
}

/* =========================================================
   ATUALIZAR ÚLTIMO ACESSO
========================================================= */

async function registrarUltimoAcesso(uid) {
  const agora = new Date().toISOString();

  try {
    await updateDoc(
      doc(db, "usuarios", uid),
      { ultimo_acesso: agora }
    );
  } catch (erro) {
    console.warn(
      "Não foi possível atualizar o último acesso:",
      erro?.code || erro?.message
    );
  }

  return agora;
}

/* =========================================================
   PROVIDER
========================================================= */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(true);

  /* =======================================================
     RESTAURAR SESSÃO
  ======================================================= */

  useEffect(() => {
    let desmontado = false;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (!firebaseUser) {
            if (!desmontado) setUser(null);
            return;
          }

          const usuarioEncontrado =
            await buscarUsuarioPorUID(firebaseUser.uid);

          if (!usuarioEncontrado) {
            await signOut(auth);

            if (!desmontado) setUser(null);
            return;
          }

          const dados = usuarioEncontrado.data;

          if (!usuarioEstaAtivo(dados)) {
            await signOut(auth);

            if (!desmontado) setUser(null);
            return;
          }

          const role = obterPerfilUsuario(dados);
          let condominioAtual = null;

          if (role !== "super_admin") {
            const condominioId =
              dados.condominio_id ||
              dados.condominioId ||
              "";

            if (!condominioId) {
              await signOut(auth);

              if (!desmontado) setUser(null);
              return;
            }

            condominioAtual =
              await buscarCondominioPorId(condominioId);

            if (
              !condominioAtual ||
              condominioAtual.ativo === false
            ) {
              await signOut(auth);

              if (!desmontado) setUser(null);
              return;
            }
          }

          const account = criarContaDoUsuario(
            {
              ...dados,
              id: usuarioEncontrado.id,
            },
            firebaseUser,
            condominioAtual
          );

          if (!desmontado) setUser(account);
        } catch (erro) {
          console.error(
            "[AUTH] Erro ao restaurar sessão:",
            erro?.code || erro?.message
          );

          try {
            await signOut(auth);
          } catch {
            // Ignora falha durante o encerramento da sessão.
          }

          if (!desmontado) setUser(null);
        } finally {
          if (!desmontado) setCarregando(false);
        }
      }
    );

    return () => {
      desmontado = true;
      unsubscribe();
    };
  }, []);

  /* =======================================================
     LOGIN
  ======================================================= */

  async function login(
    identificador,
    password,
    condominioSelecionado = null
  ) {
    const valor = String(identificador || "").trim();
    const senha = String(password || "");

    if (!valor) {
      throw new Error("Informe seu CPF ou e-mail.");
    }

    if (!senha) {
      throw new Error("Informe sua senha.");
    }

    try {
      let firebaseUser = null;
      let usuarioFirestore = null;

      /* ===================================================
         LOGIN POR E-MAIL
      =================================================== */

      if (valor.includes("@")) {
        const email = normalizarEmail(valor);

        const resultado = await signInWithEmailAndPassword(
          auth,
          email,
          senha
        );

        firebaseUser = resultado.user;

        usuarioFirestore = await buscarUsuarioPorUID(
          firebaseUser.uid
        );
      }

      /* ===================================================
         LOGIN POR CPF
      =================================================== */

      else {
        const usuarioEncontrado =
          await buscarUsuarioPorCPF(valor);

        if (!usuarioEncontrado) {
          throw new Error("CPF não encontrado.");
        }

        if (!usuarioEstaAtivo(usuarioEncontrado.data)) {
          throw new Error("Usuário inativo.");
        }

        const emailUsuario = normalizarEmail(
          usuarioEncontrado.data?.email
        );

        if (!emailUsuario) {
          throw new Error(
            "O usuário não possui e-mail cadastrado."
          );
        }

        const resultado = await signInWithEmailAndPassword(
          auth,
          emailUsuario,
          senha
        );

        firebaseUser = resultado.user;

        usuarioFirestore = await buscarUsuarioPorUID(
          firebaseUser.uid
        );
      }

      /* ===================================================
         DOCUMENTO DO USUÁRIO
      =================================================== */

      if (!usuarioFirestore) {
        throw new Error(
          "A conta foi autenticada, mas o cadastro correspondente não foi encontrado."
        );
      }

      const dados = usuarioFirestore.data;

      if (!usuarioEstaAtivo(dados)) {
        throw new Error("Usuário inativo.");
      }

      const role = obterPerfilUsuario(dados);

      /* ===================================================
         SUPER ADMIN
      =================================================== */

      if (role === "super_admin") {
        if (condominioSelecionado) {
          throw new Error(
            "O Super Admin não deve selecionar um condomínio."
          );
        }

        const account = criarContaDoUsuario(
          {
            ...dados,
            id: usuarioFirestore.id,
          },
          firebaseUser
        );

        account.ultimo_acesso =
          await registrarUltimoAcesso(firebaseUser.uid);

        setUser(account);
        return account;
      }

     
      /* ===================================================
         EXIGIR CONDOMÍNIO PARA TODOS OS DEMAIS PERFIS
      =================================================== */

      if (!condominioSelecionado) {
        throw new Error(
          "Selecione seu condomínio para acessar a plataforma."
        );
      }


      /* ===================================================
         VALIDAR CONDOMÍNIO SELECIONADO
      =================================================== */

      const condominioIdUsuario =
        dados.condominio_id ||
        dados.condominioId ||
        "";

      if (!condominioIdUsuario) {
        throw new Error(
          "Este usuário ainda não possui um condomínio vinculado."
        );
      }

      if (
        String(condominioIdUsuario) !==
        String(condominioSelecionado.id)
      ) {
        throw new Error(
          "O condomínio selecionado não corresponde ao cadastro deste usuário."
        );
      }

      const condominioEncontrado =
        await buscarCondominio(
          {
            ...dados,
            id: usuarioFirestore.id,
          },
          condominioSelecionado
        );

      if (!condominioEncontrado) {
        throw new Error(
          "O condomínio selecionado não foi encontrado."
        );
      }

      if (condominioEncontrado.ativo === false) {
        throw new Error("Este condomínio está inativo.");
      }

      const account = criarContaDoUsuario(
        {
          ...dados,
          id: usuarioFirestore.id,
        },
        firebaseUser,
        condominioEncontrado
      );

      account.ultimo_acesso =
        await registrarUltimoAcesso(firebaseUser.uid);

      setUser(account);
      return account;
    } catch (error) {
      console.error(
        "[LOGIN] Falha:",
        error?.code || error?.message
      );

      try {
        await signOut(auth);
      } catch {
        // Ignora falha durante o encerramento da sessão.
      }

      setUser(null);
      throw error;
    }
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(
        "[AUTH] Erro ao sair:",
        error?.code || error?.message
      );
    } finally {
      setUser(null);
    }
  }

  /* =======================================================
     CONTEXTO
  ======================================================= */

  const valor = {
    user,
    carregando,
    login,
    logout,

    isAdmin: user?.role === "admin",
    isMorador: user?.role === "morador",
    isSindico: user?.role === "sindico",
    isPortaria: user?.role === "portaria",
    isSuperAdmin: user?.role === "super_admin",

    condominioId: user?.condominio_id || "",
    condominioNome: user?.condominio_nome || "",

    unidadeId: user?.unidadeId || "",
    apartamento: user?.apartamento || "",
    bloco: user?.bloco || "",
    perfil: user?.perfil || "",
    telefone: user?.telefone || "",
    cpf: user?.cpf || "",
    nome: user?.nome || user?.name || "",

    dependentes: user?.dependentes || [],
    veiculos: user?.veiculos || [],
    ativo: user?.ativo !== false,
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export default function useAuth() {
  return useContext(AuthContext);
}