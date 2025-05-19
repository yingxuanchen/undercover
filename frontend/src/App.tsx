import "./App.css";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Room from "./pages/Room";
import MainPage from "./pages/MainPage";
import { SnackbarProvider } from "./stores/snackbarStore";
import { GameStateProvider } from "./stores/gameStore";
import { createTheme, CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { useMemo } from "react";

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <GameStateProvider>
          <HashRouter>
            <Routes>
              <Route path="/room" element={<Room />} />
              <Route path="/" element={<MainPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </GameStateProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
