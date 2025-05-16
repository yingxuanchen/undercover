import { Alert, type AlertColor, Snackbar } from "@mui/material";
import { createContext, type SetStateAction, useState } from "react";

export interface SnackbarState {
  message?: string;
  severity?: AlertColor;
  open: boolean;
}

const initialState = {
  open: false,
};

const snackbarStore = createContext<{
  snackbar: SnackbarState;
  setSnackbar: React.Dispatch<SetStateAction<SnackbarState>>;
}>({ snackbar: initialState, setSnackbar: () => null });

const { Provider } = snackbarStore;

interface Props {
  children: React.ReactNode;
}

function SnackbarProvider({ children }: Props): React.ReactNode {
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialState);
  const { message, severity, open } = snackbar;

  const handleClose = () => {
    setSnackbar(initialState);
  };

  return (
    <Provider value={{ snackbar, setSnackbar }}>
      {message && severity && (
        <Snackbar
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={open}
          autoHideDuration={5000}
          onClose={handleClose}
        >
          <Alert onClose={handleClose} severity={severity} sx={{ whiteSpace: "pre-wrap" }}>
            {message}
          </Alert>
        </Snackbar>
      )}
      {children}
    </Provider>
  );
}

export { snackbarStore, SnackbarProvider };
