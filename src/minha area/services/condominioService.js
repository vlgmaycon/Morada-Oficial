import { db } from "@/auth/firebase";

import {
  excluirUsuarioAdministrativo,
} from "@/auth/moradaApi";

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

const CONDOMINIOS_COLLECTION = "condominios";
const CATALOGO_PUBLICO_COLLECTION = "condominios_publicos";

/* ======================================================
   UTILITÁRIOS
====================================================== */

function normalizarEmail(valor = "") {
  return String(valor).trim().toLowerCase();
}

function normalizarTexto(valor = "") {
  return String(valor || "").trim();
}

function gerarIdentificadorAdministrativo(nome = "") {
  const nomeNormalizado = String(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return `admin+${nomeNormalizado || "condominio"}`;
}

/*
 * O catálogo público contém somente os campos necessários
 * para localizar um condomínio na tela de login.
 *
 * Dados pessoais e administrativos permanecem privados.
 */

function criarDadosPublicos(dados = {}) {
  return {
    nome: normalizarTexto(dados.nome) || "Condomínio sem nome",

    endereco:
      typeof dados.endereco === "string"
        ? dados.endereco
        : String(dados.endereco?.rua || ""),

    numero: String(dados.numero || ""),
    bairro: String(dados.bairro || ""),
    cidade: String(dados.cidade || ""),
    estado: String(dados.estado || ""),
    cep: String(dados.cep || ""),
    ativo: dados.ativo !== false,
  };
}

/* ======================================================
   LISTAR TODOS OS CONDOMÍNIOS PRIVADOS
   Uso previsto: Minha Área / Super Admin.
====================================================== */

export async function listarCondominios() {
  const consulta = query(
    collection(db, CONDOMINIOS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(consulta);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

/* ======================================================
   BUSCAR UM CONDOMÍNIO PRIVADO
====================================================== */

export async function buscarCondominio(id) {
  const referencia = doc(
    db,
    CONDOMINIOS_COLLECTION,
    id
  );

  const snapshot = await getDoc(referencia);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/* ======================================================
   CRIAR CONDOMÍNIO
   Grava o documento privado e o catálogo público.
====================================================== */

export async function criarCondominio(dados) {
  const nome = normalizarTexto(dados?.nome);

  const nomeResponsavelAdmin = normalizarTexto(
    dados?.nomeResponsavelAdmin
  );

  const emailResponsavelAdmin = normalizarEmail(
    dados?.emailResponsavelAdmin
  );

  if (!nome) {
    throw new Error("Informe o nome do condomínio.");
  }

  if (!nomeResponsavelAdmin) {
    throw new Error(
      "Informe o nome do responsável administrativo."
    );
  }

  if (!emailResponsavelAdmin) {
    throw new Error(
      "Informe o e-mail do responsável administrativo."
    );
  }

  /*
   * Os metadados administrativos são definidos pelo serviço,
   * não pelos valores recebidos diretamente do formulário.
   */

  const {
    acessoAdministrativo: _acessoInformado,
    ...dadosCondominio
  } = dados;

  const referenciaPrivada = doc(
    collection(db, CONDOMINIOS_COLLECTION)
  );

  const referenciaPublica = doc(
    db,
    CATALOGO_PUBLICO_COLLECTION,
    referenciaPrivada.id
  );

  const dadosPrivados = {
    ...dadosCondominio,

    nome,

    nomeResponsavelAdmin,

    email: normalizarEmail(dadosCondominio.email),

    emailResponsavelAdmin,

    acessoAdministrativo: {
      identificador: gerarIdentificadorAdministrativo(nome),

      status: "pendente",

      nomeResponsavelAdmin,

      emailResponsavelAdmin,

      adminUid: null,

      primeiroAcessoConcluido: false,
    },

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);

  batch.set(referenciaPrivada, dadosPrivados);

  batch.set(
    referenciaPublica,
    criarDadosPublicos(dadosPrivados)
  );

  await batch.commit();

  return {
    id: referenciaPrivada.id,
  };
}

/* ======================================================
   EDITAR CONDOMÍNIO
   Mantém sincronizado o catálogo público.
====================================================== */

export async function editarCondominio(id, dados) {
  const referenciaPrivada = doc(
    db,
    CONDOMINIOS_COLLECTION,
    id
  );

  const snapshot = await getDoc(referenciaPrivada);

  if (!snapshot.exists()) {
    throw new Error(
      "Condomínio não encontrado para edição."
    );
  }

  const dadosAtuais = snapshot.data();

  const {
    acessoAdministrativo: _acessoInformado,
    ...dadosRecebidos
  } = dados;

  const dadosAtualizacao = {
    ...dadosRecebidos,
  };

  if (dadosRecebidos.nome !== undefined) {
    dadosAtualizacao.nome = normalizarTexto(
      dadosRecebidos.nome
    );
  }

  if (dadosRecebidos.nomeResponsavelAdmin !== undefined) {
    dadosAtualizacao.nomeResponsavelAdmin = normalizarTexto(
      dadosRecebidos.nomeResponsavelAdmin
    );
  }

  if (dadosRecebidos.emailResponsavelAdmin !== undefined) {
    dadosAtualizacao.emailResponsavelAdmin = normalizarEmail(
      dadosRecebidos.emailResponsavelAdmin
    );
  }

  if (dadosRecebidos.email !== undefined) {
    dadosAtualizacao.email = normalizarEmail(
      dadosRecebidos.email
    );
  }

  const dadosAtualizados = {
    ...dadosAtuais,
    ...dadosAtualizacao,
  };

  const acessoAtual = dadosAtuais.acessoAdministrativo;

  /*
   * Enquanto o acesso estiver pendente, mantém os metadados
   * administrativos sincronizados com os dados do condomínio.
   *
   * Um acesso já configurado não é recriado automaticamente.
   */

  if (!acessoAtual || acessoAtual.status === "pendente") {
    const nomeResponsavelAdmin = normalizarTexto(
      dadosAtualizados.nomeResponsavelAdmin ||
        acessoAtual?.nomeResponsavelAdmin
    );

    const emailResponsavelAdmin = normalizarEmail(
      dadosAtualizados.emailResponsavelAdmin ||
        acessoAtual?.emailResponsavelAdmin
    );

    dadosAtualizacao.acessoAdministrativo = {
      ...(acessoAtual || {}),

      identificador: gerarIdentificadorAdministrativo(
        dadosAtualizados.nome
      ),

      status: acessoAtual?.status || "pendente",

      nomeResponsavelAdmin,

      emailResponsavelAdmin,

      adminUid: acessoAtual?.adminUid ?? null,

      primeiroAcessoConcluido:
        acessoAtual?.primeiroAcessoConcluido ?? false,
    };

    dadosAtualizados.acessoAdministrativo =
      dadosAtualizacao.acessoAdministrativo;
  }

  dadosAtualizacao.updatedAt = serverTimestamp();

  const referenciaPublica = doc(
    db,
    CATALOGO_PUBLICO_COLLECTION,
    id
  );

  const batch = writeBatch(db);

  batch.update(referenciaPrivada, dadosAtualizacao);

  batch.set(
    referenciaPublica,
    criarDadosPublicos(dadosAtualizados)
  );

  await batch.commit();

  return {
    id,
  };
}

/* ======================================================
   EXCLUIR CONDOMÍNIO
   Remove também o administrador principal vinculado.
====================================================== */

export async function excluirCondominio(id) {
  if (!id) {
    throw new Error(
      "Não foi possível identificar o condomínio para exclusão."
    );
  }

  const referenciaPrivada = doc(
    db,
    CONDOMINIOS_COLLECTION,
    id
  );

  const referenciaPublica = doc(
    db,
    CATALOGO_PUBLICO_COLLECTION,
    id
  );

  /*
   * Primeiro consulta o documento privado para identificar
   * o administrador principal vinculado.
   */

  const snapshot = await getDoc(referenciaPrivada);

  if (!snapshot.exists()) {
    throw new Error(
      "O condomínio não foi encontrado para exclusão."
    );
  }

  const dadosCondominio = snapshot.data();

  const adminUid = normalizarTexto(
    dadosCondominio.acessoAdministrativo?.adminUid
  );

  /*
   * Se existir administrador vinculado, solicita ao Worker
   * a exclusão da conta no Authentication e do perfil no
   * Firestore.
   *
   * Se o Worker não concluir a exclusão, o condomínio
   * permanece cadastrado.
   */

  if (adminUid) {
    await excluirUsuarioAdministrativo({
      uid: adminUid,
    });
  }

  /*
   * Depois que o acesso administrativo for tratado,
   * remove o condomínio privado e seu catálogo público.
   */

  const batch = writeBatch(db);

  batch.delete(referenciaPrivada);

  batch.delete(referenciaPublica);

  await batch.commit();

  return {
    id,
    administradorExcluido: Boolean(adminUid),
  };
}