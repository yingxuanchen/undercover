import { useContext } from "react";
import { gameStore } from "../stores/gameStore";
import { Table, TableBody, TableCell, TableRow } from "@mui/material";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import { roles, RoleType } from "../shared/types";

export default function UserList() {
  const { state: gameState } = useContext(gameStore);
  const { room } = gameState;

  if (!room) {
    return <>No data</>;
  }

  return (
    <Table sx={{ margin: "0 auto", width: "auto" }}>
      <TableBody>
        {room.users.map((roomUser, index) => (
          <TableRow key={index}>
            <TableCell>{roomUser.isHost ? "👑" : ""}</TableCell>
            <TableCell>{roomUser.isOut ? <s>{roomUser.name}</s> : roomUser.name}</TableCell>
            <TableCell>{room.currentTurn === index ? "🎙️" : ""}</TableCell>
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
