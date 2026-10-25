import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { MAX_GIFT_IMAGE_SIZE } from "./gift-constants";

const MAX_PAGE_SIZE = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const MAX_IMAGE_CANDIDATES = 8;
const REQUEST_TIMEOUT_MS = 7000;
const LOOKUP_TIMEOUT_MS = 20_000;
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ProductImageLookupError extends Error {
  constructor(
    message: string,
    readonly notFound = false
  ) {
    super(message);
    this.name = "ProductImageLookupError";
  }
}

type Address = { address: string; family: number };

function withDeadline<T>(promise: Promise<T>, deadline: number): Promise<T> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    return Promise.reject(new ProductImageLookupError("A pesquisa demorou demasiado tempo."));
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new ProductImageLookupError("A pesquisa demorou demasiado tempo.")),
      remaining
    );
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const parts = address.split(".").map(Number);
    const [first, second] = parts;
    return !(
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 168 && second === 63 && parts[2] === 129 && parts[3] === 16) ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 0) ||
      (first === 192 && second === 88 && parts[2] === 99) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      (first === 198 && second === 51 && parts[2] === 100) ||
      (first === 203 && second === 0 && parts[2] === 113) ||
      first >= 224
    );
  }

  if (family !== 6) return false;
  const normalized = address.toLowerCase();
  const groups = normalized.split("::");
  const left = groups[0] ? groups[0].split(":") : [];
  const right = groups[1] ? groups[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  const expanded = [...left, ...Array(Math.max(0, missing)).fill("0"), ...right];
  const firstGroup = Number.parseInt(expanded[0] ?? "0", 16);
  const secondGroup = Number.parseInt(expanded[1] ?? "0", 16);
  return (
    (firstGroup & 0xe000) === 0x2000 &&
    !(firstGroup === 0x2001 && secondGroup <= 0x01ff) &&
    !normalized.startsWith("2002:") &&
    !normalized.startsWith("2001:db8:")
  );
}

async function resolvePublicAddress(
  hostname: string,
  deadline: number
): Promise<Address> {
  const normalizedHost = hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(normalizedHost);
  const addresses = literalFamily
    ? [{ address: normalizedHost, family: literalFamily }]
    : await withDeadline(
        lookup(normalizedHost, { all: true, verbatim: true }),
        deadline
      );

  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ProductImageLookupError("Este endereço não pode ser consultado.");
  }
  return addresses[0];
}

function parseExternalUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ProductImageLookupError("Introduza uma ligação válida.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !url.hostname ||
    (url.port !== "" &&
      url.port !== (url.protocol === "https:" ? "443" : "80"))
  ) {
    throw new ProductImageLookupError("A ligação deve ser HTTP ou HTTPS.");
  }
  return url;
}

function requestExternal(
  url: URL,
  address: Address,
  maxSize: number,
  deadline: number
): Promise<{ body: Buffer; contentType: string; redirectTo?: string }> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      reject(new ProductImageLookupError("A pesquisa demorou demasiado tempo."));
      return;
    }
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        method: "GET",
        headers: {
          "user-agent": "FabricaPaiNatal/1.0 (+product image preview)",
          accept: "text/html,image/jpeg,image/png,image/webp,*/*;q=0.1",
          "accept-encoding": "identity",
        },
        lookup: (_hostname, _options, callback) => {
          callback(null, address.address, address.family);
        },
        servername: isIP(url.hostname.replace(/^\[|\]$/g, ""))
          ? undefined
          : url.hostname,
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = response.headers.location;
          response.resume();
          resolve({
            body: Buffer.alloc(0),
            contentType: "",
            redirectTo: location,
          });
          return;
        }
        if (status < 200 || status >= 300) {
          response.resume();
          reject(new ProductImageLookupError("O site não permitiu obter a imagem."));
          return;
        }

        const encoding = response.headers["content-encoding"];
        if (encoding && encoding !== "identity") {
          response.resume();
          reject(new ProductImageLookupError("A resposta do site não é válida."));
          return;
        }
        const declaredSize = Number(response.headers["content-length"]);
        if (Number.isFinite(declaredSize) && declaredSize > maxSize) {
          response.resume();
          reject(new ProductImageLookupError("A imagem ou página é demasiado grande."));
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          size += buffer.length;
          if (size > maxSize) {
            response.destroy(new ProductImageLookupError("A imagem ou página é demasiado grande."));
            return;
          }
          chunks.push(buffer);
        });
        response.on("end", () => {
          resolve({
            body: Buffer.concat(chunks),
            contentType: (response.headers["content-type"] ?? "")
              .split(";")[0]
              .trim()
              .toLowerCase(),
          });
        });
        response.on("error", reject);
      }
    );

    const deadlineTimeout = setTimeout(
      () => request.destroy(new ProductImageLookupError("A pesquisa demorou demasiado tempo.")),
      remaining
    );
    request.once("close", () => clearTimeout(deadlineTimeout));
    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new ProductImageLookupError("O site demorou demasiado tempo a responder."));
    });
    request.on("error", reject);
    request.end();
  });
}

