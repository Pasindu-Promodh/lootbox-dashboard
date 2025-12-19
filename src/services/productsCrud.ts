import { supabase } from "../lib/supabase";
import type { Product } from "./products";

/**
 * Add a new product
 */
export async function addProduct(product: Omit<Product, "id" | "added_date" | "sold_count">) {
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        ...product,
        added_date: new Date().toISOString(),
        sold_count: 0,
      },
    ]);

  if (error) {
    console.error("Error adding product:", error);
    return null;
  }

//   if (!data || data.length === 0) return null;

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
    .eq("id", id);

  if (error) {
    console.error("Error updating product:", error);
    return null;
  }

//   if (!data || data.length === 0) return null;

  return data;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting product:", error);
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