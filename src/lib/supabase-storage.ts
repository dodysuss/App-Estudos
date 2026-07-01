type SupabaseUploadInput = {
  path: string;
  body: Buffer;
  contentType: string;
};

type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

function getSupabaseStorageConfig(): SupabaseStorageConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "app-estudos";

  if (!url || !serviceRoleKey) return null;

  return { url, serviceRoleKey, bucket };
}

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function hasSupabaseStorage() {
  return Boolean(getSupabaseStorageConfig());
}

export async function uploadToSupabaseStorage({ path, body, contentType }: SupabaseUploadInput) {
  const config = getSupabaseStorageConfig();
  if (!config) return null;

  const encodedPath = encodeStoragePath(path);
  const uploadUrl = `${config.url}/storage/v1/object/${config.bucket}/${encodedPath}`;
  const uploadBody = new Blob([new Uint8Array(body)], { type: contentType });

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      "content-type": contentType,
      "x-upsert": "false",
    },
    body: uploadBody,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed: ${response.status} ${details}`);
  }

  return `${config.url}/storage/v1/object/public/${config.bucket}/${encodedPath}`;
}
