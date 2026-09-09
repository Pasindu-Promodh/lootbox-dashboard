// import { Box, Button, Typography } from "@mui/material";
// import { supabase } from "../lib/supabase";
// import { useState } from "react";

// export default function Login() {
//   const [error, setError] = useState("");

//   const signInWithGoogle = async () => {
//     setError("");
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         // redirectTo: `https://pasindu-promodh.github.io/lootbox-dashboard/`,
//         redirectTo: `http://localhost:5173`,
//         queryParams: {
//           // access_type: 'offline',
//           // prompt: 'consent',
//           prompt: "select_account",
//         },
//       },
//     });

//     if (error) {
//       setError("Login failed");
//     }
//   };

//   return (
//     <Box
//       height="100vh"
//       display="flex"
//       flexDirection="column"
//       justifyContent="center"
//       alignItems="center"
//       gap={2}
//     >
//       <Typography variant="h4">Admin Dashboard</Typography>
//       <Button variant="contained" onClick={signInWithGoogle}>
//         Sign in with Google
//       </Button>
//       {error && (
//         <Typography color="error" variant="body2">
//           {error}
//         </Typography>
//       )}
//     </Box>
//   );
// }



import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { supabase } from "../lib/supabase";
import { useState } from "react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    setError("");
    setLoading(true);

    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // redirectTo: "https://pasindu-promodh.github.io/lootbox-dashboard/",
          redirectTo: `http://localhost:5173`,
          queryParams: { prompt: "select_account" },
        },
      });
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
      setLoading(false);
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
        {loading ? <CircularProgress size={24} /> : "Sign in with Google"}
      </Button>

      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
}
