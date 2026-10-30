
import { auth } from "@/auth/firebase";

const API_URL =
  "https://morada-oficial-api.vlgmaycon1.workers.dev";

const SUPER_ADMIN_UID =
  "sr6kVVHbavZQqpqbTDfwaaccmgh2";

export async function criarContaAdminTemporaria({
  condominioId,
  email,
  nome,
}) {
  const usuarioAtual = auth.currentUser;

  if (!usuarioAtual) {
    throw new Error(
      "Sua sessão expirou. Entre novamente no Morada Oficial."
    );
  }

  if (usuarioAtual.uid !== SUPER_ADMIN_UID) {
    throw new Error(
      "Somente o Super Admin pode criar acessos administrativos."
    );
  }

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

  const token = await usuarioAtual.getIdToken(true);

  let resposta;

  try {
    resposta = await fetch(`${API_URL}/admin/create-user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        condominioId: idNormalizado,
        email: emailNormalizado,
        nome: nomeNormalizado,
      }),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao serviço de criação de usuários."
    );
  }

  const resultado = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const mensagens = {
      EMAIL_EXISTS:
        "Já existe uma conta com esse e-mail no Firebase Authentication.",

      AUTH_REQUIRED:
        "Sua sessão não foi identificada. Entre novamente.",

      INVALID_SESSION:
        "Sua sessão expirou ou não é válida. Entre novamente.",

      NOT_AUTHORIZED:
        "Esta operação é permitida somente ao Super Admin.",

      SERVER_NOT_CONFIGURED:
        "O serviço ainda não está completamente configurado.",

      GOOGLE_PERMISSION_DENIED:
        "O Google Cloud não autorizou a criação da conta. Precisamos revisar as permissões do serviço.",

      GOOGLE_OAUTH_FAILED:
        "Não foi possível autenticar o serviço do Google.",

      FIREBASE_CREATE_FAILED:
        "O Firebase não conseguiu criar a conta administrativa.",

      INVALID_EMAIL:
        "O e-mail do responsável administrativo é inválido.",

      INVALID_CONDO_ID:
        "O identificador do condomínio está ausente ou inválido.",

      CONDO_NOT_FOUND:
        "O condomínio não foi encontrado no Firestore.",

      CONDO_ADMIN_DATA_MISSING:
        "O condomínio precisa ter nome, nome do responsável e e-mail administrativo cadastrados.",

      ADMIN_ALREADY_CREATED:
        "Este condomínio já possui um acesso administrativo registrado.",

      PROFILE_CREATE_FAILED:
        "A conta foi iniciada, mas não foi possível criar o perfil administrativo. Verifique o Firebase antes de tentar novamente.",

      FIRESTORE_READ_FAILED:
        "Não foi possível consultar os dados do condomínio no Firestore.",

      CONDO_ACCESS_UPDATE_FAILED:
        "Não foi possível atualizar os dados de controle do acesso administrativo.",

      INVALID_JSON:
        "O serviço recebeu dados inválidos.",
    };

    throw new Error(
      mensagens[resultado.error] ||
        "Não foi possível criar a conta administrativa."
    );
  }

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
