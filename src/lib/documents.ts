import axios from "axios";
import { API_BASE_URL } from "./api";

const DOCUMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMAGE_FILE_EXTENSIONS: Record<string, string> = {
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

type DocumentImageSource = {
  documentId: string | null | undefined;
  legacyUrl: string | null | undefined;
  fallbackUrl: string;
};

function resolveApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
}

function requireDocumentId(documentId: string) {
  const normalizedDocumentId = documentId.trim();
  if (!DOCUMENT_ID_PATTERN.test(normalizedDocumentId)) {
    throw new Error("Invalid document ID.");
  }
  return normalizedDocumentId;
}

function isValidDocumentId(documentId: string | null | undefined): documentId is string {
  return documentId != null && DOCUMENT_ID_PATTERN.test(documentId.trim());
}

export function getPublicDocumentContentUrl(documentId: string) {
  const validDocumentId = requireDocumentId(documentId);
  return `${resolveApiOrigin()}/api/documents/${validDocumentId}/content`;
}

export function resolveDocumentImageUrl({ documentId, legacyUrl, fallbackUrl }: DocumentImageSource) {
  if (isValidDocumentId(documentId)) {
    return getPublicDocumentContentUrl(documentId);
  }

  if (legacyUrl?.trim()) {
    return legacyUrl.startsWith("/") ? `${resolveApiOrigin()}${legacyUrl}` : legacyUrl;
  }

  return fallbackUrl;
}

export async function fetchPublicDocumentBlob(documentId: string) {
  const response = await axios.get<Blob>(getPublicDocumentContentUrl(documentId), {
    responseType: "blob"
  });
  return response.data;
}

export async function downloadPublicDocument(documentId: string, fileName: string) {
  const blob = await fetchPublicDocumentBlob(documentId);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${fileName}${IMAGE_FILE_EXTENSIONS[blob.type] ?? ""}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
