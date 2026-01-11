import { supabase } from "../lib/supabase";
import type { ProductImage } from "./productImages";
import type { Product } from "./products";

/**
 * Add a new product
 */
export async function addProduct(
  product: Omit<Product, "id" | "added_date" | "sold_count">
) {
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        ...product,
        added_date: new Date().toISOString(),
        sold_count: 0,
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("Error adding product:", error);
    return null;
  }

  if (!data) return null;

  return data;
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "added_date" | "sold_count">>
) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    console.error("Error updating product:", error);
    return null;
  }
  if (!data) return null;

  return data;
}

/**
 * Delete a product
 */
// export async function deleteProduct(id: string) {
//   const { error } = await supabase.from("products").delete().eq("id", id);

//   if (error) {
//     console.error("Error deleting product:", error);
//     return false;
//   }

//   return true;
// }

// export async function deleteProduct(id: string) {
//   const { data: product } = await supabase
//     .from("products")
//     .select("images")
//     .eq("id", id)
//     .single();

//   if (product?.images) {
//     for (const img of product.images) {
//       await deleteProductImage(img);
//     }
//   }

//   const { error } = await supabase.from("products").delete().eq("id", id);

//   if (error) {
//     console.error(error);
//     return false;
//   }
//   console.log("Product deleted successfully");
//   return true;
// }

export async function deleteProduct(id: string) {
  // 1️⃣ Fetch product images
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("images")
    .eq("id", id)
    .single();

  if (fetchError || !product) {
    console.error("Failed to fetch product:", fetchError);
    return false;
  }

  const images: ProductImage[] = product.images ?? [];

  // 2️⃣ Delete images from bucket
  if (images.length > 0) {
    try {
      const bucketPaths: string[] = [];

      images.forEach(({ main, thumb }) => {
        [main, thumb].forEach((url) => {
          try {
            const u = new URL(url);
            const index = u.pathname.indexOf("/product-images/");
            if (index >= 0) {
              bucketPaths.push(u.pathname.slice(index + "/product-images/".length));
            }
          } catch (err) {
            console.warn("Invalid URL, skipping:", url);
          }
        });
      });

      if (bucketPaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("product-images")
          .remove(bucketPaths);

        if (storageError) {
          console.error("Failed to delete images from bucket:", storageError);
          return false;
        }
      }
    } catch (err) {
      console.error("Error deleting images:", err);
      return false;
    }
  }

  // 3️⃣ Delete product row
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Failed to delete product:", deleteError);
    return false;
  }

  return true;
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  if (!data) return [];

  return data.map((c: any) => c.name);
}

export async function addCategory(name: string) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select();

  if (error) {
    console.error("Error adding category:", error);
    return null;
  }

  return data && data[0] ? data[0].name : null;
}

// Optional: search categories by partial match
export async function searchCategories(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .ilike("name", `%${query}%`)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error searching categories:", error);
    return [];
  }

  return data ? data.map((c) => c.name) : [];
}
