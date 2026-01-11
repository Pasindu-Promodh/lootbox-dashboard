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
  original_price: number;
  price: number;
  discount: number;
  featured: boolean;
  in_stock: boolean;
  on_sale: boolean;
  sold_count: number;
  added_date: string;
};

/* =========================
   Helpers
========================= */

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    images: Array.isArray(p.images) ? p.images : [],
    category: p.category,
    original_price: Number(p.original_price),
    price: Number(p.price),
    discount: Number(p.discount),
    featured: Boolean(p.featured),
    in_stock: Boolean(p.in_stock),
    on_sale: Boolean(p.on_sale),
    sold_count: Number(p.sold_count),
    added_date: p.added_date,
  };
}

/* =========================
   Fetch Products
========================= */

export async function getProducts({
  limit = 12,
  offset = 0,
  featured,
  orderBy = { column: "added_date", ascending: false },
}: {
  limit?: number;
  offset?: number;
  featured?: boolean;
  orderBy?: { column: string; ascending?: boolean };
} = {}): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .order(orderBy.column, { ascending: orderBy.ascending ?? false })
    .range(offset, offset + limit - 1);

  if (featured !== undefined) {
    query = query.eq("featured", featured);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data ?? []).map(mapProduct);
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

  return (data ?? []).map(mapProduct);
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

  return mapProduct(data);
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

  return (data ?? []).map(mapProduct);
}
