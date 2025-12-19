// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   Switch,
//   FormControlLabel,
//   CircularProgress,
//   Autocomplete,
// } from "@mui/material";
// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { addProduct, updateProduct } from "../services/productsCrud";
// import { getProductById, type Product } from "../services/products";
// import { useCategories } from "../context/CategoriesContext";

// type FormValues = Omit<Product, "id" | "added_date" | "sold_count">;

// const initialForm: FormValues = {
//   name: "",
//   description: "",
//   images: [],
//   category: "",
//   original_price:0,
//   price: 0,
//   discount: 0,
//   featured: false,
//   in_stock: true,
//   on_sale: false,
// };

// export default function ProductFormPage() {
//   const navigate = useNavigate();
//   const { id } = useParams<{ id: string }>();
//   const { categories, addNewCategory } = useCategories();

//   const [form, setForm] = useState<FormValues>(initialForm);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [categoryLoading, setCategoryLoading] = useState(false);

//   // Load product if editing
//   useEffect(() => {
//     async function loadProduct() {
//       if (id) {
//         const product = await getProductById(id);
//         if (product) {
//           setForm({
//             name: product.name,
//             description: product.description,
//             images: product.images,
//             category: product.category,
//             original_price:product.original_price,
//             price: product.price,
//             discount: product.discount,
//             featured: product.featured,
//             in_stock: product.in_stock,
//             on_sale: product.on_sale,
//           });
//         }
//       }
//       setLoading(false);
//     }

//     loadProduct();
//   }, [id]);

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: name === "price" || name === "discount" ? Number(value) : value,
//     }));
//   };

//   const handleToggle = (name: keyof FormValues) => {
//     setForm((prev) => ({ ...prev, [name]: !prev[name] }));
//   };

//   const handleSubmit = async () => {
//     if (!form.name || !form.category) {
//       alert("Please fill in all required fields.");
//       return;
//     }

//     setSubmitting(true);
//     let success = null;

//     if (id) {
//       success = await updateProduct(id, form);
//     } else {
//       success = await addProduct(form);
//     }

//     setSubmitting(false);

//     if (success) {
//       navigate("/products");
//     } else {
//       alert("Something went wrong");
//     }
//   };

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files || e.target.files.length === 0) return;
//     const files = Array.from(e.target.files);

//     // Simple local preview, can integrate Supabase Storage later
//     const urls = files.map((file) => URL.createObjectURL(file));
//     setForm((prev) => ({ ...prev, images: urls }));
//   };

//   const handleCategoryChange = async (_: any, newValue: string | null) => {
//     if (!newValue) return;

//     if (!categories.includes(newValue)) {
//       setCategoryLoading(true);
//       await addNewCategory(newValue);
//       setCategoryLoading(false);
//     }

//     setForm((prev) => ({ ...prev, category: newValue }));
//   };

//   if (loading)
//     return (
//       <Box py={6} display="flex" justifyContent="center">
//         <CircularProgress />
//       </Box>
//     );

//   return (
//     <Box
//       px={{ xs: 2, sm: 4 }}
//       py={4}
//       width="100%"
//       minHeight="100vh"
//       bgcolor="#f8fafc"
//     >
//       <Typography variant="h5" mb={3}>
//         {id ? "Edit Product" : "Add Product"}
//       </Typography>

//       <Box display="flex" flexDirection="column" gap={2} maxWidth={600}>
//         <TextField
//           label="Name"
//           name="name"
//           value={form.name}
//           onChange={handleChange}
//           fullWidth
//           required
//         />
//         <TextField
//           label="Description"
//           name="description"
//           value={form.description}
//           onChange={handleChange}
//           fullWidth
//           multiline
//           rows={3}
//         />

//         {/* Category selector with search & add */}
//         <Autocomplete
//           freeSolo
//           options={categories}
//           value={form.category}
//           onChange={handleCategoryChange}
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               label="Category"
//               fullWidth
//               placeholder="Select or type to add"
//               InputProps={{
//                 ...params.InputProps,
//                 endAdornment: (
//                   <>
//                     {categoryLoading ? <CircularProgress size={20} /> : null}
//                     {params.InputProps.endAdornment}
//                   </>
//                 ),
//               }}
//               required
//             />
//           )}
//         />

//         <TextField
//           label="Original Price"
//           name="oprice"
//           type="number"
//           value={form.original_price}
//           onChange={handleChange}
//           fullWidth
//         />

//         <TextField
//           label="Price"
//           name="price"
//           type="number"
//           value={form.price}
//           onChange={handleChange}
//           fullWidth
//         />
//         <TextField
//           label="Discount (%)"
//           name="discount"
//           type="number"
//           value={form.discount}
//           onChange={handleChange}
//           fullWidth
//         />

