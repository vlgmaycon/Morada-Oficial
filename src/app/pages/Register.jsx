import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  UserPlus,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";

import { auth } from "@/auth/firebase";
import AuthLayout from "@/app/components/AuthLayout";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const resultado =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      await sendEmailVerification(resultado.user);

      setEmailSent(true);
    } catch (errorFirebase) {
      console.error(
        "Erro ao criar conta:",
        errorFirebase
      );

      if (
        errorFirebase.code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "Este e-mail já está cadastrado."
        );
      } else if (
        errorFirebase.code ===
        "auth/invalid-email"
      ) {
        setError(
          "Digite um e-mail válido."
        );
      } else if (
        errorFirebase.code ===
        "auth/weak-password"
      ) {
        setError(
          "A senha deve ter pelo menos 6 caracteres."
        );
      } else {
        setError(
          "Não foi possível criar a conta. Tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      await signInWithPopup(
        auth,
        provider
      );

      navigate("/", {
        replace: true,
      });
    } catch (errorFirebase) {
      console.error(
        "Erro no login com Google:",
        errorFirebase
      );

      if (
        errorFirebase.code ===
        "auth/popup-closed-by-user"
      ) {
        return;
      }

      setError(
        "Não foi possível continuar com o Google."
      );
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <AuthLayout
        title="Verifique seu e-mail"
        subtitle={`Enviamos um link de confirmação para ${email}`}
        footer={
          <Link
            to="/login"
            className="font-medium text-[#6F8D7A] hover:underline"
          >
            Voltar para login
          </Link>
        }
      >
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F6F4]">
              <Mail className="h-7 w-7 text-[#6F8D7A]" />
            </div>
          </div>

          <p className="text-sm leading-6 text-[#595959]">
            Confira sua caixa de entrada e clique
            no link enviado para confirmar seu
            e-mail.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 w-full rounded-xl bg-[#6F8D7A] py-3 font-semibold text-white transition hover:bg-[#5F7D6A]"
          >
            Ir para login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Criar sua conta"
      subtitle="Cadastre-se para começar"
      footer={
        <>
          Já possui uma conta?{" "}
          <Link
            to="/login"
            className="font-medium text-[#6F8D7A] hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* GOOGLE */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="mb-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-sm font-medium text-[#595959] transition hover:bg-[#F7F6F1] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.41Z"
          />
          <path
            fill="#34A853"
            d="M12 21.99c2.63 0 4.84-.87 6.45-2.31l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.03H3.26v2.52A9.75 9.75 0 0 0 12 21.99Z"
          />
          <path
            fill="#FBBC05"
            d="M6.51 14.13a5.86 5.86 0 0 1 0-3.76V7.85H3.26a9.75 9.75 0 0 0 0 8.8l3.25-2.52Z"
          />
          <path
            fill="#EA4335"
            d="M12 6.34c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.44 14.63 2.51 12 2.51a9.75 9.75 0 0 0-8.74 5.34l3.25 2.52C7.29 8.06 9.45 6.34 12 6.34Z"
          />
        </svg>

        Continuar com Google
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E8E5DD]" />
        <span className="text-xs text-[#8A8A8A]">
          ou
        </span>
        <div className="h-px flex-1 bg-[#E8E5DD]" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* E-MAIL */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[#595959]"
          >
            E-mail
          </label>

          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]"
              aria-hidden="true"
            />

            <input
              id="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-3 text-[#595959] outline-none transition placeholder:text-gray-400 focus:border-[#6F8D7A] focus:ring-2 focus:ring-[#6F8D7A]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* SENHA */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-[#595959]"
          >
            Senha
          </label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]"
              aria-hidden="true"
            />

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="new-password"
              required
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-3 text-[#595959] outline-none transition placeholder:text-gray-400 focus:border-[#6F8D7A] focus:ring-2 focus:ring-[#6F8D7A]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* CONFIRMAR SENHA */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-[#595959]"
          >
            Confirmar senha
          </label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]"
              aria-hidden="true"
            />

            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              required
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-3 text-[#595959] outline-none transition placeholder:text-gray-400 focus:border-[#6F8D7A] focus:ring-2 focus:ring-[#6F8D7A]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* BOTÃO */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6F8D7A] font-medium text-white shadow-sm transition hover:bg-[#5F7D6A] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Criar conta
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}