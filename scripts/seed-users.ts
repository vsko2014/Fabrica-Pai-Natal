import { loadEnvConfig } from "@next/env";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

loadEnvConfig(process.cwd());

const seedUserSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  name: z.string().trim().min(1).max(100),
  email: z.email().trim(),
  password: z.string().min(8).max(100),
});

class SeedInputError extends Error {}

function loadSeedUsers() {
  const json = process.env.SEED_USERS_JSON;
  if (!json) {
    throw new SeedInputError(
      "SEED_USERS_JSON está vazio. Preenche seed-users.json com dez contas e carrega o conteúdo para a variável."
    );
  }

  let input: unknown;
  try {
    input = JSON.parse(json);
  } catch {
    throw new SeedInputError(
      "SEED_USERS_JSON não contém JSON válido. Confirma a sintaxe de seed-users.json."
    );
  }

  if (!Array.isArray(input)) {
    throw new SeedInputError(
      "SEED_USERS_JSON deve ser um array JSON com exatamente dez contas."
    );
  }

  if (input.length !== 10) {
    throw new SeedInputError(
      `Foram recebidas ${input.length} contas; são necessárias exatamente dez.`
    );
  }

  const parsedUsers = z.array(seedUserSchema).safeParse(input);
  if (!parsedUsers.success) {
    throw new SeedInputError(
      "Cada conta precisa de username válido, name, email válido e password com 8 a 100 caracteres."
    );
  }

  const users = parsedUsers.data.map((seedUser) => ({
    ...seedUser,
    username: seedUser.username.toLowerCase(),
    email: seedUser.email.toLowerCase(),
  }));

  if (
    new Set(users.map((seedUser) => seedUser.username)).size !== users.length ||
    new Set(users.map((seedUser) => seedUser.email)).size !== users.length
  ) {
    throw new SeedInputError(
      "Os nomes de utilizador e emails têm de ser únicos."
    );
  }

  return users;
}

function getErrorDetails(error: unknown): {
  code?: string;
  message?: string;
  cause?: unknown;
} {
  if (!(error instanceof Error)) {
    return {};
  }

  const candidate = error as Error & {
    code?: unknown;
    cause?: unknown;
  };
  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    message: candidate.message,
    cause: candidate.cause,
  };
}

function safeErrorMessage(error: unknown): string | undefined {
  const { message } = getErrorDetails(error);
  if (!message) return undefined;

  let safeMessage = message;
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    safeMessage = safeMessage.replaceAll(databaseUrl, "[DATABASE_URL ocultada]");
  }
  safeMessage = safeMessage
    .replace(
      /(postgres(?:ql)?:\/\/[^:\s/@]+):([^@\s/]+)@/gi,
      "$1:[palavra-passe ocultada]@"
    )
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 240);

  return safeMessage;
}

let currentStage = "validar dados e configuração";

async function main() {
  const users = loadSeedUsers();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new SeedInputError(
      "DATABASE_URL não está definida no .env.local."
    );
  }

  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new SeedInputError(
      "DATABASE_URL não é uma URL válida. Copia novamente a connection string PostgreSQL do Supabase."
    );
  }
  if (
    parsedDatabaseUrl.protocol !== "postgres:" &&
    parsedDatabaseUrl.protocol !== "postgresql:"
  ) {
    throw new SeedInputError(
      "DATABASE_URL tem de ser uma connection string PostgreSQL."
    );
  }

  currentStage = "carregar o schema e a configuração de autenticação";
  const [{ user }, { db }, { createAuth }] = await Promise.all([
    import("../src/db/schema"),
    import("../src/lib/db"),
    import("../src/lib/auth"),
  ]);
  const auth = createAuth(false);
  let failed = false;

  currentStage = "verificar ligação PostgreSQL e tabela de utilizadores";
  await db.select({ id: user.id }).from(user).limit(1);

  currentStage = "verificar contas existentes";
  for (const seedUser of users) {
    const existingUsers = await db
      .select({ username: user.username, email: user.email })
      .from(user)
      .where(
        or(
          eq(user.username, seedUser.username),
          eq(user.email, seedUser.email)
        )
      );

    if (existingUsers.length > 0) {
      const isSameAccount =
        existingUsers.length === 1 &&
        existingUsers[0].username === seedUser.username &&
        existingUsers[0].email.toLowerCase() === seedUser.email;

      if (isSameAccount) {
        console.info(`Conta já existente: ${seedUser.username}`);
      } else {
        console.error(`Conflito de identidade na conta: ${seedUser.username}`);
        failed = true;
      }
      continue;
    }

    try {
      currentStage = `criar a conta ${seedUser.username}`;
      await auth.api.signUpEmail({
        body: {
          email: seedUser.email,
          password: seedUser.password,
          name: seedUser.name,
          username: seedUser.username,
        },
        headers: new Headers(),
      });
      console.info(`Conta criada: ${seedUser.username}`);
    } catch (error) {
      const details = getErrorDetails(error);
      const code = details.code ? ` (${details.code})` : "";
      const message = safeErrorMessage(error);
      console.error(
        `Não foi possível criar a conta ${seedUser.username}${code}.${message ? ` ${message}` : ""}`
      );
      failed = true;
    }
  }

  currentStage = "confirmar o número de contas";
  const allUsers = await db.select({ id: user.id }).from(user);
  if (allUsers.length !== 10) {
    console.error(
      `A base de dados contém ${allUsers.length} contas; são esperadas exatamente dez.`
    );
    failed = true;
  }

  if (failed) {
    process.exitCode = 1;
  }
}

function databaseErrorSummary(error: unknown): string {
  let current = error;
  const visited = new Set<unknown>();

  while (current && !visited.has(current)) {
    visited.add(current);
    const details = getErrorDetails(current);
    const code = details.code;

    if (code) {
      const summaries: Record<string, string> = {
        "28P01": "PostgreSQL rejeitou a autenticação; confirma utilizador e palavra-passe na connection string.",
        "3D000": "A base de dados indicada na connection string não existe.",
        "42501": "O utilizador PostgreSQL não tem permissões suficientes.",
        "42P01": "Faltam tabelas; executa npm run db:migrate para esta mesma DATABASE_URL.",
        "23505": "Foi detetado um conflito de unicidade; confirma as contas já existentes.",
        ECONNREFUSED: "A ligação foi recusada; confirma o endereço e a porta do PostgreSQL.",
        ECONNRESET: "A ligação ao PostgreSQL foi interrompida; confirma o endereço e a rede.",
        ENOTFOUND: "O host PostgreSQL não foi encontrado; confirma o hostname.",
        ETIMEDOUT: "A ligação ao PostgreSQL excedeu o tempo limite; confirma a rede e o pooler.",
        EHOSTUNREACH: "O host PostgreSQL não está acessível a partir desta rede.",
      };

      if (summaries[code]) return summaries[code];
      if (/^[A-Z0-9]{5}$/.test(code)) {
        return `Erro PostgreSQL ${code}${details.message ? `: ${safeErrorMessage(current)}` : "."}`;
      }
    }

    current = details.cause;
  }

  return safeErrorMessage(error) ?? "Erro sem detalhes adicionais.";
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error: unknown) => {
    if (error instanceof SeedInputError) {
      console.error(`Erro nos dados do seed: ${error.message}`);
    } else {
      console.error(
        `Erro no seed ao ${currentStage}: ${databaseErrorSummary(error)}`
      );
    }
    process.exit(1);
  });
