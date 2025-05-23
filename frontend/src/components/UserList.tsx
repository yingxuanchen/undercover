import { useContext } from "react";
import { gameStore } from "../stores/gameStore";
import { Table, TableBody, TableCell, TableRow } from "@mui/material";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import { roles, RoleType } from "../shared/types";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

interface Props {
  handleKickUser: (username: string) => void;
}

export default function UserList({ handleKickUser }: Props) {
  const { state: gameState } = useContext(gameStore);
  const { room, user } = gameState;

  if (!room || !user) {
    return <>No data</>;
  }

  return (
    <Table sx={{ margin: "0 auto", width: "auto" }}>
      <TableBody>
        {room.users.map((roomUser, index) => (
          <TableRow key={index}>
            <TableCell>{roomUser.isHost ? "👑" : ""}</TableCell>
            <TableCell>{roomUser.isOut ? <s>{roomUser.name}</s> : roomUser.name}</TableCell>
            {!room.hasStarted && user.isHost && !roomUser.isHost && (
              <TableCell>
                <span style={{ display: "flex" }} onClick={() => handleKickUser(roomUser.name)}>
                  <RemoveCircleOutlineIcon fontSize="small" color="error" />
                </span>
              </TableCell>
            )}
            <TableCell>{room.currentTurn === index ? "🎙️" : ""}</TableCell>
            {room.currentTurn === "voting" && (
              <TableCell>
                {roomUser.hasVoted && (
                  <span style={{ display: "flex" }}>
                    <HowToVoteIcon fontSize="small" />
                  </span>
                )}
              </TableCell>
            )}
            {room.currentTurn === "ended" && (
              <>
                <TableCell>{roomUser.card}</TableCell>
                <TableCell>
                  <span style={{ display: "flex" }}>
                    <AccessibilityNewIcon sx={{ color: roles[RoleType[roomUser.role]].color }} fontSize="small" />
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
