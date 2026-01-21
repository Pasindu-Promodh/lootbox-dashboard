// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   Switch,
//   FormControlLabel,
//   CircularProgress,
//   Autocomplete,
//   IconButton,
//   LinearProgress,
// } from "@mui/material";
// import { useEffect, useRef, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowUpward, ArrowDownward, Delete } from "@mui/icons-material";

// import { getProductById, type Product } from "../services/products";
// import { addProduct, updateProduct } from "../services/productsCrud";
// import { deleteProductImage } from "../services/deleteProductImage";
// import { uploadProductImage } from "../services/uploadProductImage";
// import { compressImageToWebP } from "../utils/imageCompression";
// import { useCategories } from "../context/CategoriesContext";

// type FormValues = Omit<Product, "id" | "added_date" | "sold_count">;

// type ExistingImage = { url: string };
// type LocalImage = { file: File; preview: string; progress: number };

// const initialForm: FormValues = {
//   name: "",
//   description: "",
//   images: [],
//   category: "",
//   original_price: 0,
//   price: 0,
//   discount: 0,
//   featured: false,
//   in_stock: true,
//   on_sale: false,
// };

// export default function ProductFormPage() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const { categories, addNewCategory } = useCategories();

//   const [form, setForm] = useState<FormValues>(initialForm);
//   const initialFormRef = useRef<FormValues>(initialForm);

//   const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
//   const initialExistingImagesRef = useRef<ExistingImage[]>([]);
//   const [localImages, setLocalImages] = useState<LocalImage[]>([]);
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);

//   const [margin, setMargin] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [categoryLoading, setCategoryLoading] = useState(false);

//   /* ---------------------------------- Load Product -------------------------------- */
//   useEffect(() => {
//     if (!id) {
//       initialFormRef.current = initialForm;
//       setLoading(false);
//       return;
//     }

//     (async () => {
//       const product = await getProductById(id);
//       if (!product) return;

//       const formData = {
//         name: product.name,
//         description: product.description,
//         category: product.category,
//         original_price: product.original_price,
//         price: product.price,
//         discount: product.discount,
//         featured: product.featured,
//         in_stock: product.in_stock,
//         on_sale: product.on_sale,
//         images: [],
//       };

//       setForm(formData);
//       initialFormRef.current = formData;

//       const existing = product.images.map((url) => ({ url }));
//       setExistingImages(existing);
//       initialExistingImagesRef.current = existing;

//       setSelectedImage(existing[0]?.url || null);

//       setMargin(
//         product.original_price
//           ? Math.round(
//               ((product.price - product.original_price) / product.original_price) *
//                 100
//             )
//           : 0
//       );

//       setLoading(false);
//     })();
//   }, [id]);

//   /* ---------------------------------- Helpers -------------------------------- */

//   const allImages = [
//     ...existingImages.map((i) => ({ key: i.url, src: i.url, type: "existing" as const })),
//     ...localImages.map((i) => ({ key: i.preview, src: i.preview, type: "local" as const })),
//   ];

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;

//     setForm((prev) => {
//       const updated = {
//         ...prev,
//         [name]:
//           name === "price" || name === "discount" || name === "original_price"
//             ? Number(value)
//             : value,
//       };

//       if (!id && name === "original_price") {
//         updated.price = updated.original_price + (updated.original_price * margin) / 100;
//       }

//       if (!id && name === "price" && updated.original_price) {
//         setMargin(
//           Math.round(
//             ((updated.price - updated.original_price) / updated.original_price) * 100
//           )
//         );
//       }

//       return updated;
//     });
//   };

//   const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newMargin = Number(e.target.value);
//     setMargin(newMargin);

//     if (!id) {
//       setForm((prev) => ({
//         ...prev,
//         price: prev.original_price + (prev.original_price * newMargin) / 100,
//       }));
//     }
//   };

//   const handleToggle = (key: keyof FormValues) => {
//     setForm((p) => ({ ...p, [key]: !p[key] }));
//   };

//   const hasChanges = () => {
//   if (id) {
//     // edit mode: enable if form or images changed
//     const formChanged = JSON.stringify(form) !== JSON.stringify(initialFormRef.current);
//     const existingChanged =
//       existingImages.map((i) => i.url).join(",") !==
//       initialExistingImagesRef.current.map((i) => i.url).join(",");
//     const localChanged = localImages.length > 0;
//     return formChanged || existingChanged || localChanged;
//   } else {
//     // new product: enable only if all required fields are filled
//     return (
//       form.name.trim() !== "" &&
//       form.category.trim() !== "" &&
//       form.price > 0 &&
//       (localImages.length > 0 || existingImages.length > 0)
//     );
//   }
// };

