import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { supabase } from "../lib/supabase";
import { useState } from "react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectToUrl = import.meta.env.VITE_REDIRECT_TO;
  //  || window.location.origin;

  const signInWithGoogle = async () => {
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectToUrl,
        queryParams: { prompt: "select_account" },
      },
    });

    if (authError) {
      console.error(authError);
      setError("Login failed. Please try again.");
      setLoading(false); // Only reset loading on error; if successful, the page redirects away anyway.
    }
  };

  return (
    <Box
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
      bgcolor="#f8fafc"
    >
      <Typography fontSize={28} fontWeight={600}>
        Admin Dashboard
      </Typography>

      <Button
        variant="contained"
        onClick={signInWithGoogle}
        disabled={loading}
        size="large"
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Sign in with Google"}
      </Button>

      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
}