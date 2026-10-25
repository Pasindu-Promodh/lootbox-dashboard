import { supabase } from "../lib/supabase";

/* =========================
   Image & Product Types
========================= */

export type ProductImage = {
  main: string; // product page image
  thumb: string; // grid / listing image
};

export type Product = {
  id: string;
  name: string;
  description: string;
  images: ProductImage[];
  category: string;
  sub_category: string;
  original_price: number;
  pre_discount_price: number;
  price: number;
  featured: boolean;
  in_stock: boolean;
  /** Units on hand; null = not tracked (only the in_stock flag is used). */
  stock: number | null;
  on_sale: boolean;
  sold_count: number;
  added_date: string;
};

/* =========================
   Helpers
========================= */

/* =========================
   Fetch Products
========================= */

export async function getAllProducts(): Promise<Product[]> {
  const PAGE_SIZE = 1000;
  let all: Product[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("added_date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching products:", error);
      break;
    }

    all = all.concat(data ?? []);

    if (!data || data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  return all;
}

/* =========================
   Fetch by Category
========================= */

export async function getProductsByCategory(
  category: string,
  limit?: number
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .order("added_date", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error(`Error loading products for category "${category}":`, error);
    return [];
  }

  return (data ?? []);
}

/* =========================
   Fetch Single Product
========================= */

export async function getProductById(
  id: string | undefined
): Promise<Product | null> {
  if (!id) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(`Error loading product ${id}:`, error);
    return null;
  }

  return data;
}

/* =========================
   Search Products
========================= */

export async function searchProducts(
  keyword: string,
  limit = 12
): Promise<Product[]> {
  if (!keyword.trim()) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(
      `name.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`
    )
    .order("added_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error searching products:", error);
    return [];
  }

  return (data ?? []);
}