//   /* ---------------------------------- Categories -------------------------------- */
//   const handleCategoryChange = async (_: any, value: string | null) => {
//     if (!value) return;

//     if (!categories.includes(value)) {
//       setCategoryLoading(true);
//       await addNewCategory(value);
//       setCategoryLoading(false);
//     }

//     setForm((p) => ({ ...p, category: value }));
//   };

//   /* ---------------------------------- Image Upload -------------------------------- */
//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return;

//     const files = Array.from(e.target.files).map((file) => ({
//       file,
//       preview: URL.createObjectURL(file),
//       progress: 0,
//     }));

//     setLocalImages((p) => [...p, ...files]);

//     if (!selectedImage && files.length) setSelectedImage(files[0].preview);
//   };

//   const moveImage = (index: number, dir: "up" | "down") => {
//     const target = dir === "up" ? index - 1 : index + 1;
//     if (target < 0 || target >= allImages.length) return;

//     const reordered = [...allImages];
//     [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

//     const newExisting: ExistingImage[] = [];
//     const newLocal: LocalImage[] = [];

//     reordered.forEach((img) => {
//       if (img.type === "existing") newExisting.push({ url: img.src });
//       else {
//         const found = localImages.find((l) => l.preview === img.src);
//         if (found) newLocal.push(found);
//       }
//     });

//     setExistingImages(newExisting);
//     setLocalImages(newLocal);
//   };

//   const removeImage = async (index: number) => {
//     const img = allImages[index];

//     if (img.type === "existing") {
//       await deleteProductImage(img.src);
//       setExistingImages((p) => p.filter((i) => i.url !== img.src));
//     } else {
//       setLocalImages((p) => {
//         const found = p.find((i) => i.preview === img.src);
//         if (found) URL.revokeObjectURL(found.preview);
//         return p.filter((i) => i.preview !== img.src);
//       });
//     }

//     if (selectedImage === img.src) {
//       const next = allImages[index + 1]?.src || allImages[index - 1]?.src || null;
//       setSelectedImage(next);
//     }
//   };

//   /* ---------------------------------- Submit -------------------------------- */
//   const handleSubmit = async () => {
//     setSubmitting(true);

//     try {
//       const uploaded: string[] = [];

//       for (let i = 0; i < localImages.length; i++) {
//         const compressed = await compressImageToWebP(localImages[i].file, 1200, 0.8);

//         setLocalImages((p) =>
//           p.map((img, idx) => (idx === i ? { ...img, progress: 30 } : img))
//         );

//         const url = await uploadProductImage(compressed, (prog) => {
//           setLocalImages((p) =>
//             p.map((img, idx) => (idx === i ? { ...img, progress: prog } : img))
//           );
//         });

//         if (!url) throw new Error("Upload failed");
//         uploaded.push(url);
//       }

//       const images = [...existingImages.map((i) => i.url), ...uploaded];

//       const success = id
//         ? await updateProduct(id, { ...form, images })
//         : await addProduct({ ...form, images });

//       if (!success) throw new Error("Save failed");

//       navigate("/products");
//     } catch {
//       alert("Failed to save product");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   /* ---------------------------------- Render -------------------------------- */
//   if (loading)
//     return (
//       <Box py={6} display="flex" justifyContent="center">
//         <CircularProgress />
//       </Box>
//     );

//   return (
//     <Box width="100%" minHeight="100vh" bgcolor="#f8fafc">
//       {/* Header */}
//       <Box
//         px={{ xs: 2, sm: 4 }}
//         py={2}
//         display="flex"
//         justifyContent="space-between"
//         alignItems="center"
//         bgcolor="#fff"
//         boxShadow="0 1px 8px rgba(0,0,0,0.05)"
//       >
//         <Box>
//           <Typography fontSize={20} fontWeight={600}>
//             Product
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             Manage your product
//           </Typography>
//         </Box>

//         <Box display="flex" alignItems="center" gap={2}>
//           <Button variant="outlined" onClick={() => navigate(-1)}>
//             Back
//           </Button>
//         </Box>
//       </Box>
//     <Box p={4}>
//       <Typography variant="h5" mb={3}>
//         {id ? "Edit Product" : "Add Product"}
//       </Typography>

