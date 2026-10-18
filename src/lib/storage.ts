import { createClient } from "@supabase/supabase-js";
import { MAX_GIFT_IMAGE_SIZE } from "./gift-constants";

if (typeof window !== "undefined") {
  throw new Error("storage.ts must only be imported server-side");
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const bucket = process.env.SUPABASE_STORAGE_BUCKET || "gifts";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function validateGiftImage(file: File): Promise<string | null> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const declaredType = file.type;

  if (
    file.size === 0 ||
    file.size > MAX_GIFT_IMAGE_SIZE ||
    !imageExtensions[declaredType] ||
    !["jpg", "jpeg", "png", "webp"].includes(extension ?? "")
  ) {
    return null;
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

  if (
    (declaredType === "image/jpeg" && extension !== "jpg" && extension !== "jpeg") ||
    (declaredType === "image/png" && extension !== "png") ||
    (declaredType === "image/webp" && extension !== "webp")
  ) {
    return null;
  }

  if (
    (declaredType === "image/jpeg" && isJpeg) ||
    (declaredType === "image/png" && isPng) ||
    (declaredType === "image/webp" && isWebp)
  ) {
    return declaredType;
  }

  return null;
}

export async function uploadGiftImage(
  file: File,
  userId: string,
  contentType: string
): Promise<string> {
  const extension = imageExtensions[contentType];
  if (!extension) {
    throw new Error("Unsupported gift image type");
  }

  const path = `gifts/${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType,
  });

  if (error) {
    throw error;
  }

  return path;
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function deleteGiftImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw error;
  }
}
