import { useContext } from "react";
import { gameStore } from "../stores/gameStore";
import { List, ListSubheader, ListItem, ListItemText, Button } from "@mui/material";
import React from "react";
import { getUserString } from "../shared/utils";

interface Props {
  username: string;
  handleEndTurn: () => void;
}

export default function UserList({ username, handleEndTurn }: Props) {
  const { state: gameState } = useContext(gameStore);
  const { room } = gameState;

  if (!room) {
    return <>No data</>;
  }

  return (
    <List subheader={<ListSubheader sx={{ lineHeight: 1.5, marginTop: "2em" }}>Players</ListSubheader>}>
      {room.users.map((user, index) => {
        return (
          <React.Fragment key={index}>
            <ListItem sx={{ textAlign: "center" }}>
              <ListItemText primary={getUserString(user, index, room.currentTurn, username)} />
            </ListItem>
            {user.name === username && room.currentTurn === index && (
              <Button variant="contained" color="primary" onClick={handleEndTurn}>
                End Turn
              </Button>
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
}
