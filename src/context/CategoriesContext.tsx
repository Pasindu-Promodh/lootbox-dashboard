// import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
// import { getCategories, addCategory } from "../services/productsCrud";
// import type { Category } from "../types/category";

// type CategoriesContextType = {
//   categories: Category[];
//   addNewCategory: (name: string) => Promise<Category | null>;
//   reloadCategories: () => void;
// };

// const CategoriesContext = createContext<CategoriesContextType>({
//   categories: [],
//   addNewCategory: async () => null,
//   reloadCategories: () => {},
// });

// export const CategoriesProvider = ({ children }: { children: ReactNode }) => {
//   const [categories, setCategories] = useState<Category[]>([]);

//   const load = async () => {
//     const cats = await getCategories();
//     setCategories(cats);
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const addNewCategory = async (name: string) => {
//     const added = await addCategory(name);
//     if (added) setCategories((prev) => [...prev, added]);
//     return added;
//   };

//   return (
//     <CategoriesContext.Provider
//       value={{ categories, addNewCategory, reloadCategories: load }}
//     >
//       {children}
//     </CategoriesContext.Provider>
//   );
// };

// export const useCategories = () => useContext(CategoriesContext);




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
    //console.log("CategoriesContext: loading categories");
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    load();
  }, []);

  const addNewCategory = async (name: string) => {
    console.log("CategoriesContext: addNewCategory", name);
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
    // console.log("CategoriesContext: ensureCategoryAndSub called", {
    //   category,
    //   sub,
    // });

    const success = await ensureCategoryAndSub(category, sub);

    if (success) {
      //console.log("CategoriesContext: ensure succeeded → reloading categories");
      await load(); // 🔥 THIS IS CRITICAL
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
