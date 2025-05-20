import { useContext } from "react";
import { gameStore } from "../stores/gameStore";
import { Button, Stack, Grid, Typography } from "@mui/material";
import { getUserString } from "../shared/utils";

interface Props {
  handleEndTurn: () => void;
}

export default function ActionBox({ handleEndTurn }: Props) {
  const { state: gameState } = useContext(gameStore);
  const { room, user } = gameState;

  if (!room || !user) {
    return <>No data</>;
  }

  return (
    <>
      <h4>Players</h4>
      <Stack spacing={2}>
        {room.users.map((roomUser, index) => (
          <Grid container key={index} alignItems="center">
            <Grid size="grow"></Grid>
            <Grid size="auto">
              <Typography>{getUserString(roomUser, index, room.currentTurn)}</Typography>
            </Grid>
            <Grid size="grow">
              {roomUser.name === user.name && room.currentTurn === index && (
                <Button variant="contained" color="primary" onClick={handleEndTurn}>
                  End Turn
                </Button>
              )}
            </Grid>
          </Grid>
        ))}
      </Stack>
    </>
  );
}
