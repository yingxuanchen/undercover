import { useContext } from "react";
import { gameStore } from "../stores/gameStore";
import { Grid, TextField } from "@mui/material";

interface Props {
  inputState: { antiCount: number; blankCount: number };
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function RoomInfo({ inputState, handleInputChange }: Props) {
  const { state: gameState } = useContext(gameStore);
  const { room, user } = gameState;

  if (!room || !user) {
    return <>No data</>;
  }

  return (
    <Grid container className="room-info" spacing={1}>
      <Grid size={6}>Room Id:</Grid>
      <Grid size={6}>{room.roomId}</Grid>

      <Grid size={6}>Total:</Grid>
      <Grid size={6}>{room.totalCount}</Grid>

      {(room.hasStarted || user.isHost) && (
        <>
          <Grid size={6}>Undercover:</Grid>
          <Grid size={6}>
            {user.isHost && !room.hasStarted ? (
              <TextField
                type="number"
                id="antiCount"
                name="antiCount"
                label="Undercover"
                value={inputState.antiCount}
                onChange={handleInputChange}
              />
            ) : (
              room.antiCount
            )}
          </Grid>

          <Grid size={6}>Blank:</Grid>
          <Grid size={6}>
            {user.isHost && !room.hasStarted ? (
              <TextField
                type="number"
                id="blankCount"
                name="blankCount"
                label="Blank"
                value={inputState.blankCount}
                onChange={handleInputChange}
              />
            ) : (
              room.blankCount
            )}
          </Grid>
        </>
      )}
    </Grid>
  );
}
