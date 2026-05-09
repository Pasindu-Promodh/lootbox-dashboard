import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  UploadFile,
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  ArrowBack,
  FolderOpen,
  Warning,
} from "@mui/icons-material";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { addProduct } from "../services/productsCrud";
import { useCategories } from "../context/CategoriesContext";
import { uploadProductImageSet } from "../services/productImages";

/* ─────────────────────── Types ─────────────────────── */

type RawProduct = {
  Image: string;
  Name: string;
  Description: string;
  Price: string;
};

type ImportRow = {
  raw: RawProduct;
  status: "pending" | "running" | "success" | "error" | "missing_image";
  imageProgress: number;
  parsedPrice: number;
  filename: string; // extracted from the URL
  error?: string;
};

/* ─────────────────────── Helpers ─────────────────────── */

/** "Rs. 1,250.00" → 1250 */
const parsePrice = (raw: string): number => {
  const s = raw.replace(/Rs\.?\s*/i, "").replace(/,/g, "").trim();
  const num = Math.floor(parseFloat(s));
  return isNaN(num) ? 0 : num;
};

/** Extract filename from URL: ".../GScEfu3Q....jpg" → "GScEfu3Q....jpg" */
const filenameFromUrl = (url: string): string =>
  url.split("/").pop() ?? url;

const BATCH_SIZE = 3;

/* ─────────────────────── Component ─────────────────────── */

