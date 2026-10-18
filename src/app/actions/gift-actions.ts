"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gifts, user } from "@/db/schema";
import {
  deleteGiftImage,
  uploadGiftImage,
  validateGiftImage,
} from "@/lib/storage";
import {
  giftDescriptionSchema,
  giftPriceSchema,
  giftProductUrlSchema,
  giftStatusSchema,
  giftTitleSchema,
} from "@/lib/validation";
import { MAX_GIFT_IMAGE_SIZE_LABEL } from "@/lib/gift-constants";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type State = {
  error?: string;
  success?: boolean;
  destination?: string;
  title?: string;
  description?: string;
  productUrl?: string;
  price?: string;
};

type ErrorDetails = {
  name: string;
  message: string;
  code?: string;
  status?: number;
  statusCode?: string;
};

function getErrorDetails(error: unknown): ErrorDetails {
  if (!(error instanceof Error)) {
    return {
      name: "UnknownError",
      message: "Unknown error",
    };
  }

  const candidate = error as Error & {
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
    cause?: unknown;
  };
  const cause =
    candidate.cause instanceof Error
      ? candidate.cause
      : undefined;
  const rawMessage = cause?.message ?? candidate.message;
  const databaseUrl = process.env.DATABASE_URL;
  const message = rawMessage
    .replaceAll(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "\0", "[key ocultada]")
    .replaceAll(databaseUrl ?? "\0", "[DATABASE_URL ocultada]")
    .replace(
      /(postgres(?:ql)?:\/\/[^:\s/@]+):([^@\s/]+)@/gi,
      "$1:[palavra-passe ocultada]@"
    )
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 240);

  return {
    name: cause?.name ?? candidate.name,
    message,
    code:
      typeof candidate.code === "string"
        ? candidate.code
        : cause && "code" in cause && typeof cause.code === "string"
          ? cause.code
          : undefined,
    status: typeof candidate.status === "number" ? candidate.status : undefined,
    statusCode:
      typeof candidate.statusCode === "string"
        ? candidate.statusCode
        : cause && "statusCode" in cause && typeof cause.statusCode === "string"
          ? cause.statusCode
          : undefined,
  };
}

function getGiftSaveError(stage: "upload" | "database", error: unknown): string {
  const { message, status, statusCode } = getErrorDetails(error);
  const details = `${message} ${statusCode ?? ""}`.toLowerCase();

  if (stage === "upload") {
    if (status === 404 || details.includes("bucket not found")) {
      return "O bucket de imagens não foi encontrado. Confirme que existe um bucket privado chamado “gifts” e que SUPABASE_STORAGE_BUCKET corresponde ao nome.";
    }
    if (
      status === 413 ||
      details.includes("payload too large") ||
      details.includes("file size exceeds")
    ) {
      return "A imagem excede o limite configurado no Supabase Storage. Aumente o limite do bucket “gifts” para pelo menos 5 MB.";
    }
    if (status === 401 || status === 403) {
      return "O Supabase recusou o upload. Confirme SUPABASE_URL e a chave SUPABASE_SERVICE_ROLE_KEY no .env.local.";
    }
    return "Não foi possível carregar a imagem no Supabase Storage. Confirme a configuração do bucket “gifts” e tente novamente.";
  }

  return "Não foi possível guardar a prenda na base de dados. Confirme a ligação e execute npm run db:migrate.";
}

type GiftDestination =
  | { listType: "wish"; recipientUserId: null }
  | { listType: "offer"; recipientUserId: string };

async function getGiftDestination(
  formData: FormData,
  ownerId: string
): Promise<GiftDestination | { error: string }> {
  const rawListType = formData.get("listType");
  if (rawListType !== "wish" && rawListType !== "offer") {
    return { error: "Escolha se a prenda é para receber ou para oferecer." };
  }
  if (rawListType === "wish") {
    return { listType: "wish", recipientUserId: null };
  }

  const rawRecipientId = formData.get("recipientUserId");
  if (typeof rawRecipientId !== "string" || !rawRecipientId) {
    return { error: "Escolha a pessoa a quem pretende oferecer a prenda." };
  }
  if (rawRecipientId === ownerId) {
    return { error: "Para si próprio, escolha a lista de prendas para receber." };
  }

  const [recipient] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, rawRecipientId))
    .limit(1);
  if (!recipient) {
    return { error: "A pessoa selecionada não existe." };
  }
  return { listType: "offer", recipientUserId: recipient.id };
}

