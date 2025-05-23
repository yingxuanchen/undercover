import "./App.css";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Room from "./pages/Room";
import MainPage from "./pages/MainPage";
import { SnackbarProvider } from "./stores/snackbarStore";
import { GameStateProvider } from "./stores/gameStore";
import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { useMemo } from "react";

const router = createBrowserRouter([
  { path: "/room", element: <Room /> },
  { path: "/", element: <MainPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
        components: {
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: "none",
                padding: "4px",
              },
            },
          },
          MuiCardContent: {
            styleOverrides: {
              root: {
                ":last-child": {
                  paddingBottom: "0px",
                },
              },
            },
          },
        },
      }),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <GameStateProvider>
          <RouterProvider router={router} />
        </GameStateProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
