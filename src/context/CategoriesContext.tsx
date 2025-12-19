import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCategories, addCategory } from "../services/productsCrud";

type CategoriesContextType = {
  categories: string[];
  addNewCategory: (name: string) => Promise<string | null>;
  reloadCategories: () => void;
};

const CategoriesContext = createContext<CategoriesContextType>({
  categories: [],
  addNewCategory: async () => null,
  reloadCategories: () => {},
});

export const CategoriesProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<string[]>([]);

  const load = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    load();
  }, []);

  const addNewCategory = async (name: string) => {
    const added = await addCategory(name);
    if (added) setCategories((prev) => [...prev, added]);
    return added;
  };

  return (
    <CategoriesContext.Provider
      value={{ categories, addNewCategory, reloadCategories: load }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => useContext(CategoriesContext);
