import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  findProductImage,
  ProductImageLookupError,
} from "@/lib/product-image";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json(
      { error: "Inicie sessão para procurar uma imagem." },
      { status: 401 }
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 4096) {
    return Response.json({ error: "A ligação é demasiado longa." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("url" in body) ||
    typeof body.url !== "string" ||
    body.url.length > 2048
  ) {
    return Response.json({ error: "Introduza uma ligação válida." }, { status: 400 });
  }

  try {
    const image = await findProductImage(body.url);
    return Response.json(image);
  } catch (error) {
    if (error instanceof ProductImageLookupError) {
      return Response.json(
        { error: error.message },
        { status: error.notFound ? 404 : 422 }
      );
    }
    console.error("[product-image] Image lookup failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      message:
        error instanceof Error
          ? error.message.replace(/https?:\/\/\S+/g, "[URL]").slice(0, 240)
          : "Unknown error",
      code:
        error && typeof error === "object" && "code" in error &&
        typeof error.code === "string"
          ? error.code
          : undefined,
    });
    return Response.json(
      { error: "Não foi possível consultar este site. Tente novamente." },
      { status: 502 }
    );
  }
}
