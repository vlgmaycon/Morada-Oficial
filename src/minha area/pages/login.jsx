import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import {
  Eye,
  EyeOff,
} from "lucide-react";

import { auth, db } from "@/auth/firebase";
import logoLogin from "@/assets/logo-morada-admin.png";

export default function MinhaAreaLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(evento) {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setCarregando(true);

    try {
      // 1. Autentica no Firebase
      const resultado = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        senha
      );

      const usuario = resultado.user;

      // 2. Busca o documento desse usuário
      const referencia = doc(
        db,
        "usuarios",
        usuario.uid
      );

      const documento = await getDoc(referencia);

      // 3. Se não existe cadastro de permissão,
      // encerra a sessão
      if (!documento.exists()) {
        await signOut(auth);

        setErro(
          "Esta conta não possui acesso à Minha Área."
        );

        return;
      }

      const dados = documento.data();

      // 4. Verifica se é realmente super_admin
      const autorizado =
        dados.role === "super_admin" &&
        dados.ativo === true;

      if (!autorizado) {
        await signOut(auth);

        setErro(
          "Esta conta não possui permissão para acessar esta área."
        );

        return;
      }

      // 5. Tudo certo: entra na Minha Área
      navigate("/minha-area", {
        replace: true,
      });
    } catch (erroFirebase) {
      console.error(
        "Erro no login da Minha Área:",
        erroFirebase
      );

      if (
        erroFirebase.code ===
        "auth/invalid-credential"
      ) {
        setErro(
          "E-mail ou senha inválidos."
        );
      } else if (
        erroFirebase.code ===
        "auth/too-many-requests"
      ) {
        setErro(
          "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente."
        );
      } else {
        setErro(
          "Não foi possível realizar o acesso. Tente novamente."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F6F1] px-6 py-8">
      <div className="w-full max-w-md rounded-3xl border border-[#E8E5DD] bg-white p-10 shadow-xl">

        {/* LOGO */}
        <div className="mb-8 flex justify-center">
          <img
            src={logoLogin}
            alt="Morada"
            className="w-56"
          />
        </div>

        {/* TÍTULO */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#595959]">
            Minha Área
          </h1>

          <p className="mt-2 text-sm text-[#8A8A8A]">
            Acesso restrito à administração da plataforma.
          </p>
        </div>

        {/* ERRO */}
        {erro && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* E-MAIL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#595959]">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(evento) =>
                setEmail(evento.target.value)
              }
              placeholder="Digite seu e-mail"
              autoComplete="username"
              required
              disabled={carregando}
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-[#595959] outline-none transition placeholder:text-gray-400 focus:border-[#6F8D7A] focus:ring-2 focus:ring-[#6F8D7A]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>

          {/* SENHA */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#595959]">
              Senha
            </label>

            <div className="relative">
              <input
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                value={senha}
                onChange={(evento) =>
                  setSenha(evento.target.value)
                }
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
                disabled={carregando}
                className="w-full rounded-xl border border-gray-300 bg-white p-3 pr-12 text-[#595959] outline-none transition placeholder:text-gray-400 focus:border-[#6F8D7A] focus:ring-2 focus:ring-[#6F8D7A]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(!mostrarSenha)
                }
                disabled={carregando}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8A8A8A] transition hover:bg-[#F7F6F1] hover:text-[#6F8D7A]"
                aria-label={
                  mostrarSenha
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {mostrarSenha ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={carregando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6F8D7A] py-3 font-semibold text-white shadow-sm transition hover:bg-[#5F7D6A] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}

            {carregando
              ? "Verificando..."
              : "Entrar"}
          </button>
        </form>

        {/* AVISO */}
        <div className="mt-6 rounded-2xl bg-[#F3F6F4] p-4 text-center">
          <p className="text-xs leading-5 text-[#8A8A8A]">
            Esta área é exclusiva para o administrador da plataforma Morada.
          </p>
        </div>

      </div>
    </div>
  );
}