//         {/* Toggles */}
//         <FormControlLabel
//           control={
//             <Switch
//               checked={form.featured}
//               onChange={() => handleToggle("featured")}
//             />
//           }
//           label="Featured"
//         />
//         <FormControlLabel
//           control={
//             <Switch
//               checked={form.in_stock}
//               onChange={() => handleToggle("in_stock")}
//             />
//           }
//           label="In Stock"
//         />
//         <FormControlLabel
//           control={
//             <Switch
//               checked={form.on_sale}
//               onChange={() => handleToggle("on_sale")}
//             />
//           }
//           label="On Sale"
//         />

//         {/* Image Upload */}
//         <Button variant="outlined" component="label">
//           Upload Images
//           <input
//             type="file"
//             accept="image/*"
//             multiple
//             hidden
//             onChange={handleImageUpload}
//           />
//         </Button>
//         {form.images.length > 0 && (
//           <Box display="flex" gap={1} flexWrap="wrap">
//             {form.images.map((img, idx) => (
//               <Box
//                 key={idx}
//                 width={60}
//                 height={60}
//                 borderRadius={1}
//                 overflow="hidden"
//                 bgcolor="#e2e8f0"
//               >
//                 <img
//                   src={img}
//                   alt={`preview-${idx}`}
//                   style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                 />
//               </Box>
//             ))}
//           </Box>
//         )}

//         {/* Submit */}
//         <Button
//           variant="contained"
//           onClick={handleSubmit}
//           disabled={submitting}
//         >
//           {submitting ? "Saving..." : id ? "Update Product" : "Add Product"}
//         </Button>

//         {/* Back button */}
//         <Button variant="text" onClick={() => navigate("/products")}>
//           Back to Products
//         </Button>
//       </Box>
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
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addProduct, updateProduct } from "../services/productsCrud";
import { getProductById, type Product } from "../services/products";
import { useCategories } from "../context/CategoriesContext";
import { Delete, ArrowUpward, ArrowDownward } from "@mui/icons-material";

type FormValues = Omit<Product, "id" | "added_date" | "sold_count">;

