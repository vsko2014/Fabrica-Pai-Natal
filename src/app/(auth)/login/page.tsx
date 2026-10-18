import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSafeReturnTo } from "@/lib/return-to";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

type LoginSearchParams = Promise<{
  mode?: string;
  token?: string;
  returnTo?: string;
}>;

async function LoginFormWithSearchParams({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const [{ mode, token, returnTo }, session] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ]);
  const safeReturnTo = getSafeReturnTo(returnTo);

  if (session) {
    redirect(safeReturnTo);
  }

  return (
    <LoginForm
      mode={mode}
      token={token}
      returnTo={safeReturnTo}
    />
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  return (
    <Suspense
      fallback={<PageSkeleton variant="auth" />}
    >
      <LoginFormWithSearchParams searchParams={searchParams} />
    </Suspense>
  );
}
