import { auth } from "@/auth/firebase";

const API_URL =
  "https://morada-oficial-api.vlgmaycon1.workers.dev";

const SUPER_ADMIN_UID =
  "sr6kVVHbavZQqpqbTDfwaaccmgh2";

/* ======================================================
   MENSAGENS DE ERRO
====================================================== */

const MENSAGENS_ERRO = {
  EMAIL_EXISTS:
    "Já existe uma conta com esse e-mail no Firebase Authentication.",

  AUTH_REQUIRED:
    "Sua sessão não foi identificada. Entre novamente.",

  INVALID_SESSION:
    "Sua sessão expirou ou não é válida. Entre novamente.",

  NOT_AUTHORIZED:
    "Esta operação é permitida somente ao Super Admin.",

  SUPER_ADMIN_PROTECTED:
    "O cadastro do Super Admin não pode ser alterado por esta operação.",

  SERVER_NOT_CONFIGURED:
    "O serviço ainda não está completamente configurado.",

  GOOGLE_PERMISSION_DENIED:
    "O Google Cloud não autorizou a operação. Precisamos revisar as permissões do serviço.",

  GOOGLE_OAUTH_FAILED:
    "Não foi possível autenticar o serviço do Google.",

  FIREBASE_CREATE_FAILED:
    "O Firebase não conseguiu criar a conta administrativa.",

  INVALID_EMAIL:
    "O e-mail informado é inválido.",

  INVALID_NAME:
    "Informe um nome válido para o usuário.",

  INVALID_USER_ID:
    "Não foi possível identificar o usuário que será atualizado.",

  INVALID_CONDO_ID:
    "O identificador do condomínio está ausente ou inválido.",

  CONDO_NOT_FOUND:
    "O condomínio vinculado ao administrador não foi encontrado.",

  CONDO_ADMIN_DATA_MISSING:
    "O condomínio precisa ter nome, nome do responsável e e-mail administrativo cadastrados.",

  ADMIN_ALREADY_CREATED:
    "Este condomínio já possui um acesso administrativo registrado.",

  ADMIN_CONDO_LINK_MISMATCH:
    "O vínculo entre o administrador e o condomínio não corresponde ao cadastro atual.",

  PROFILE_CREATE_FAILED:
    "A conta foi iniciada, mas não foi possível criar o perfil administrativo. Verifique o Firebase antes de tentar novamente.",

  PROFILE_NOT_FOUND:
    "O perfil deste usuário não foi encontrado no Firestore.",

  PROFILE_NOT_EDITABLE:
    "Este tipo de perfil não pode ser alterado por esta operação.",

  FIRESTORE_READ_FAILED:
    "Não foi possível consultar os dados no Firestore.",

  FIRESTORE_UPDATE_FAILED:
    "Não foi possível atualizar os dados no Firestore.",

  FIRESTORE_SYNC_FAILED:
    "Não foi possível sincronizar os dados do usuário.",

  CONDO_ACCESS_UPDATE_FAILED:
    "Não foi possível atualizar os dados de controle do acesso administrativo.",

  AUTH_USER_LOOKUP_FAILED:
    "Não foi possível consultar a conta do usuário no Firebase Authentication.",

  AUTH_USER_NOT_FOUND:
    "A conta correspondente não foi encontrada no Firebase Authentication.",

  AUTH_EMAIL_NOT_FOUND:
    "A conta do usuário não possui um e-mail válido cadastrado.",

  AUTH_PROFILE_UPDATE_FAILED:
    "Não foi possível atualizar os dados da conta no Firebase Authentication.",

  AUTH_ROLLBACK_FAILED:
    "Ocorreu uma falha na sincronização e não foi possível restaurar os dados anteriores. Verifique o cadastro antes de tentar novamente.",

  EMAIL_SYNC_REQUIRED:
    "O e-mail do Firebase Authentication está diferente do Firestore. Atualize e sincronize o cadastro antes de enviar a redefinição de senha.",

  PASSWORD_RESET_DISABLED:
    "O envio de redefinição de senha está desabilitado no Firebase.",

  PASSWORD_RESET_SEND_FAILED:
    "Não foi possível enviar o e-mail de redefinição de senha.",

  ROLLBACK_FAILED:
    "Ocorreu uma falha ao concluir a operação. Verifique o Firebase antes de tentar novamente.",

  INVALID_JSON:
    "O serviço recebeu dados inválidos.",

  ORIGIN_NOT_ALLOWED:
    "A origem desta solicitação não está autorizada.",

  INTERNAL_ERROR:
    "Ocorreu um erro interno no serviço. Tente novamente.",
};

/* ======================================================
   VALIDAÇÃO DO SUPER ADMIN
====================================================== */

