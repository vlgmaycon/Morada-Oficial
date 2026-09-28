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
  return String(valor || "")
    .trim()
    .toLowerCase();
}

function normalizarCPF(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function obterIdRegistro(registro) {
  if (!registro) {
    return "";
  }

  return (
    registro.id ||
    registro._id ||
    registro.ID ||
    ""
  );
}

function obterPerfilUsuario(usuario) {
  const perfil =
    usuario?.perfil ||
    usuario?.role ||
    "Morador";

  const perfilNormalizado = String(
    perfil
  )
    .trim()
    .toLowerCase();

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

  if (
    perfilNormalizado === "portaria"
  ) {
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
  if (!usuario) {
    return false;
  }

  if (usuario.ativo === false) {
    return false;
  }

  const status = String(
    usuario.status || ""
  )
    .trim()
    .toLowerCase();

  if (
    status === "inativo" ||
    status === "inactive" ||
    status === "bloqueado" ||
    status === "blocked"
  ) {
    return false;
  }

  return true;
}

function obterNomeUsuario(usuario) {
  return (
    usuario?.nome ||
    usuario?.name ||
    "Usuário"
  );
}

function obterCondominioId(
  usuario,
  condominio
) {
  return (
    usuario?.condominio_id ||
    usuario?.condominioId ||
    condominio?.id ||
    ""
  );
}

function obterCondominioNome(
  usuario,
  condominio
) {
  return (
    usuario?.condominio_nome ||
    usuario?.condominioNome ||
    condominio?.nome ||
    ""
  );
}

/* =========================================================
   CRIAR CONTA DA SESSÃO
========================================================= */

function criarContaDoUsuario(
  usuario,
  firebaseUser,
  condominio = null
) {
  const role =
    obterPerfilUsuario(usuario);

  return {
    id:
      obterIdRegistro(usuario) ||
      firebaseUser?.uid ||
      "",

    uid:
      firebaseUser?.uid ||
      "",

    name:
      obterNomeUsuario(usuario),

    nome:
      obterNomeUsuario(usuario),

    email:
      firebaseUser?.email ||
      usuario?.email ||
      "",

    role,

    perfil:
      usuario?.perfil ||
      role,

    telefone:
      usuario?.telefone ||
      "",

    cpf:
      usuario?.cpf ||
      "",

    bloco:
      usuario?.bloco ||
      "",

    apartamento:
      usuario?.apartamento ||
      "",

    tipoUnidade:
      usuario?.tipoUnidade ||
      "",

    unidadeId:
      usuario?.unidadeId ||
      "",

    unidade:
      usuario?.unidade ||
      null,

    condominio_id:
      obterCondominioId(
        usuario,
        condominio
      ),

    condominio_nome:
      obterCondominioNome(
        usuario,
        condominio
      ),

    ativo:
      usuario?.ativo !== false,

    foto:
      usuario?.foto ||
      firebaseUser?.photoURL ||
      "",

    dependentes:
      Array.isArray(
        usuario?.dependentes
      )
        ? usuario.dependentes
        : [],

    veiculos:
      Array.isArray(
        usuario?.veiculos
      )
        ? usuario.veiculos
        : [],

    ultimo_acesso:
      usuario?.ultimo_acesso ||
      "",
  };
}

/* =========================================================
   BUSCAR USUÁRIO POR CPF
========================================================= */

async function buscarUsuarioPorCPF(
  cpfInformado
) {
  const cpf =
    normalizarCPF(cpfInformado);

  if (cpf.length !== 11) {
    return null;
  }

  const usuariosRef =
    collection(
      db,
      "usuarios"
    );

  /* =======================================================
     CPF NORMALIZADO
  ======================================================= */

  try {
    const consultaNormalizada =
      query(
        usuariosRef,
        where(
          "cpf_normalizado",
          "==",
          cpf
        ),
        limit(1)
      );

    const resultadoNormalizado =
      await getDocs(
        consultaNormalizada
      );

    if (
      !resultadoNormalizado.empty
    ) {
      const documento =
        resultadoNormalizado.docs[0];

      return {
        id: documento.id,
        data: documento.data(),
      };
    }
  } catch (erro) {
    console.warn(
      "Aviso ao consultar cpf_normalizado:",
      erro
    );
  }

  /* =======================================================
     CPF
  ======================================================= */

  try {
    const consultaCPF =
      query(
        usuariosRef,
        where(
          "cpf",
          "==",
          cpf
        ),
        limit(1)
      );

    const resultadoCPF =
      await getDocs(
        consultaCPF
      );

    if (
      !resultadoCPF.empty
    ) {
      const documento =
        resultadoCPF.docs[0];

      return {
        id: documento.id,
        data: documento.data(),
      };
    }
  } catch (erro) {
    console.warn(
      "Aviso ao consultar cpf:",
      erro
    );
  }

  return null;
}

/* =========================================================
   BUSCAR USUÁRIO PELO UID
========================================================= */

async function buscarUsuarioPorUID(
  uid
) {
  if (!uid) {
    return null;
  }

  const referencia =
    doc(
      db,
      "usuarios",
      uid
    );

  const documento =
    await getDoc(
      referencia
    );

  if (!documento.exists()) {
    return null;
  }

  return {
    id: documento.id,
    data: documento.data(),
  };
}

/* =========================================================
   BUSCAR CONDOMÍNIO
========================================================= */

async function buscarCondominio(
  usuario,
  condominioSelecionado
) {
  const condominioIdSelecionado =
    condominioSelecionado?.id ||
    "";

  const condominioIdUsuario =
    usuario?.condominio_id ||
    usuario?.condominioId ||
    "";

  if (!condominioIdUsuario) {
    return null;
  }

  if (!condominioIdSelecionado) {
    return null;
  }

  if (
    String(
      condominioIdUsuario
    ) !==
    String(
      condominioIdSelecionado
    )
  ) {
    return null;
  }

  const referencia =
    doc(
      db,
      "condominios",
      String(
        condominioIdUsuario
      )
    );

  const documento =
    await getDoc(
      referencia
    );

  if (!documento.exists()) {
    return null;
  }

  return {
    id: documento.id,
    ...documento.data(),
  };
}

/* =========================================================
   PROVIDER
========================================================= */

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  /* =======================================================
     RESTAURAR SESSÃO
  ======================================================= */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          console.log(
            "[AUTH] Estado Firebase:",
            firebaseUser
              ? "autenticado"
              : "desconectado"
          );

          if (!firebaseUser) {
            setUser(null);
            setCarregando(false);
            return;
          }

          try {
            console.log(
              "[AUTH] UID autenticado:",
              firebaseUser.uid
            );

            const usuarioEncontrado =
              await buscarUsuarioPorUID(
                firebaseUser.uid
              );

            if (
              !usuarioEncontrado
            ) {
              console.error(
                "[AUTH] Documento usuarios/{UID} não encontrado."
              );

              await signOut(auth);
              setUser(null);
              return;
            }

            const dados =
              usuarioEncontrado.data;

            console.log(
              "[AUTH] Documento do usuário encontrado:",
              dados
            );

            if (
              !usuarioEstaAtivo(
                dados
              )
            ) {
              console.error(
                "[AUTH] Usuário está inativo."
              );

              await signOut(auth);
              setUser(null);
              return;
            }

            const role =
              obterPerfilUsuario(
                dados
              );

            console.log(
              "[AUTH] Perfil identificado:",
              role
            );

            const account =
              criarContaDoUsuario(
                {
                  ...dados,
                  id: usuarioEncontrado.id,
                },
                firebaseUser
              );

            setUser(account);
          } catch (erro) {
            console.error(
              "[AUTH] Erro ao restaurar sessão:",
              erro
            );

            await signOut(auth);
            setUser(null);
          } finally {
            setCarregando(false);
          }
        }
      );

    return unsubscribe;
  }, []);

  /* =======================================================
     LOGIN
  ======================================================= */

  async function login(
    identificador,
    password,
    condominioSelecionado = null
  ) {
    const valor =
      String(
        identificador || ""
      ).trim();

    const senha =
      String(
        password || ""
      );

    if (!valor) {
      throw new Error(
        "Informe seu CPF ou e-mail."
      );
    }

    if (!senha) {
      throw new Error(
        "Informe sua senha."
      );
    }

    let firebaseUser =
      null;

    let usuarioFirestore =
      null;

    try {
      console.log(
        "[LOGIN] Iniciando login:",
        valor.includes("@")
          ? "e-mail"
          : "CPF"
      );

      /* ===================================================
         E-MAIL
      =================================================== */

      if (
        valor.includes("@")
      ) {
        const email =
          normalizarEmail(
            valor
          );

        console.log(
          "[LOGIN] Autenticando e-mail no Firebase..."
        );

        const resultado =
          await signInWithEmailAndPassword(
            auth,
            email,
            senha
          );

        firebaseUser =
          resultado.user;

        console.log(
          "[LOGIN] Firebase autenticou. UID:",
          firebaseUser.uid
        );

        usuarioFirestore =
          await buscarUsuarioPorUID(
            firebaseUser.uid
          );
      }

      /* ===================================================
         CPF
      =================================================== */

      else {
        console.log(
          "[LOGIN] Buscando usuário pelo CPF..."
        );

        const usuarioEncontrado =
          await buscarUsuarioPorCPF(
            valor
          );

        if (
          !usuarioEncontrado
        ) {
          throw new Error(
            "CPF não encontrado."
          );
        }

        const dados =
          usuarioEncontrado.data;

        if (
          !usuarioEstaAtivo(
            dados
          )
        ) {
          throw new Error(
            "Usuário inativo."
          );
        }

        const emailUsuario =
          normalizarEmail(
            dados?.email
          );

        if (!emailUsuario) {
          throw new Error(
            "O usuário não possui e-mail cadastrado."
          );
        }

        console.log(
          "[LOGIN] CPF localizado. Autenticando e-mail vinculado..."
        );

        const resultado =
          await signInWithEmailAndPassword(
            auth,
            emailUsuario,
            senha
          );

        firebaseUser =
          resultado.user;

        usuarioFirestore =
          await buscarUsuarioPorUID(
            firebaseUser.uid
          );
      }

      /* ===================================================
         DOCUMENTO FIRESTORE
      =================================================== */

      if (
        !usuarioFirestore
      ) {
        throw new Error(
          "A conta foi autenticada no Firebase, mas o cadastro correspondente não foi encontrado em usuarios."
        );
      }

      const dados =
        usuarioFirestore.data;

      console.log(
        "[LOGIN] Cadastro Firestore:",
        dados
      );

      /* ===================================================
         ATIVO
      =================================================== */

      if (
        !usuarioEstaAtivo(
          dados
        )
      ) {
        throw new Error(
          "Usuário está inativo."
        );
      }

      /* ===================================================
         PERFIL
      =================================================== */

      const role =
        obterPerfilUsuario(
          dados
        );

      console.log(
        "[LOGIN] Perfil final:",
        role
      );

      /* ===================================================
         SUPER ADMIN
      =================================================== */

      if (
        role ===
        "super_admin"
      ) {
        console.log(
          "[LOGIN] SUPER ADMIN RECONHECIDO."
        );

        /*
         * Super Admin não usa condomínio.
         */

        if (
          condominioSelecionado
        ) {
          await signOut(auth);

          throw new Error(
            "O Super Admin não deve selecionar um condomínio."
          );
        }

        const account =
          criarContaDoUsuario(
            {
              ...dados,
              id: usuarioFirestore.id,
            },
            firebaseUser,
            null
          );

        const agora =
          new Date().toISOString();

        account.ultimo_acesso =
          agora;

        try {
          await updateDoc(
            doc(
              db,
              "usuarios",
              firebaseUser.uid
            ),
            {
              ultimo_acesso:
                agora,
            }
          );
        } catch (
          erroUltimoAcesso
        ) {
          console.warn(
            "[LOGIN] Não foi possível atualizar ultimo_acesso:",
            erroUltimoAcesso
          );
        }

        setUser(account);

        console.log(
          "[LOGIN] Login do Super Admin concluído."
        );

        return account;
      }

      /* ===================================================
         DEMAIS PERFIS
      =================================================== */

      if (
        !condominioSelecionado
      ) {
        console.log(
          "[LOGIN] Usuário não é Super Admin e não selecionou condomínio."
        );

        await signOut(auth);

        return null;
      }

      /* ===================================================
         CONDOMÍNIO DO USUÁRIO
      =================================================== */

      const condominioIdUsuario =
        dados?.condominio_id ||
        dados?.condominioId ||
        "";

      if (!condominioIdUsuario) {
        await signOut(auth);

        throw new Error(
          "Este usuário ainda não possui um condomínio vinculado."
        );
      }

      /* ===================================================
         VALIDAR CONDOMÍNIO
      =================================================== */

      if (
        String(
          condominioIdUsuario
        ) !==
        String(
          condominioSelecionado.id
        )
      ) {
        await signOut(auth);

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

      if (
        !condominioEncontrado
      ) {
        await signOut(auth);

        throw new Error(
          "O condomínio selecionado não foi encontrado."
        );
      }

      /* ===================================================
         CONTA
      =================================================== */

      const account =
        criarContaDoUsuario(
          {
            ...dados,
            id: usuarioFirestore.id,
          },
          firebaseUser,
          condominioEncontrado
        );

      const agora =
        new Date().toISOString();

      account.ultimo_acesso =
        agora;

      try {
        await updateDoc(
          doc(
            db,
            "usuarios",
            firebaseUser.uid
          ),
          {
            ultimo_acesso:
              agora,
          }
        );
      } catch (
        erroUltimoAcesso
      ) {
        console.warn(
          "[LOGIN] Não foi possível atualizar ultimo_acesso:",
          erroUltimoAcesso
        );
      }

      setUser(account);

      console.log(
        "[LOGIN] Login concluído:",
        account.role
      );

      return account;
    } catch (error) {
      console.error(
        "[LOGIN] Falha:",
        error
      );

      try {
        await signOut(auth);
      } catch {
        // Ignora erro de logout durante a falha.
      }

      /*
       * Erros reais de autenticação são lançados
       * para que o Login.jsx não transforme tudo
       * em "selecione um condomínio".
       */
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
        "Erro ao sair:",
        error
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

    isAdmin:
      user?.role === "admin",

    isMorador:
      user?.role === "morador",

    isSindico:
      user?.role === "sindico",

    isPortaria:
      user?.role === "portaria",

    isSuperAdmin:
      user?.role === "super_admin",

    condominioId:
      user?.condominio_id ||
      "",

    condominioNome:
      user?.condominio_nome ||
      "",

    unidadeId:
      user?.unidadeId ||
      "",

    apartamento:
      user?.apartamento ||
      "",

    bloco:
      user?.bloco ||
      "",

    perfil:
      user?.perfil ||
      "",

    telefone:
      user?.telefone ||
      "",

    cpf:
      user?.cpf ||
      "",

    nome:
      user?.nome ||
      user?.name ||
      "",

    dependentes:
      user?.dependentes ||
      [],

    veiculos:
      user?.veiculos ||
      [],

    ativo:
      user?.ativo !== false,
  };

  return (
    <AuthContext.Provider
      value={valor}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export default function useAuth() {
  return useContext(
    AuthContext
  );
}