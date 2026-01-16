import { supabase } from "../lib/supabase";

export async function ensureCategoryAndSub(
  categoryName: string,
  subName: string
): Promise<boolean> {
  const category = categoryName.trim();
  const sub = subName.trim();

  //console.log("Step 0: Inputs", { category, sub });

  if (!category || !sub) {
    //console.log("Step 0b: Missing category or sub");
    return false;
  }

  // 1. Try to fetch category
  const { data, error } = await supabase
    .from("categories")
    .select("name, subs")
    .eq("name", category)
    .maybeSingle();

  if (error) {
    //console.error("Step 1: Category lookup failed", error);
    return false;
  }

  if (!data) {
    //console.log("Step 2: Category does NOT exist → insert with sub");
    // 2. Category does NOT exist → create it with the sub
    const { error: insertError } = await supabase
      .from("categories")
      .insert({ name: category, subs: [sub], sort_order: 999 });

    if (insertError) {
      //console.error("Step 2b: Insert category failed", insertError);
      return false;
    }

    //console.log("Step 2c: Inserted new category with sub");
    return true;
  }

  //console.log("Step 3: Category exists", data);

  // 3. Category exists → normalize subs
  const currentSubs: string[] = Array.isArray(data.subs) ? data.subs : [];
  //console.log("Step 3b: currentSubs =", currentSubs);

  // 4. Check if sub already exists (case-insensitive)
  const subExists = currentSubs.some((s) => s.toLowerCase() === sub.toLowerCase());

  if (subExists) {
    //console.log("Step 3c: Sub already exists → nothing to do");
    return true;
  }

  // 5. Sub missing → update
  //console.log("Step 4: Sub missing → updating subs");
  const updatedSubs = [...currentSubs, sub];

  const { error: updateError } = await supabase
    .from("categories")
    .update({ subs: updatedSubs })
    .eq("name", category);

  if (updateError) {
    //console.error("Step 4b: Update subs failed", updateError);
    return false;
  }

  //console.log("Step 4c: Updated category with new sub: ", updatedCategory);
  return true;
}