async function fetchExternal(
  initialUrl: URL,
  maxSize: number,
  deadline: number
): Promise<{ body: Buffer; contentType: string; url: URL }> {
  let url = initialUrl;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const address = await resolvePublicAddress(url.hostname, deadline);
    const response = await requestExternal(url, address, maxSize, deadline);
    if (!response.redirectTo) {
      return { body: response.body, contentType: response.contentType, url };
    }
    if (redirect === MAX_REDIRECTS) {
      throw new ProductImageLookupError("O site redirecionou demasiadas vezes.");
    }
    url = parseExternalUrl(new URL(response.redirectTo, url).toString());
  }
  throw new ProductImageLookupError("Não foi possível consultar o site.");
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function getImageCandidates(html: string): string[] {
  const candidates: string[] = [];
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map<string, string>();
    for (const attribute of tag[0].matchAll(
      /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
    )) {
      attributes.set(
        attribute[1].toLowerCase(),
        decodeHtml(attribute[2] ?? attribute[3] ?? attribute[4] ?? "")
      );
    }
    const key = (attributes.get("property") ?? attributes.get("name") ?? "").toLowerCase();
    if (["og:image", "og:image:url", "twitter:image", "twitter:image:src"].includes(key)) {
      const value = attributes.get("content");
      if (value) candidates.push(value);
    }
  }

  const scripts = html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  function collectImages(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(collectImages);
    } else if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const image = record.image;
      if (typeof image === "string") candidates.push(image);
      else if (image && typeof image === "object") {
        const imageRecord = image as Record<string, unknown>;
        for (const key of ["url", "contentUrl"]) {
          const imageUrl = imageRecord[key];
          if (typeof imageUrl === "string") candidates.push(imageUrl);
        }
        collectImages(image);
      }
      Object.values(record).forEach(collectImages);
    }
  }
  for (const script of scripts) {
    try {
      collectImages(JSON.parse(script[1]));
    } catch {
      continue;
    }
  }
  return [...new Set(candidates)];
}

function getFileExtension(contentType: string): string {
  return contentType === "image/jpeg" ? "jpg" : contentType.slice("image/".length);
}

export async function findProductImage(
  pageUrl: string
): Promise<{ base64: string; contentType: string; fileName: string }> {
  const deadline = Date.now() + LOOKUP_TIMEOUT_MS;
  const page = await fetchExternal(
    parseExternalUrl(pageUrl),
    MAX_GIFT_IMAGE_SIZE,
    deadline
  );
  let imageBody: Buffer | undefined;
  let contentType: string | undefined;
  let imageUrl: URL | undefined;

  if (imageTypes.has(page.contentType)) {
    imageBody = page.body;
    contentType = page.contentType;
    imageUrl = page.url;
  } else {
    if (page.body.length > MAX_PAGE_SIZE) {
      throw new ProductImageLookupError("A página do site é demasiado grande.");
    }
    if (!page.contentType.includes("html")) {
      throw new ProductImageLookupError(
        "Não foi encontrada nenhuma imagem nesta ligação.",
        true
      );
    }
    const candidates = getImageCandidates(page.body.toString("utf8"));
    let lastCandidateError: unknown;
    for (const candidate of candidates.slice(0, MAX_IMAGE_CANDIDATES)) {
      try {
        const candidateUrl = parseExternalUrl(new URL(candidate, page.url).toString());
        const result = await fetchExternal(candidateUrl, MAX_GIFT_IMAGE_SIZE, deadline);
        if (imageTypes.has(result.contentType)) {
          imageBody = result.body;
          contentType = result.contentType;
          imageUrl = result.url;
          break;
        }
      } catch (error) {
        lastCandidateError = error;
      }
    }
    if (!imageUrl || !imageBody || !contentType) {
      if (candidates.length > 0 && lastCandidateError) {
        throw new ProductImageLookupError(
          "Não foi possível obter a imagem deste site."
        );
      }
      throw new ProductImageLookupError(
        "Não foi encontrada nenhuma imagem nesta página.",
        true
      );
    }
  }

  const extension = getFileExtension(contentType);
  const imageFile = new File([new Uint8Array(imageBody)], `produto.${extension}`, {
    type: contentType,
  });
  if (
    imageFile.size > MAX_GIFT_IMAGE_SIZE ||
    !(await isValidImageBytes(imageFile, contentType))
  ) {
    throw new ProductImageLookupError("A imagem encontrada não é válida.");
  }

  return {
    base64: imageBody.toString("base64"),
    contentType,
    fileName: `imagem-produto.${extension}`,
  };
}

async function isValidImageBytes(file: File, contentType: string): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (contentType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  return (
    contentType === "image/webp" &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}