//       <Box display="flex" gap={4} flexWrap="wrap">
//         {/* Left form */}
//         <Box flex={1} minWidth={300} display="flex" flexDirection="column" gap={2}>
//           <TextField label="Name" name="name" value={form.name} onChange={handleChange} />
//           <TextField
//             label="Description"
//             name="description"
//             value={form.description}
//             onChange={handleChange}
//             multiline
//             rows={3}
//           />

//           <Autocomplete
//             freeSolo
//             options={categories}
//             value={form.category}
//             onChange={handleCategoryChange}
//             renderInput={(params) => (
//               <TextField
//                 {...params}
//                 label="Category"
//                 InputProps={{
//                   ...params.InputProps,
//                   endAdornment: (
//                     <>
//                       {categoryLoading && <CircularProgress size={20} />}
//                       {params.InputProps.endAdornment}
//                     </>
//                   ),
//                 }}
//               />
//             )}
//           />

//           <Box display="flex" gap={2} alignItems="center">
//             <TextField
//               label="Original Price"
//               name="original_price"
//               type="number"
//               value={form.original_price}
//               onChange={handleChange}
//               fullWidth
//             />
//             <TextField
//               label="Profit Margin (%)"
//               type="number"
//               value={margin}
//               onChange={handleMarginChange}
//               sx={{ width: 150 }}
//             />
//           </Box>

//           <TextField
//             label="Price"
//             name="price"
//             type="number"
//             value={form.price}
//             onChange={handleChange}
//             fullWidth
//           />
//           <TextField disabled={!form.on_sale} label="Discount (%)" name="discount" type="number" value={form.discount} onChange={handleChange} />

//           <Box display="flex" gap={2}>
//             <FormControlLabel
//               control={<Switch checked={form.featured} onChange={() => handleToggle("featured")} />}
//               label="Featured"
//             />
//             <FormControlLabel
//               control={<Switch checked={form.in_stock} onChange={() => handleToggle("in_stock")} />}
//               label="In Stock"
//             />
//             <FormControlLabel
//               control={<Switch checked={form.on_sale} onChange={() => handleToggle("on_sale")} />}
//               label="On Sale"
//             />
//           </Box>

//           <Button variant="contained" disabled={submitting || !hasChanges()} onClick={handleSubmit}>
//             {submitting ? "Saving..." : id ? "Update Product" : "Add Product"}
//           </Button>
//         </Box>

//         {/* Right images */}
//         <Box width={420} display="flex" flexDirection="column" gap={2}>
//           {selectedImage && (
//             <Box height={400}>
//               <img src={selectedImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//             </Box>
//           )}

//           {allImages.map((img, idx) => (
//             <Box key={img.key} display="flex" alignItems="center" gap={1}>
//               <img src={img.src} width={60} height={60} />
//               <IconButton onClick={() => moveImage(idx, "up")}>
//                 <ArrowUpward />
//               </IconButton>
//               <IconButton onClick={() => moveImage(idx, "down")}>
//                 <ArrowDownward />
//               </IconButton>
//               <IconButton onClick={() => removeImage(idx)}>
//                 <Delete />
//               </IconButton>
//               {img.type === "local" && (
//                 <Box flex={1}>
//                   <LinearProgress
//                     variant="determinate"
//                     value={localImages.find((l) => l.preview === img.src)?.progress || 0}
//                   />
//                 </Box>
//               )}
//             </Box>
//           ))}

//           <Button component="label" variant="outlined">
//             Upload Images
//             <input hidden type="file" multiple accept="image/*" onChange={handleImageUpload} />
//           </Button>
//         </Box>
//       </Box>
//     </Box>
//     </Box>
//   );
// }

import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  CircularProgress,
  Autocomplete,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpward, ArrowDownward, Delete } from "@mui/icons-material";

import { getProductById, type Product } from "../services/products";
import { addProduct, updateProduct } from "../services/productsCrud";
import { useCategories } from "../context/CategoriesContext";
import {
  deleteProductImageSet,
  uploadProductImageSet,
} from "../services/productImages";

type FormValues = Omit<Product, "id" | "added_date" | "sold_count">;

type ExistingImage = {
  main: string;
  thumb: string;
};

type LocalImage = {
  file: File;
  preview: string;
  progress: number;
};