export async function createGiftAction(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { error: "Sessão expirada. Inicie sessão novamente." };
  }

  const destination = await getGiftDestination(formData, session.user.id);
  if ("error" in destination) return { error: destination.error };

  const rawDescription = formData.get("description");
  const rawTitle = formData.get("title");
  const rawProductUrl = formData.get("productUrl");
  const rawPrice = formData.get("price");
  const rawStatus = formData.get("status");
  const image = formData.get("image");
  const description =
    typeof rawDescription === "string" ? rawDescription : "";
  const title = typeof rawTitle === "string" ? rawTitle : "";
  const productUrl =
    typeof rawProductUrl === "string" ? rawProductUrl : "";
  const price = typeof rawPrice === "string" ? rawPrice : "";
  const status = typeof rawStatus === "string" ? rawStatus : "available";

  const titleValidation = giftTitleSchema.safeParse(title);
  if (!titleValidation.success) {
    return {
      error: titleValidation.error.issues[0].message,
      title,
      description,
      productUrl,
      price,
    };
  }

  const validation = giftDescriptionSchema.safeParse(description);
  if (!validation.success) {
    return {
      error: validation.error.issues[0].message,
      title: titleValidation.data,
      description,
      productUrl,
      price,
    };
  }

  const urlValidation = giftProductUrlSchema.safeParse(productUrl);
  if (!urlValidation.success) {
    return {
      error: urlValidation.error.issues[0].message,
      title: titleValidation.data,
      description: validation.data,
      productUrl,
      price,
    };
  }

  const priceValidation = giftPriceSchema.safeParse(price);
  if (!priceValidation.success) {
    return {
      error: priceValidation.error.issues[0].message,
      title: titleValidation.data,
      description: validation.data,
      productUrl: urlValidation.data,
      price,
    };
  }

  const statusValidation = giftStatusSchema.safeParse(status);
  if (!statusValidation.success) {
    return {
      error: "Selecione um estado válido para a prenda.",
      title: titleValidation.data,
      description: validation.data,
      productUrl: urlValidation.data,
      price,
    };
  }

  if (typeof image === "string" && image !== "") {
    return {
      error: "O ficheiro de imagem não é válido.",
      title: titleValidation.data,
      description: validation.data,
      productUrl: urlValidation.data,
      price,
    };
  }

  let contentType: string | undefined;
  if (image instanceof File && image.size > 0) {
    const validatedContentType = await validateGiftImage(image);
    if (!validatedContentType) {
      return {
        error: `Use uma imagem JPEG, PNG ou WebP válida, até ${MAX_GIFT_IMAGE_SIZE_LABEL}.`,
        title: titleValidation.data,
        description: validation.data,
        productUrl: urlValidation.data,
        price,
      };
    }
    contentType = validatedContentType;
  }

  let imagePath: string | undefined;
  let stage: "upload" | "database" = contentType ? "upload" : "database";
  try {
    if (contentType && image instanceof File) {
      imagePath = await uploadGiftImage(image, session.user.id, contentType);
    }

    stage = "database";
    await db.insert(gifts).values({
      userId: session.user.id,
      listType: destination.listType,
      recipientUserId: destination.recipientUserId,
      title: titleValidation.data,
      description: validation.data,
      productUrl: urlValidation.data || null,
      priceCents: priceValidation.data,
      status: statusValidation.data,
      imagePath: imagePath ?? null,
    });

    revalidatePath("/prendas");
    revalidatePath("/ofertas");
    return {
      success: true,
      destination: destination.listType === "offer" ? "/ofertas" : "/prendas",
    };
  } catch (error) {
    console.error("[gift:create] Failed to save gift.", {
      stage,
      ...getErrorDetails(error),
    });

    if (imagePath) {
      try {
        await deleteGiftImage(imagePath);
      } catch (cleanupError) {
        console.error("[gift:create] Failed to clean up uploaded image.", {
          ...getErrorDetails(cleanupError),
        });
      }
    }

    return {
      error: getGiftSaveError(stage, error),
      title: titleValidation.data,
      description: validation.data,
      productUrl: urlValidation.data,
      price,
    };
  }
}

