import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onCancel: null | (() => void);
  onConfirm: (username?: string) => void;
}

export const closedDialogArgs = {
  open: false,
  onClose: () => {},
  title: "",
  message: "",
  onCancel: null,
  onConfirm: () => {},
};

export default function AlertDialog({ open, onClose, title, message, onCancel, onConfirm }: AlertDialogProps) {
  return (
    <div>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
          <Button onClick={() => onConfirm()} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
