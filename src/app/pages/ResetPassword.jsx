import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import {
  Lock,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { auth } from "@/auth/firebase";
import AuthLayout from "@/app/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get("oobCode");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificandoLink, setVerificandoLink] = useState(
    Boolean(oobCode)
  );
  const [linkValido, setLinkValido] = useState(false);

  React.useEffect(() => {
    async function verificarLink() {
      if (!oobCode) {
        setVerificandoLink(false);
        setLinkValido(false);
        return;
      }

      try {
        await verifyPasswordResetCode(auth, oobCode);

        setLinkValido(true);
      } catch (errorFirebase) {
        console.error(
          "Erro ao verificar link de redefinição:",
          errorFirebase
        );

        setLinkValido(false);
      } finally {
        setVerificandoLink(false);
      }
    }

    verificarLink();
  }, [oobCode]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (!oobCode) {
      setError(
        "O link de recuperação é inválido ou está ausente."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(
        auth,
        oobCode,
        newPassword
      );

      navigate("/login", {
        replace: true,
      });
    } catch (errorFirebase) {
      console.error(
        "Erro ao redefinir senha:",
        errorFirebase
      );

      if (
        errorFirebase.code ===
        "auth/expired-action-code"
      ) {
        setError(
          "Este link de recuperação expirou. Solicite um novo link."
        );
      } else if (
        errorFirebase.code ===
        "auth/invalid-action-code"
      ) {
        setError(
          "Este link de recuperação é inválido ou já foi utilizado."
        );
      } else if (
        errorFirebase.code ===
        "auth/weak-password"
      ) {
        setError(
          "A nova senha é muito fraca. Escolha uma senha mais segura."
        );
      } else {
        setError(
          "Não foi possível redefinir a senha. Tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (verificandoLink) {
    return (
      <AuthLayout
        title="Verificando link"
        subtitle="Aguarde enquanto verificamos seu acesso"
      >
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Loader2 className="mb-4 h-7 w-7 animate-spin text-[#6F8D7A]" />

          <p className="text-sm text-[#595959]">
            Verificando o link de recuperação...
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (!oobCode || !linkValido) {
    return (
      <AuthLayout
        title="Link inválido"
        subtitle="O link de recuperação de senha está ausente, inválido ou expirado"
        footer={
          <Link
            to="/forgot-password"
            className="font-medium text-[#6F8D7A] hover:underline"
          >
            Solicitar novo link
          </Link>
        }
      >
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F6F4]">
              <AlertTriangle className="h-7 w-7 text-[#6F8D7A]" />
            </div>
          </div>

          <p className="text-sm leading-6 text-[#595959]">
            O link utilizado não pode mais ser usado.
            Solicite um novo e-mail para redefinir sua senha.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nova senha"
      subtitle="Digite sua nova senha abaixo"
    >
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* NOVA SENHA */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-[#595959]"
          >
            Nova senha
          </label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]"
              aria-hidden="true"
            />

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              className="h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-3 text-[#595959] outline-none transition placeholder:text-gray-400 focus:border-[#6F8D7A] focus:ring-2 focus:ring-[#6F8D7A]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              required
              disabled={loading}
            />

          </div>

          <p className="mt-2 text-xs text-[#8A8A8A]">
            A senha deve ter pelo menos 6 caracteres.
          </p>
        </div>

        {/* CONFIRMAR SENHA */}
        <div>
          <label
            htmlFor="confirm"
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
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
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
              Redefinindo...
            </>
          ) : (
            "Redefinir senha"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}