function obterUsuarioSuperAdmin() {
  const usuarioAtual = auth.currentUser;

  if (!usuarioAtual) {
    throw new Error(
      "Sua sessão expirou. Entre novamente no Morada Oficial."
    );
  }

  if (usuarioAtual.uid !== SUPER_ADMIN_UID) {
    throw new Error(
      "Somente o Super Admin pode realizar esta operação."
    );
  }

  return usuarioAtual;
}

/* ======================================================
   COMUNICAÇÃO COM O WORKER
====================================================== */

async function chamarWorker(
  rota,
  dados,
  mensagemConexao
) {
  const usuarioAtual = obterUsuarioSuperAdmin();

  const token = await usuarioAtual.getIdToken(true);

  let resposta;

  try {
    resposta = await fetch(`${API_URL}${rota}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });
  } catch {
    throw new Error(mensagemConexao);
  }

  const resultado = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(
      MENSAGENS_ERRO[resultado.error] ||
        "Não foi possível concluir a operação no serviço Morada Oficial."
    );
  }

  return resultado;
}

/* ======================================================
   CRIAR CONTA ADMINISTRATIVA TEMPORÁRIA
====================================================== */

export async function criarContaAdminTemporaria({
  condominioId,
  email,
  nome,
}) {
  const idNormalizado = String(condominioId || "").trim();

  const emailNormalizado = String(email || "")
    .trim()
    .toLowerCase();

  const nomeNormalizado = String(nome || "").trim();

  if (!idNormalizado) {
    throw new Error(
      "Não foi possível identificar o condomínio para vincular o administrador."
    );
  }

  if (!emailNormalizado) {
    throw new Error(
      "Informe o e-mail do responsável administrativo."
    );
  }

  if (!nomeNormalizado) {
    throw new Error(
      "Informe o nome do responsável administrativo."
    );
  }

  const resultado = await chamarWorker(
    "/admin/create-user",
    {
      condominioId: idNormalizado,
      email: emailNormalizado,
      nome: nomeNormalizado,
    },
    "Não foi possível conectar ao serviço de criação de usuários."
  );

  if (!resultado.uid || !resultado.senhaTemporaria) {
    throw new Error(
      "O serviço respondeu sem confirmar os dados de acesso."
    );
  }

  return {
    uid: resultado.uid,
    email: resultado.email,
    senhaTemporaria: resultado.senhaTemporaria,
    trocaSenhaObrigatoria:
      resultado.trocaSenhaObrigatoria === true,
  };
}

/* ======================================================
   ATUALIZAR CADASTRO DE USUÁRIO EXISTENTE
   Atualiza o mesmo UID no Authentication e Firestore.
====================================================== */

export async function atualizarUsuarioAdministrativo({
  uid,
  email,
  nome,
}) {
  const uidNormalizado = String(uid || "").trim();

  const emailNormalizado = String(email || "")
    .trim()
    .toLowerCase();

  const nomeNormalizado = String(nome || "").trim();

  if (!uidNormalizado) {
    throw new Error(
      "Não foi possível identificar o usuário que será atualizado."
    );
  }

  if (!emailNormalizado) {
    throw new Error("Informe o novo e-mail do usuário.");
  }

  if (!nomeNormalizado) {
    throw new Error("Informe o nome do usuário.");
  }

  const resultado = await chamarWorker(
    "/admin/update-user",
    {
      uid: uidNormalizado,
      email: emailNormalizado,
      nome: nomeNormalizado,
    },
    "Não foi possível conectar ao serviço de atualização de usuários."
  );

  if (!resultado.uid || !resultado.email) {
    throw new Error(
      "O serviço não confirmou a atualização do cadastro."
    );
  }

  return {
    uid: resultado.uid,
    email: resultado.email,
    nome: resultado.nome,
    perfil: resultado.perfil,
  };
}

/* ======================================================
   ENVIAR E-MAIL DE REDEFINIÇÃO DE SENHA
   O Worker identifica o e-mail pela conta existente.
====================================================== */

export async function enviarRedefinicaoSenha({ uid }) {
  const uidNormalizado = String(uid || "").trim();

  if (!uidNormalizado) {
    throw new Error(
      "Não foi possível identificar o usuário para redefinir a senha."
    );
  }

  const resultado = await chamarWorker(
    "/admin/send-password-reset",
    {
      uid: uidNormalizado,
    },
    "Não foi possível conectar ao serviço de redefinição de senha."
  );

  if (!resultado.enviado || !resultado.email) {
    throw new Error(
      "O serviço não confirmou o envio do e-mail de redefinição."
    );
  }

  return {
    uid: resultado.uid,
    email: resultado.email,
    enviado: true,
  };
}