import "./App.css";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Room from "./pages/Room";
import MainPage from "./pages/MainPage";
import { SnackbarProvider } from "./stores/snackbarStore";
import { GameStateProvider } from "./stores/gameStore";

function App() {
  return (
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
  );
}

export default App;
