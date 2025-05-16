import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Room from "./pages/Room";
import MainPage from "./pages/MainPage";
import { SnackbarProvider } from "./stores/snackbarStore";
import { GameStateProvider } from "./stores/gameStore";

const router = createBrowserRouter([
  { path: "/room", element: <Room /> },
  { path: "/", element: <MainPage /> },
]);

function App() {
  return (
    <SnackbarProvider>
      <GameStateProvider>
        <RouterProvider router={router} />
      </GameStateProvider>
    </SnackbarProvider>
  );
}

export default App;
