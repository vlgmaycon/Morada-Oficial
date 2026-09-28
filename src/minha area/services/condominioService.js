import { db } from "@/auth/firebase";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

const CONDOMINIOS_COLLECTION = "condominios";

// LISTAR TODOS
export async function listarCondominios() {
  const q = query(
    collection(db, CONDOMINIOS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// BUSCAR UM
export async function buscarCondominio(id) {
  const referencia = doc(db, CONDOMINIOS_COLLECTION, id);

  const snapshot = await getDoc(referencia);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

// CRIAR
export async function criarCondominio(dados) {
  return await addDoc(collection(db, CONDOMINIOS_COLLECTION), {
    ...dados,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// EDITAR
export async function editarCondominio(id, dados) {
  const referencia = doc(db, CONDOMINIOS_COLLECTION, id);

  return await updateDoc(referencia, {
    ...dados,
    updatedAt: serverTimestamp(),
  });
}

// EXCLUIR
export async function excluirCondominio(id) {
  const referencia = doc(db, CONDOMINIOS_COLLECTION, id);

  return await deleteDoc(referencia);
}