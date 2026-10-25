import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCategories, addCategory } from "../services/productsCrud";
import { ensureCategoryAndSub } from "../services/ensureCategoryAndSub";
import type { Category } from "../types/category";

type CategoriesContextType = {
  categories: Category[];
  addNewCategory: (name: string) => Promise<Category | null>;
  ensureCategoryAndSub: (category: string, sub: string) => Promise<boolean>;
  reloadCategories: () => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextType>({
  categories: [],
  addNewCategory: async () => null,
  ensureCategoryAndSub: async () => false,
  reloadCategories: async () => {},
});

export const CategoriesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [categories, setCategories] = useState<Category[]>([]);

  const load = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    let cancelled = false;
    getCategories().then((cats) => {
      if (!cancelled) setCategories(cats);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addNewCategory = async (name: string) => {
    const added = await addCategory(name);
    if (added) {
      setCategories((prev) => [...prev, added]);
    }
    return added;
  };

  const ensureCategoryAndSubWrapper = async (
    category: string,
    sub: string
  ): Promise<boolean> => {
    const success = await ensureCategoryAndSub(category, sub);

    if (success) {
      // Refresh so the new category/sub shows up in every dropdown.
      await load();
    } else {
      console.warn("CategoriesContext: ensure failed");
    }

    return success;
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addNewCategory,
        ensureCategoryAndSub: ensureCategoryAndSubWrapper,
        reloadCategories: load,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => useContext(CategoriesContext);
