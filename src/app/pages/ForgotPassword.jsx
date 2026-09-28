import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

import { auth } from "@/auth/firebase";
import AuthLayout from "@/app/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim()
      );
    } catch (error) {
      console.error(
        "Erro ao solicitar recuperação de senha:",
        error
      );

      // Por segurança, não informamos ao usuário
      // se o e-mail existe ou não.
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Enviaremos um link para você redefinir sua senha"
      footer={
        <Link
          to="/login"
          className="inline-flex items-center font-medium text-[#6F8D7A] hover:underline"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          Voltar para login
        </Link>
      }
    >
      {sent ? (
        <div className="text-center">
          <p className="text-sm leading-6 text-[#595959]">
            Se existir uma conta com esse e-mail,
            você receberá um link para redefinir sua
            senha em breve.
          </p>
        </div>
      ) : (
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
              Endereço de e-mail
            </label>

            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]"
                aria-hidden="true"
              />

              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-3 text-[#595959] outline-none transition placeholder:text-gray-400 focus:border-[#6F8D7A] focus:ring-2 focus:ring-[#6F8D7A]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                required
                disabled={loading}
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
                Enviando...
              </>
            ) : (
              "Enviar link de recuperação"
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}