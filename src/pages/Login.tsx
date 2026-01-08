import { Box, Button, Typography } from "@mui/material";
import { supabase } from "../lib/supabase";
import { useState } from "react";

export default function Login() {
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `https://pasindu-promodh.github.io/lootbox-dashboard/`,
        // redirectTo: `http://localhost:5173`,
        queryParams: {
          // access_type: 'offline',
          // prompt: 'consent',
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setError("Login failed");
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
    >
      <Typography variant="h4">Admin Dashboard</Typography>
      <Button variant="contained" onClick={signInWithGoogle}>
        Sign in with Google
      </Button>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  );
}
