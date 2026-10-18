"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { SafeReturnTo } from "@/lib/return-to";
import { AlertModal } from "@/components/ui/AlertModal";

type Props = {
  mode?: string;
  token?: string;
  returnTo: SafeReturnTo;
};

export function LoginForm({ mode, token, returnTo }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"login" | "forgot" | "reset">(
    mode === "reset" && token ? "reset" : "login"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await authClient.signIn.username({
        username,
        password,
        rememberMe,
      });
      if (authError) {
        setError("Nome de utilizador ou palavra-passe incorretos.");
        return;
      }
      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("Nome de utilizador ou palavra-passe incorretos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: requestError } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/login?mode=reset",
      });
      if (requestError) {
        setError("Não foi possível processar o pedido. Tente novamente mais tarde.");
        return;
      }
      setForgotSuccess(true);
    } catch {
      setError("Não foi possível processar o pedido. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    if (!token) {
      setError("O link de redefinição é inválido ou expirou.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await authClient.resetPassword({
        token,
        newPassword,
      });
      if (resetError) {
        setError("Erro ao redefinir a palavra-passe. O token pode ter expirado.");
        return;
      }
      setResetSuccess(true);
    } catch {
      setError("Erro ao redefinir a palavra-passe. O token pode ter expirado.");
    } finally {
      setLoading(false);
    }
  }

  if (resetSuccess) {
    return (
      <div className="text-center">
        <svg
          className="mx-auto mb-4 h-12 w-12 text-fpn-gold"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mb-4 text-fpn-snow">Palavra-passe redefinida com sucesso.</p>
        <button
          onClick={() => {
            setView("login");
            setResetSuccess(false);
          }}
          className="rounded-lg bg-fpn-red px-4 py-2 text-white transition-colors hover:bg-fpn-red-dark"
        >
          Voltar ao início de sessão
        </button>
      </div>
    );
  }

  if (view === "reset") {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        {error && (
          <AlertModal
            message={error}
            kind="error"
            onClose={() => setError("")}
          />
        )}
        <h2 className="mb-2 text-center text-xl font-bold text-fpn-cream">
          Redefinir palavra-passe
        </h2>

        <div>
          <label htmlFor="new-password" className="mb-1 block text-sm text-fpn-cream">
            Nova palavra-passe
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              aria-invalid={!!error}
              className="w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 pr-10 text-white placeholder-white/40 focus:border-fpn-gold focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/60 hover:text-white"
              aria-label={showNewPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
            >
              {showNewPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1 block text-sm text-fpn-cream">
            Confirmar palavra-passe
          </label>
          <input
            id="confirm-password"
            type={showNewPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            aria-invalid={!!error}
            className="w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:border-fpn-gold focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-fpn-red px-4 py-2 font-semibold text-white transition-colors hover:bg-fpn-red-dark disabled:opacity-60"
        >
          {loading ? "A processar..." : "Redefinir palavra-passe"}
        </button>
      </form>
    );
  }

  if (view === "forgot") {
    return (
      <div className="space-y-4">
        {error && (
          <AlertModal
            message={error}
            kind="error"
            onClose={() => setError("")}
          />
        )}
        {forgotSuccess ? (
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-fpn-gold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="mb-4 text-fpn-snow">
              Se o email existir, receberá um link de redefinição.
            </p>
            <button
              onClick={() => setView("login")}
              className="text-sm text-fpn-gold underline hover:text-fpn-cream"
            >
              Voltar ao início de sessão
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <h2 className="mb-2 text-center text-xl font-bold text-fpn-cream">
              Recuperar palavra-passe
            </h2>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-fpn-cream">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-invalid={!!error}
                className="w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:border-fpn-gold focus:outline-none"
                placeholder="o.seu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-fpn-red px-4 py-2 font-semibold text-white transition-colors hover:bg-fpn-red-dark disabled:opacity-60"
            >
              {loading ? "A processar..." : "Enviar link de recuperação"}
            </button>

            <button
              type="button"
              onClick={() => setView("login")}
              className="w-full pt-1 text-center text-sm text-fpn-gold underline hover:text-fpn-cream"
            >
              Voltar ao início de sessão
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <AlertModal
          message={error}
          kind="error"
          onClose={() => setError("")}
        />
      )}
      <div className="mb-4 text-center">
        <svg
          className="mx-auto mb-2 h-12 w-12 text-fpn-gold"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <h1 className="text-2xl font-bold text-fpn-cream">FPN</h1>
        <p className="text-sm text-fpn-snow/70">Fábrica do Pai Natal</p>
      </div>

      <div>
        <label htmlFor="username" className="mb-1 block text-sm text-fpn-cream">
          Nome de utilizador
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          aria-invalid={!!error}
          className="w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:border-fpn-gold focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-fpn-cream">
          Palavra-passe
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            aria-invalid={!!error}
            className="w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 pr-10 text-white placeholder-white/40 focus:border-fpn-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/60 hover:text-white"
            aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="remember-me"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-fpn-gold/30 bg-white/10 accent-fpn-red"
        />
        <label htmlFor="remember-me" className="text-sm text-fpn-snow/80">
          Manter sessão iniciada
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-fpn-red px-4 py-2 font-semibold text-white transition-colors hover:bg-fpn-red-dark disabled:opacity-60"
      >
        {loading ? "A processar..." : "Iniciar sessão"}
      </button>

      <button
        type="button"
        onClick={() => setView("forgot")}
        className="w-full pt-1 text-center text-sm text-fpn-gold underline hover:text-fpn-cream"
      >
        Esqueci-me da palavra-passe
      </button>
    </form>
  );
}