export default function BulkImportPage() {
  const navigate = useNavigate();
  const { ensureCategoryAndSub } = useCategories();

  const [rows, setRows] = useState<ImportRow[]>([]);
  // Map of filename → File object from the chosen folder
  const [imageMap, setImageMap] = useState<Map<string, File>>(new Map());
  const [folderName, setFolderName] = useState<string>("");

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const pausedRef = useRef(false);
  const abortedRef = useRef(false);
  const categoryEnsuredRef = useRef(false);

  /* ── Derived counts ── */
  const total = rows.length;
  const matchedCount = rows.filter(
    (r) => r.status !== "missing_image"
  ).length;
  const missingCount = rows.filter(
    (r) => r.status === "missing_image"
  ).length;
  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const processedCount = successCount + errorCount;
  const importableRows = rows.filter(
    (r) =>
      r.status === "pending" ||
      r.status === "running" ||
      r.status === "error"
  );
  const progress = importableRows.length + processedCount > 0
    ? Math.round((processedCount / (importableRows.length + processedCount)) * 100)
    : 0;

  const canStart = matchedCount > 0 && !running && !done;

  /* ── JSON file pick ── */
  const handleJsonPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed: RawProduct[] = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error("Not an array");
        setRows(
          parsed.map((raw) => ({
            raw,
            status: "pending",
            imageProgress: 0,
            parsedPrice: parsePrice(raw.Price),
            filename: filenameFromUrl(raw.Image),
          }))
        );
        setDone(false);
        abortedRef.current = false;
        pausedRef.current = false;
        categoryEnsuredRef.current = false;
      } catch {
        alert("Invalid JSON. Expected an array of { Image, Name, Description, Price }.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ── Folder pick ── */
  const handleFolderPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const map = new Map<string, File>();
    for (const file of Array.from(files)) {
      // file.name is just the filename (no path)
      map.set(file.name, file);
    }
    setImageMap(map);

    // Get folder name from webkitRelativePath: "foldername/file.jpg"
    const firstPath = files[0].webkitRelativePath;
    setFolderName(firstPath.split("/")[0] ?? "");

    // Re-evaluate which rows now have a matching image
    if (rows.length > 0) {
      setRows((prev) =>
        prev.map((row) => {
          if (row.status === "success") return row; // don't touch done rows
          const hasFile = map.has(row.filename);
          return {
            ...row,
            status: hasFile ? "pending" : "missing_image",
          };
        })
      );
    }

    e.target.value = "";
  };

  /* ── Patch a single row ── */
  const patchRow = (index: number, patch: Partial<ImportRow>) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  /* ── Process one product ── */
  const processOne = async (index: number, row: ImportRow) => {
    patchRow(index, { status: "running", imageProgress: 0, error: undefined });

    try {
      const price = row.parsedPrice;

      if (!categoryEnsuredRef.current) {
        const ok = await ensureCategoryAndSub("Other", "Other");
        if (!ok) throw new Error("Failed to create category");
        categoryEnsuredRef.current = true;
      }

      // 1️⃣  Get the local File — no network needed
      const imageFile = imageMap.get(row.filename);
      if (!imageFile) throw new Error(`Image file not found: ${row.filename}`);

      // 2️⃣  Upload via your existing service (main + thumb)
      const imageSet = await uploadProductImageSet(imageFile, (prog) => {
        patchRow(index, { imageProgress: prog });
      });
      if (!imageSet) throw new Error("Image upload failed");

      // 3️⃣  Save product (20% profit margin on top of original price)
      const sellingPrice = Math.round(price + (price * 20) / 100);
      const success = await addProduct({
        name: row.raw.Name,
        description: row.raw.Description,
        images: [imageSet],
        category: "Other",
        sub_category: "Other",
        original_price: price,
        pre_discount_price: sellingPrice,
        price: sellingPrice,
        featured: false,
        in_stock: true,
        on_sale: false,
      });
      if (!success) throw new Error("addProduct returned false");

      patchRow(index, { status: "success", imageProgress: 100 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      patchRow(index, { status: "error", error: msg, imageProgress: 0 });
    }
  };

  /* ── Start / resume ── */
  const handleStart = async () => {
    if (!rows.length) return;
    abortedRef.current = false;
    pausedRef.current = false;
    setRunning(true);
    setDone(false);

    const pending = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.status === "pending" || r.status === "error");

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      if (abortedRef.current) break;
      while (pausedRef.current && !abortedRef.current) {
        await new Promise((res) => setTimeout(res, 300));
      }
      if (abortedRef.current) break;
      const chunk = pending.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map(({ r, i: idx }) => processOne(idx, r)));
    }

    setRunning(false);
    setDone(true);
  };

  const handlePause = () => {
    pausedRef.current = !pausedRef.current;
    setRows((p) => [...p]);
  };

  const handleStop = () => {
    abortedRef.current = true;
    pausedRef.current = false;
    setRunning(false);
    setDone(true);
  };

  const handleReset = () => {
    setRows([]);
    setImageMap(new Map());
    setFolderName("");
    setDone(false);
    setRunning(false);
    abortedRef.current = false;
    pausedRef.current = false;
    categoryEnsuredRef.current = false;
  };

  /* ─────────────────────── Render ─────────────────────── */

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
            Bulk Import
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Import products from a JSON file + local image folder
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/products")}
        >
          Back
        </Button>
      </Box>

      <Box p={4}  mx="auto" display="flex" flexDirection="column" gap={3}>

        {/* ── Step 1: JSON ── */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography fontWeight={600} mb={0.5}>
            Step 1 — Choose JSON file
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Format: <code>{"[{ Image, Name, Description, Price }, ...]"}</code>.
            The image filename is extracted from the <code>Image</code> URL and
            matched against your local folder.
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Button
              component="label"
              variant="contained"
              startIcon={<UploadFile />}
              disabled={running}
            >
              {rows.length ? "Replace JSON" : "Choose JSON"}
              <input hidden type="file" accept=".json,application/json" onChange={handleJsonPick} />
            </Button>
            {rows.length > 0 && (
              <Chip label={`${total} products`} color="primary" variant="outlined" />
            )}
          </Box>
        </Paper>

        {/* ── Step 2: Folder ── */}
        {rows.length > 0 && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography fontWeight={600} mb={0.5}>
              Step 2 — Choose images folder
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select the folder that contains all the product images. Files are
              matched by filename — no upload to any proxy needed.
            </Typography>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <Button
                component="label"
                variant="contained"
                color="secondary"
                startIcon={<FolderOpen />}
                disabled={running}
              >
                {folderName ? "Replace Folder" : "Choose Folder"}
                {/* webkitdirectory lets the user pick an entire folder */}
                <input
                  hidden
                  type="file"
                  // @ts-ignore — webkitdirectory is not in the TS types but works in all modern browsers
                  webkitdirectory=""
                  onChange={handleFolderPick}
                />
              </Button>
              {folderName && (
                <Chip
                  icon={<FolderOpen fontSize="small" />}
                  label={`${folderName} (${imageMap.size} images)`}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Match summary */}
            {folderName && (
              <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                <Chip
                  icon={<CheckCircle fontSize="small" />}
                  label={`${matchedCount} matched`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
                {missingCount > 0 && (
                  <Chip
                    icon={<Warning fontSize="small" />}
                    label={`${missingCount} image not found — will be skipped`}
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Paper>
        )}

        {/* ── Step 3: Import ── */}
        {rows.length > 0 && imageMap.size > 0 && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography fontWeight={600} mb={1}>
              Step 3 — Import
            </Typography>
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip label="Category: Other" size="small" />
              <Chip label="Sub-category: Other" size="small" />
              <Chip label="In Stock: Yes" size="small" />
              <Chip label="Featured: No" size="small" />
              <Chip label="On Sale: No" size="small" />
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box display="flex" gap={1} mb={2} alignItems="center">
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleStart}
                disabled={!canStart}
              >
                {processedCount > 0 && !done ? "Resume" : "Start Import"}
              </Button>
              {running && (
                <>
                  <Tooltip title={pausedRef.current ? "Resume" : "Pause"}>
                    <IconButton onClick={handlePause} color="warning">
                      <Pause />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Stop">
                    <IconButton onClick={handleStop} color="error">
                      <Stop />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {!running && (
                <Button variant="outlined" color="secondary" onClick={handleReset}>
                  Clear
                </Button>
              )}
              {pausedRef.current && <Chip label="Paused" color="warning" size="small" />}
            </Box>

            {(running || processedCount > 0) && (
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {processedCount} / {matchedCount} products
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  color={errorCount > 0 ? "warning" : "primary"}
                  sx={{ borderRadius: 1, height: 8 }}
                />
              </Box>
            )}

            {processedCount > 0 && (
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                <Chip icon={<CheckCircle fontSize="small" />} label={`${successCount} succeeded`} color="success" size="small" variant="outlined" />
                {errorCount > 0 && (
                  <Chip icon={<ErrorIcon fontSize="small" />} label={`${errorCount} failed`} color="error" size="small" variant="outlined" />
                )}
                <Chip icon={<HourglassEmpty fontSize="small" />} label={`${importableRows.length - (running ? 0 : 0)} pending`} size="small" variant="outlined" />
              </Box>
            )}

            {done && (
              <Alert severity={errorCount === 0 ? "success" : "warning"} sx={{ mt: 1 }}>
                {errorCount === 0
                  ? `All ${successCount} products imported successfully!`
                  : `Done — ${successCount} succeeded, ${errorCount} failed. Click "Start Import" to retry failed ones.`}
              </Alert>
            )}
          </Paper>
        )}

        {/* ── Product list ── */}
        {rows.length > 0 && (
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box px={3} py={1.5} bgcolor="#f1f5f9">
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                PRODUCT LIST
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 520, overflowY: "auto" }}>
              {rows.map((row, idx) => (
                <Box
                  key={idx}
                  px={3}
                  py={1.5}
                  sx={{
                    borderBottom: "1px solid #f1f5f9",
                    bgcolor:
                      row.status === "success"       ? "#f0fdf4"
                      : row.status === "error"       ? "#fff1f2"
                      : row.status === "running"     ? "#eff6ff"
                      : row.status === "missing_image" ? "#fffbeb"
                      : "transparent",
                    transition: "background 0.2s",
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    {/* Thumbnail — src from local File if available, else remote URL */}
                    <Box
                      component="img"
                      src={
                        imageMap.has(row.filename)
                          ? URL.createObjectURL(imageMap.get(row.filename)!)
                          : row.raw.Image
                      }
                      alt=""
                      sx={{
                        width: 44,
                        height: 44,
                        objectFit: "cover",
                        borderRadius: 1,
                        flexShrink: 0,
                        bgcolor: "#e2e8f0",
                        opacity: row.status === "missing_image" ? 0.4 : 1,
                      }}
                    />

                    <Box flex={1} minWidth={0}>
                      <Typography
                        variant="body2"
                        noWrap
                        title={row.raw.Name}
                        fontWeight={row.status === "running" ? 600 : 400}
                        color={row.status === "missing_image" ? "text.disabled" : "text.primary"}
                      >
                        {row.raw.Name}
                      </Typography>
                      {row.status === "missing_image" && (
                        <Typography variant="caption" color="warning.main">
                          Image not found in folder — will be skipped
                        </Typography>
                      )}
                      {row.status === "error" && (
                        <Typography variant="caption" color="error">
                          {row.error}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                      Rs. {row.parsedPrice.toLocaleString("en-US")}
                    </Typography>

                    <Box sx={{ flexShrink: 0, width: 24, textAlign: "center" }}>
                      {row.status === "success" && <CheckCircle fontSize="small" color="success" />}
                      {row.status === "error"   && <ErrorIcon   fontSize="small" color="error"   />}
                      {row.status === "missing_image" && <Warning fontSize="small" color="warning" />}
                      {row.status === "running" && (
                        <Box sx={{
                          width: 16, height: 16,
                          border: "2px solid #3b82f6",
                          borderTop: "2px solid transparent",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          mx: "auto",
                          "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                        }} />
                      )}
                    </Box>
                  </Box>

                  {row.status === "running" && (
                    <Box mt={1} pl={7}>
                      <Typography variant="caption" color="text.secondary">
                        {row.imageProgress < 100
                          ? `Uploading to storage… ${row.imageProgress}%`
                          : "Saving product…"}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={row.imageProgress}
                        sx={{ mt: 0.5, borderRadius: 1, height: 4 }}
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}