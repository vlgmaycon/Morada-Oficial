import { db } from "@/auth/firebase";

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

const CHAMADOS_COLLECTION = "chamados";

/* =========================================================
   OBSERVAR CHAMADOS EM TEMPO REAL
========================================================= */

export function observarChamados(
  onSucesso,
  onErro
) {
  return onSnapshot(
    collection(db, CHAMADOS_COLLECTION),
    (snapshot) => {
      const chamados = snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...item.data(),
        })
      );

      chamados.sort((a, b) => {
        const dataA = obterTimestamp(
          a.createdAt
        );

        const dataB = obterTimestamp(
          b.createdAt
        );

        return dataB - dataA;
      });

      onSucesso(chamados);
    },
    (error) => {
      console.error(
        "Erro ao observar chamados:",
        error
      );

      onErro?.(error);
    }
  );
}

/* =========================================================
   RESPONDER / ATUALIZAR CHAMADO
========================================================= */

export async function atualizarChamado(
  id,
  dados
) {
  if (!id) {
    throw new Error(
      "ID do chamado não informado."
    );
  }

  const referencia = doc(
    db,
    CHAMADOS_COLLECTION,
    id
  );

  return updateDoc(referencia, {
    ...dados,
    updatedAt: serverTimestamp(),
  });
}

/* =========================================================
   UTILITÁRIO
========================================================= */

function obterTimestamp(valor) {
  if (!valor) {
    return 0;
  }

  if (
    typeof valor?.toMillis === "function"
  ) {
    return valor.toMillis();
  }

  if (valor instanceof Date) {
    return valor.getTime();
  }

  if (typeof valor === "string") {
    const data = new Date(valor);

    if (!Number.isNaN(data.getTime())) {
      return data.getTime();
    }
  }

  return 0;
}