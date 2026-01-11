import { supabase } from "../lib/supabase";
import { compressImageToWebP } from "../utils/imageCompression";

type UploadProgress = (percent: number) => void;

export type ProductImage = {
  main: string;
  thumb: string;
};

/**
 * Uploads main + thumbnail versions
 */
export async function uploadProductImageSet(
  file: File,
  onProgress?: UploadProgress
): Promise<ProductImage | null> {
  const id = crypto.randomUUID();
  const basePath = `products/${id}`;

  try {
    // 1️⃣ Compress images
    const mainImage = await compressImageToWebP(file, 1200, 0.85);
    const thumbImage = await compressImageToWebP(file, 300, 0.7);

    // 2️⃣ Upload main image
    onProgress?.(20);
    const mainPath = `${basePath}/main.webp`;
    const { error: mainErr } = await supabase.storage
      .from("product-images")
      .upload(mainPath, mainImage, { upsert: false });

    if (mainErr) throw mainErr;

    // 3️⃣ Upload thumbnail
    onProgress?.(60);
    const thumbPath = `${basePath}/thumb.webp`;
    const { error: thumbErr } = await supabase.storage
      .from("product-images")
      .upload(thumbPath, thumbImage, { upsert: false });

    if (thumbErr) throw thumbErr;

    onProgress?.(100);

    // 4️⃣ Get public URLs
    const mainUrl = supabase.storage
      .from("product-images")
      .getPublicUrl(mainPath).data.publicUrl;

    const thumbUrl = supabase.storage
      .from("product-images")
      .getPublicUrl(thumbPath).data.publicUrl;

    return { main: mainUrl, thumb: thumbUrl };
  } catch (err) {
    console.error("Image upload failed:", err);
    return null;
  }
}

/**
 * Deletes both main + thumbnail
 */
export async function deleteProductImageSet(image: ProductImage) {
  const extractPath = (url: string) => url.split("/product-images/")[1];

  const paths = [extractPath(image.main), extractPath(image.thumb)].filter(
    Boolean
  ) as string[];

  if (!paths.length) return;

  const { error } = await supabase.storage.from("product-images").remove(paths);

  if (error) {
    console.error("Failed to delete images:", error);
  }
}
