import { auth } from "@/auth/firebase";

const API_URL =
  "https://morada-oficial-api.vlgmaycon1.workers.dev";

const SUPER_ADMIN_UID =
  "sr6kVVHbavZQqpqbTDfwaaccmgh2";

export async function criarContaAdminTemporaria({
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

  const emailNormalizado = String(email || "")
    .trim()
    .toLowerCase();

  if (!emailNormalizado) {
    throw new Error(
      "Informe o e-mail do responsável administrativo."
    );
  }

  const token = await usuarioAtual.getIdToken(true);

  let resposta;

  try {
    resposta = await fetch(
      `${API_URL}/admin/create-user`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailNormalizado,
          nome: String(nome || "").trim(),
        }),
      }
    );
  } catch {
    throw new Error(
      "Não foi possível conectar ao serviço de criação de usuários."
    );
  }

  const resultado = await resposta
    .json()
    .catch(() => ({}));

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

      FIREBASE_CREATE_FAILED:
        "O Firebase não conseguiu criar a conta administrativa.",
    };

    throw new Error(
      mensagens[resultado.error] ||
        "Não foi possível criar a conta administrativa."
    );
  }

  if (
    !resultado.uid ||
    !resultado.senhaTemporaria
  ) {
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