export type GiftMutationState = {
  error?: string;
  success?: boolean;
  destination?: string;
};

export async function updateGiftAction(
  giftId: string,
  _previousState: GiftMutationState,
  formData: FormData
): Promise<GiftMutationState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Sessão expirada. Inicie sessão novamente." };
  }

  const [currentGift] = await db
    .select()
    .from(gifts)
    .where(and(eq(gifts.id, giftId), eq(gifts.userId, session.user.id)))
    .limit(1);

  if (!currentGift) {
    return { error: "A prenda não existe ou não pertence à sua conta." };
  }

  const destination = await getGiftDestination(formData, session.user.id);
  if ("error" in destination) return { error: destination.error };

  const rawDescription = formData.get("description");
  const rawTitle = formData.get("title");
  const rawProductUrl = formData.get("productUrl");
  const rawPrice = formData.get("price");
  const rawStatus = formData.get("status");
  const image = formData.get("image");
  const description = typeof rawDescription === "string" ? rawDescription : "";
  const title = typeof rawTitle === "string" ? rawTitle : "";
  const productUrl = typeof rawProductUrl === "string" ? rawProductUrl : "";
  const price = typeof rawPrice === "string" ? rawPrice : "";
  const status = typeof rawStatus === "string" ? rawStatus : "";

  const titleResult = giftTitleSchema.safeParse(title);
  if (!titleResult.success) {
    return { error: titleResult.error.issues[0].message };
  }
  const descriptionResult = giftDescriptionSchema.safeParse(description);
  if (!descriptionResult.success) {
    return { error: descriptionResult.error.issues[0].message };
  }
  const urlResult = giftProductUrlSchema.safeParse(productUrl);
  if (!urlResult.success) {
    return { error: urlResult.error.issues[0].message };
  }
  const priceResult = giftPriceSchema.safeParse(price);
  if (!priceResult.success) {
    return { error: priceResult.error.issues[0].message };
  }
  const statusResult = giftStatusSchema.safeParse(status);
  if (!statusResult.success) {
    return { error: "Selecione um estado válido para a prenda." };
  }

  let contentType: string | undefined;
  if (image instanceof File && image.size > 0) {
    const validatedContentType = await validateGiftImage(image);
    if (!validatedContentType) {
      return {
        error: `Use uma imagem JPEG, PNG ou WebP válida, até ${MAX_GIFT_IMAGE_SIZE_LABEL}.`,
      };
    }
    contentType = validatedContentType;
  } else if (typeof image === "string") {
    return { error: "O ficheiro de imagem não é válido." };
  }

  let newImagePath: string | undefined;
  try {
    if (contentType && image instanceof File) {
      newImagePath = await uploadGiftImage(
        image,
        session.user.id,
        contentType
      );
    }

    const updatedRows = await db
      .update(gifts)
      .set({
        listType: destination.listType,
        recipientUserId: destination.recipientUserId,
        description: descriptionResult.data,
        title: titleResult.data,
        productUrl: urlResult.data || null,
        priceCents: priceResult.data,
        status: statusResult.data,
        ...(newImagePath ? { imagePath: newImagePath } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(gifts.id, giftId), eq(gifts.userId, session.user.id)))
      .returning({ id: gifts.id });
    if (updatedRows.length === 0) {
      throw new Error("Gift disappeared before the update completed");
    }
  } catch (error) {
    console.error("[gift:update] Failed to update gift.", {
      ...getErrorDetails(error),
    });
    if (newImagePath && currentGift.imagePath) {
      try {
        await deleteGiftImage(newImagePath);
      } catch (cleanupError) {
        console.error("[gift:update] Failed to clean up uploaded image.", {
          ...getErrorDetails(cleanupError),
        });
      }
    }
    return { error: "Não foi possível guardar as alterações. Tente novamente." };
  }

  if (newImagePath && currentGift.imagePath) {
    try {
      await deleteGiftImage(currentGift.imagePath);
    } catch (error) {
      console.error("[gift:update] Could not remove the replaced image.", {
        ...getErrorDetails(error),
      });
    }
  }

  revalidatePath("/prendas");
  revalidatePath("/ofertas");
  revalidatePath(`/prendas/${giftId}/editar`);
  return {
    success: true,
    destination: destination.listType === "offer" ? "/ofertas" : "/prendas",
  };
}
