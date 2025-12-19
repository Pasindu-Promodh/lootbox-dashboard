import { supabase } from "../lib/supabase";

export type Product = {
  id: string;
  name: string;
  description: string;
  images: string[];
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

/**
 * Fetch products with optional limit, offset, featured filter, and ordering
 */
export async function getProducts({
  limit = 12,
  offset = 0,
  featured,
  orderBy,
}: {
  limit?: number;
  offset?: number;
  featured?: boolean;
  orderBy?: { column: string; ascending?: boolean };
} = {}): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .range(offset, offset + limit - 1);

  if (featured !== undefined) query = query.eq("featured", featured);
  if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    images: p.images || [],
    category: p.category,
    original_price: Number(p.original_price),
    price: Number(p.price),
    discount: Number(p.discount),
    featured: p.featured,
    in_stock: p.in_stock,
    on_sale: p.on_sale,
    sold_count: p.sold_count,
    added_date: p.added_date,
  }));
}

/**
 * Fetch products by category
 */
export async function getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .order("added_date", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error(`Error loading products in category "${category}":`, error);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    images: p.images || [],
    category: p.category,
    original_price: Number(p.original_price),
    price: Number(p.price),
    discount: Number(p.discount),
    featured: p.featured,
    in_stock: p.in_stock,
    on_sale: p.on_sale,
    sold_count: p.sold_count,
    added_date: p.added_date,
  }));
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string | undefined): Promise<Product | null> {
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

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    images: data.images || [],
    category: data.category,
    original_price: Number(data.original_price),
    price: Number(data.price),
    discount: Number(data.discount),
    featured: data.featured,
    in_stock: data.in_stock,
    on_sale: data.on_sale,
    sold_count: data.sold_count,
    added_date: data.added_date,
  };
}

/**
 * Search products by keyword (name, description, category)
 */
export async function searchProducts(keyword: string, limit = 12): Promise<Product[]> {
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

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    images: p.images || [],
    category: p.category,
    original_price: Number(p.original_price),
    price: Number(p.price),
    discount: Number(p.discount),
    featured: p.featured,
    in_stock: p.in_stock,
    on_sale: p.on_sale,
    sold_count: p.sold_count,
    added_date: p.added_date,
  }));
}