const initialForm: FormValues = {
  name: "",
  description: "",
  images: [],
  category: "",
  sub_category: "",
  original_price: 0,
  pre_discount_price: 0,
  price: 0,
  featured: false,
  in_stock: true,
  on_sale: false,
};

const calcPrePriceFromMargin = (original: number, margin: number) =>
  Math.round(original + (original * margin) / 100);

const calcFinalPrice = (pre: number, discount: number) =>
  Math.round(pre - (pre * discount) / 100);

const calcMarginFromPrices = (original: number, pre: number) =>
  original ? Math.round(((pre - original) / original) * 100) : 0;

const calcDiscountFromPrices = (pre: number, price: number) =>
  pre ? Math.round(((pre - price) / pre) * 100) : 0;

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, ensureCategoryAndSub } = useCategories();

  const [form, setForm] = useState<FormValues>(initialForm);
  const initialFormRef = useRef<FormValues>(initialForm);

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const initialExistingImagesRef = useRef<ExistingImage[]>([]);
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [margin, setMargin] = useState(20);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ---------------------------------- Load Product -------------------------------- */
  useEffect(() => {
    if (!id) {
      initialFormRef.current = initialForm;
      setLoading(false);
      return;
    }

    (async () => {
      const product = await getProductById(id);
      if (!product) return;

      const formData = {
        name: product.name,
        description: product.description,
        category: product.category,
        sub_category: product.sub_category,
        original_price: product.original_price,
        pre_discount_price: product.pre_discount_price,
        price: product.price,
        featured: product.featured,
        in_stock: product.in_stock,
        on_sale: product.on_sale,
        images: [],
      };

      setForm(formData);
      initialFormRef.current = formData;

      setDiscount(
        calcDiscountFromPrices(product.pre_discount_price, product.price)
      );

      // ✅ images are now objects, not URLs
      const existing: ExistingImage[] = product.images;
      setExistingImages(existing);
      initialExistingImagesRef.current = existing;

      setSelectedImage(existing[0]?.main || null);

      // setMargin(
      //   product.original_price
      //     ? Math.round(
      //         ((product.price - product.original_price) /
      //           product.original_price) *
      //           100
      //       )
      //     : 0
      // );

      setMargin(
        calcMarginFromPrices(
          product.original_price,
          product.pre_discount_price
        )
      );

      setLoading(false);
    })();
  }, [id]);

  /* ---------------------------------- Helpers -------------------------------- */

  const allImages = [
    ...existingImages.map((i) => ({
      key: i.main,
      src: i.main,
      type: "existing" as const,
    })),
    ...localImages.map((i) => ({
      key: i.preview,
      src: i.preview,
      type: "local" as const,
    })),
  ];

  const categoryNames = categories.map((c) => c.name);

  const selectedCategory = categories.find((c) => c.name === form.category);

  const subOptions = selectedCategory?.subs ?? [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const intValue = Math.round(Number(value)); // integer only

    setForm((prev) => {
      let updated = {
        ...prev,
        [name]:
          name === "price" || name === "original_price"
            ? intValue
            : value,
      };

      // if (!id && name === "original_price") {
      updated.price =
        updated.original_price +
        Math.round((updated.original_price * margin) / 100);
      // }

      if (!id && name === "price" && updated.original_price) {
        setMargin(
          Math.round(
            ((updated.price - updated.original_price) /
              updated.original_price) *
              100
          )
        );
      }

      return updated;
    });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDiscount = Math.round(Number(e.target.value));

    setDiscount(newDiscount);

    // setForm((prev) => ({
    //   ...prev,
    //   discount,
    //   price: prev.on_sale
    //     ? calcFinalPrice(prev.pre_discount_price, discount)
    //     : prev.pre_discount_price,
    // }));

    setForm((prev) => {
      const final = calcFinalPrice(prev.pre_discount_price, newDiscount);
      return {
        ...prev,
        price: prev.on_sale ? final : prev.pre_discount_price,
      };
    });
  };

  // const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newMargin = Math.round(Number(e.target.value));
  //   setMargin(newMargin);

  //   // if (!id) {
  //     setForm((prev) => ({
  //       ...prev,
  //       price:
  //         prev.original_price +
  //         Math.round((prev.original_price * newMargin) / 100),
  //     }));
  //   // }
  // };

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = Math.round(Number(e.target.value));
    setMargin(newMargin);

    setForm((prev) => {
      const pre = calcPrePriceFromMargin(prev.original_price, newMargin);
      const final = prev.on_sale ? calcFinalPrice(pre, discount) : pre;

      return {
        ...prev,
        pre_discount_price: pre,
        price: final,
      };
    });
  };

  // const handleToggle = (key: keyof FormValues) => {
  //   setForm((prev) => {
  //     let updated = { ...prev, [key]: !prev[key] };
  //     if (key === "on_sale" && !updated.on_sale) updated.discount = 0; // reset discount if off
  //     return updated;
  //   });
  // };

  const handleToggle = (key: keyof FormValues) => {
    setForm((prev) => {
      if (key !== "on_sale") {
        return { ...prev, [key]: !prev[key] };
      }

      const turningOff = prev.on_sale;

      if (turningOff) {
        // on_sale → OFF
        return {
          ...prev,
          on_sale: false,
          price: prev.pre_discount_price,
        };
      }

      // on_sale → ON
      return {
        ...prev,
        on_sale: true,
        price: calcFinalPrice(prev.pre_discount_price, discount),
      };
    });
  };

  const hasChanges = () => {
    if (id) {
      const formChanged =
        JSON.stringify(form) !== JSON.stringify(initialFormRef.current);

      const existingChanged =
        JSON.stringify(existingImages) !==
        JSON.stringify(initialExistingImagesRef.current);

      const localChanged = localImages.length > 0;

      return formChanged || existingChanged || localChanged;
    }

    return (
      form.name.trim() !== "" &&
      form.category.trim() !== "" &&
      form.sub_category.trim() !== "" &&
      form.price > 0 &&
      localImages.length > 0
    );
  };

  /* ---------------------------------- Categories -------------------------------- */
  // const handleCategoryChange = async (_: any, value: string | null) => {
  //   if (!value) return;
  //   if (!categories.includes(value)) {
  //     setCategoryLoading(true);
  //     await addNewCategory(value);
  //     setCategoryLoading(false);
  //   }
  //   setForm((p) => ({ ...p, category: value }));
  // };

  /* ---------------------------------- Image Upload -------------------------------- */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    setLocalImages((p) => [...p, ...files]);
    if (!selectedImage && files.length) setSelectedImage(files[0].preview);
  };

  const moveImage = (index: number, dir: "up" | "down") => {
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= allImages.length) return;

    const reordered = [...allImages];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];

    const newExisting: ExistingImage[] = [];
    const newLocal: LocalImage[] = [];

    reordered.forEach((img) => {
      if (img.type === "existing") {
        const found = existingImages.find((e) => e.main === img.src);
        if (found) newExisting.push(found);
      } else {
        const found = localImages.find((l) => l.preview === img.src);
        if (found) newLocal.push(found);
      }
    });

    setExistingImages(newExisting);
    setLocalImages(newLocal);
  };

  const removeImage = async (index: number) => {
    const img = allImages[index];

    if (img.type === "existing") {
      const found = existingImages.find((i) => i.main === img.src);
      if (found) {
        await deleteProductImageSet(found);
        setExistingImages((p) => p.filter((i) => i.main !== found.main));
      }
    } else {
      setLocalImages((p) => {
        const found = p.find((i) => i.preview === img.src);
        if (found) URL.revokeObjectURL(found.preview);
        return p.filter((i) => i.preview !== img.src);
      });
    }

    if (selectedImage === img.src) {
      const next =
        allImages[index + 1]?.src || allImages[index - 1]?.src || null;
      setSelectedImage(next);
    }
  };

  /* ---------------------------------- Submit -------------------------------- */
  const handleSubmit = async () => {
    //console.log({...form});
    setSubmitting(true);

    try {
      const ok = await ensureCategoryAndSub(form.category, form.sub_category);

      if (!ok) {
        alert("Failed to sync category / sub category");
        setSubmitting(false);
        return;
      }

      const uploaded: ExistingImage[] = [];

      for (let i = 0; i < localImages.length; i++) {
        const imageSet = await uploadProductImageSet(
          localImages[i].file,
          (prog) => {
            setLocalImages((p) =>
              p.map((img, idx) =>
                idx === i ? { ...img, progress: prog } : img
              )
            );
          }
        );

        if (!imageSet) throw new Error("Upload failed");
        uploaded.push(imageSet);
      }

      const images: ExistingImage[] = [...existingImages, ...uploaded];

      const success = id
        ? await updateProduct(id, { ...form, images })
        : await addProduct({ ...form, images });

      if (!success) throw new Error("Save failed");

      navigate("/products");
    } catch {
      alert("Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------- Render -------------------------------- */
  if (loading)
    return (
      <Box py={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );

  return (
    <Box width="100%" minHeight="100vh" bgcolor="#f8fafc">
      {/* Header */}
      <Box
        px={{ xs: 2, sm: 4 }}
        py={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bgcolor="#fff"
        boxShadow="0 1px 8px rgba(0,0,0,0.05)"
      >
        <Box>
          <Typography fontSize={20} fontWeight={600}>
            Product
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your product
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/products")}>
          Back
        </Button>
      </Box>

      <Box p={4}>
        <Typography variant="h5" mb={3}>
          {id ? "Edit Product" : "Add Product"}
        </Typography>

        <Box display="flex" gap={4} flexWrap="wrap">
          {/* Left Form */}
          <Box
            flex={1}
            minWidth={300}
            display="flex"
            flexDirection="column"
            gap={2}
          >
            <TextField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              multiline
              rows={3}
            />

            <Autocomplete
              freeSolo
              options={categoryNames}
              value={form.category}
              onChange={(_, value) => {
                setForm((p) => ({
                  ...p,
                  category: value ?? "",
                  sub_category: "",
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Category" />
              )}
            />

            <Autocomplete
              freeSolo
              options={subOptions}
              value={form.sub_category}
              disabled={!form.category}
              onChange={(_, value) => {
                setForm((p) => ({ ...p, sub_category: value ?? "" }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Sub Category" />
              )}
            />

            <Box display="flex" gap={2} alignItems="center">
              <TextField
                label="Original Price"
                name="original_price"
                type="number"
                value={form.original_price}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Profit Margin (%)"
                type="number"
                value={margin}
                onChange={handleMarginChange}
                sx={{ width: 150 }}
              />
            </Box>

            <Box display="flex" gap={2} alignItems="center">
              {/* <TextField
                label="Price"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                fullWidth
              /> */}

              <TextField
                label="Pre Discount Price"
                name="pre_discount_price"
                type="number"
                value={form.pre_discount_price}
                fullWidth
                disabled
              />

              <TextField
                label="Discount (%)"
                name="discount"
                type="number"
                value={discount}
                onChange={handleDiscountChange}
                disabled={!form.on_sale}
                sx={{ width: 150 }}
              />
            </Box>

            {/* <Typography variant="h6" color="text.primary">
              Price after discount:{" "}
              {
                // form.price - Math.floor((form.price * form.discount) / 100)
                form.price - (form.price * form.discount) / 100
              }
            </Typography> */}

            <Typography variant="h6">
              Final Price: <strong>{form.price}</strong>
            </Typography>

            <Box display="flex" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.featured}
                    onChange={() => handleToggle("featured")}
                  />
                }
                label="Featured"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.in_stock}
                    onChange={() => handleToggle("in_stock")}
                  />
                }
                label="In Stock"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.on_sale}
                    onChange={() => handleToggle("on_sale")}
                  />
                }
                label="On Sale"
              />
            </Box>

            <Button
              variant="contained"
              disabled={submitting || !hasChanges()}
              onClick={handleSubmit}
            >
              {submitting ? "Saving..." : id ? "Update Product" : "Add Product"}
            </Button>
          </Box>

          {/* Right Images */}
          {/* <Box width={420} display="flex" flexDirection="column" gap={2} >
            {selectedImage && (
              <Box height={400}>
                <img
                  src={selectedImage}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            )} */}

          <Box width={500} display="flex" flexDirection="column" gap={2}>
            {selectedImage && (
              <Box maxHeight={500} sx={{ aspectRatio: 1 }}>
                <img
                  src={selectedImage}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            )}

            {allImages.map((img, idx) => (
              <Box key={img.key} display="flex" alignItems="center" gap={1}>
                <img src={img.src} width={60} height={60} />
                <IconButton onClick={() => moveImage(idx, "up")}>
                  <ArrowUpward />
                </IconButton>
                <IconButton onClick={() => moveImage(idx, "down")}>
                  <ArrowDownward />
                </IconButton>
                <IconButton onClick={() => removeImage(idx)}>
                  <Delete />
                </IconButton>
                {img.type === "local" && (
                  <Box flex={1}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        localImages.find((l) => l.preview === img.src)
                          ?.progress || 0
                      }
                    />
                  </Box>
                )}
              </Box>
            ))}

            <Button component="label" variant="outlined">
              Upload Images
              <input
                hidden
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