const initialForm: FormValues = {
  name: "",
  description: "",
  images: [],
  category: "",
  original_price: 0,
  price: 0,
  discount: 0,
  featured: false,
  in_stock: true,
  on_sale: false,
};

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { categories, addNewCategory } = useCategories();

  const [form, setForm] = useState<FormValues>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [margin, setMargin] = useState(0); // profit margin %
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const initialFormRef = useRef<FormValues>(initialForm);

  // Load product if editing
  useEffect(() => {
    async function loadProduct() {
      if (id) {
        const product = await getProductById(id);
        if (product) {
          setForm({
            name: product.name,
            description: product.description,
            images: product.images,
            category: product.category,
            original_price: product.original_price,
            price: product.price,
            discount: product.discount,
            featured: product.featured,
            in_stock: product.in_stock,
            on_sale: product.on_sale,
          });
          initialFormRef.current = {
            name: product.name,
            description: product.description,
            images: product.images,
            category: product.category,
            original_price: product.original_price,
            price: product.price,
            discount: product.discount,
            featured: product.featured,
            in_stock: product.in_stock,
            on_sale: product.on_sale,
          };
          setMargin(
            product.original_price
              ? Math.round(
                  ((product.price - product.original_price) /
                    product.original_price) *
                    100
                )
              : 0
          );
          setSelectedImage(product.images[0] || null);
        }
      }
      setLoading(false);
    }

    loadProduct();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      let updated = {
        ...prev,
        [name]: name === "price" || name === "discount" || name==="original_price" ? Number(value) : value,
      };

      if (!id && name === "original_price") {
        // auto-calculate price based on margin for new product
        updated.price = updated.original_price + (updated.original_price * margin) / 100;
      }

      if (!id && name === "price" && updated.original_price) {
        // recalc margin if user types price
        setMargin(Math.round(((updated.price - updated.original_price) / updated.original_price) * 100));
      }

      return updated;
    });
  };

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = Number(e.target.value);
    setMargin(newMargin);
    if (!id) {
      setForm((prev) => ({
        ...prev,
        price: prev.original_price + (prev.original_price * newMargin) / 100,
      }));
    }
  };

  const handleToggle = (name: keyof FormValues) => {
    setForm((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleCategoryChange = async (_: any, newValue: string | null) => {
    if (!newValue) return;

    if (!categories.includes(newValue)) {
      setCategoryLoading(true);
      await addNewCategory(newValue);
      setCategoryLoading(false);
    }

    setForm((prev) => ({ ...prev, category: newValue }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setForm((prev) => {
      const newImages = [...prev.images, ...urls];
      if (!selectedImage && newImages.length) setSelectedImage(newImages[0]);
      return { ...prev, images: newImages };
    });
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      if (selectedImage === prev.images[index]) setSelectedImage(newImages[0] || null);
      return { ...prev, images: newImages };
    });
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    setForm((prev) => {
      const imgs = [...prev.images];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= imgs.length) return prev;
      [imgs[index], imgs[targetIndex]] = [imgs[targetIndex], imgs[index]];
      return { ...prev, images: imgs };
    });
  };

  const hasChanges = () => {
    return JSON.stringify(form) !== JSON.stringify(initialFormRef.current);
  };

  const canSubmit = () => {
    if (form.images.length === 0) return false;
    if (!form.name || !form.category) return false;
    if (id) return hasChanges();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let success = null;

    if (id) {
      success = await updateProduct(id, form);
    } else {
      success = await addProduct(form);
    }

    setSubmitting(false);

    if (success) {
      navigate("/products");
    } else {
      alert("Something went wrong");
    }
  };

  if (loading)
    return (
      <Box py={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );

  return (
    <Box px={{ xs: 2, sm: 4 }} py={4} width="100%" minHeight="100vh" bgcolor="#f8fafc">
      <Typography variant="h5" mb={3}>
        {id ? "Edit Product" : "Add Product"}
      </Typography>

      <Box display="flex" gap={4} flexWrap="wrap">
        {/* Left: Form */}
        <Box flex={1} minWidth={300} display="flex" flexDirection="column" gap={2}>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required/>
          <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline rows={3}/>
          
          <Autocomplete freeSolo options={categories} value={form.category} onChange={handleCategoryChange}
            renderInput={(params) => (
              <TextField {...params} label="Category" fullWidth placeholder="Select or type to add"
                InputProps={{...params.InputProps, endAdornment: (<> {categoryLoading ? <CircularProgress size={20}/> : null}{params.InputProps.endAdornment}</>)}} required
              />
            )}
          />

          <Box display="flex" gap={2} alignItems="center">
            <TextField label="Original Price" name="original_price" type="number" value={form.original_price} onChange={handleChange} fullWidth/>
            <TextField label="Profit Margin (%)" type="number" value={margin} onChange={handleMarginChange} sx={{width:150}}/>
          </Box>

          <TextField label="Price" name="price" type="number" value={form.price} onChange={handleChange} fullWidth/>
          <TextField label="Discount (%)" name="discount" type="number" value={form.discount} onChange={handleChange} fullWidth/>

          {/* Toggles inline */}
          <Box display="flex" gap={2}>
            <FormControlLabel control={<Switch checked={form.featured} onChange={() => handleToggle("featured")}/>} label="Featured"/>
            <FormControlLabel control={<Switch checked={form.in_stock} onChange={() => handleToggle("in_stock")}/>} label="In Stock"/>
            <FormControlLabel control={<Switch checked={form.on_sale} onChange={() => handleToggle("on_sale")}/>} label="On Sale"/>
          </Box>

          <Button variant="contained" disabled={!canSubmit() || submitting} onClick={handleSubmit}>
            {submitting ? "Saving..." : id ? "Update Product" : "Add Product"}
          </Button>
          <Button variant="text" onClick={() => navigate("/products")}>Back to Products</Button>
        </Box>

        {/* Right: Images */}
        <Box width={500} display="flex" flexDirection="column" gap={2}>
          {selectedImage && (
            <Box height={500} borderRadius={1} overflow="hidden" bgcolor="#e2e8f0">
              <img src={selectedImage} alt="selected" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            </Box>
          )}

          <Box display="flex" flexDirection="column" gap={1}>
            {form.images.map((img, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={1}>
                <Box width={60} height={60} borderRadius={1} overflow="hidden" bgcolor="#e2e8f0" onClick={()=>setSelectedImage(img)}>
                  <img src={img} alt={`thumb-${idx}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </Box>
                <IconButton size="small" onClick={()=>moveImage(idx,"up")}><ArrowUpward fontSize="small"/></IconButton>
                <IconButton size="small" onClick={()=>moveImage(idx,"down")}><ArrowDownward fontSize="small"/></IconButton>
                <IconButton size="small" onClick={()=>removeImage(idx)}><Delete fontSize="small"/></IconButton>
              </Box>
            ))}

            {/* Upload button same size as thumbnail */}
            <Button variant="outlined" component="label" sx={{width:60,height:60,p:0}}>
              Upload
              <input type="file" accept="image/*" multiple hidden onChange={handleImageUpload}/>
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
