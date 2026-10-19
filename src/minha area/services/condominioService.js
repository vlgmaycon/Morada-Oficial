
import { db } from "@/auth/firebase";

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
 * Não incluir e-mail, CPF/CNPJ, telefone, dados de acesso
 * administrativo ou outras informações privadas aqui.
 */
function criarDadosPublicos(dados = {}) {
  return {
    nome: String(dados.nome || "Condomínio sem nome").trim(),
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
  const referencia = doc(db, CONDOMINIOS_COLLECTION, id);
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
  const nome = String(dados?.nome || "").trim();

  const emailResponsavelAdmin = normalizarEmail(
    dados?.emailResponsavelAdmin
  );

  if (!nome) {
    throw new Error("Informe o nome do condomínio.");
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
    email: normalizarEmail(dadosCondominio.email),
    emailResponsavelAdmin,

    acessoAdministrativo: {
      identificador: gerarIdentificadorAdministrativo(nome),
      status: "pendente",
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
    ...dadosAtualizacao
  } = dados;

  const dadosAtualizados = {
    ...dadosAtuais,
    ...dadosAtualizacao,
  };

  const acessoAtual = dadosAtuais.acessoAdministrativo;

  /*
   * Enquanto o acesso estiver pendente, mantém o identificador
   * sincronizado com o nome e o e-mail do responsável.
   *
   * Um acesso já configurado não é recriado automaticamente
   * ao editar o condomínio.
   */
  if (!acessoAtual || acessoAtual.status === "pendente") {
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
      emailResponsavelAdmin,
      adminUid: acessoAtual?.adminUid ?? null,
      primeiroAcessoConcluido:
        acessoAtual?.primeiroAcessoConcluido ?? false,
    };
  }

  dadosAtualizacao.updatedAt = serverTimestamp();

  const referenciaPublica = doc(
    db,
    CATALOGO_PUBLICO_COLLECTION,
    id
  );

  const batch = writeBatch(db);

  batch.update(referenciaPrivada, dadosAtualizacao);

  /*
   * Substitui o catálogo por uma versão sanitizada.
   * Campos privados não são copiados para ele.
   */
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
   Remove os dois documentos do cadastro.
====================================================== */

export async function excluirCondominio(id) {
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

  const batch = writeBatch(db);

  batch.delete(referenciaPrivada);
  batch.delete(referenciaPublica);

  await batch.commit();
}
