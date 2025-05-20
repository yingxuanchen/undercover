import { useContext, useEffect, useState } from "react";
import { gameStore } from "../stores/gameStore";
import { Button, Checkbox, FormControlLabel, Stack, Tooltip } from "@mui/material";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import { getMinMaxAntiBlank } from "../shared/utils";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

enum RoleType {
  normal,
  anti,
  blank,
}

interface Role {
  label: string;
  color: string;
}

const roles: Record<RoleType, Role> = {
  [RoleType.normal]: { label: "Civilian", color: "green" },
  [RoleType.anti]: { label: "Undercover", color: "red" },
  [RoleType.blank]: { label: "Blank", color: "gray" },
};

interface Props {
  roleCounts: { antiCount: number; blankCount: number };
  handleRoleCountsChange: (antiCount: number, blankCount: number) => void;
}

export default function RoomInfo({ roleCounts, handleRoleCountsChange }: Props) {
  const { antiCount, blankCount } = roleCounts;
  const { state: gameState } = useContext(gameStore);
  const { room, user } = gameState;
  const [roleList, setRoleList] = useState<Role[]>([]);

  if (!room || !user) {
    return <>No data</>;
  }

  const { minAnti, maxAnti, minBlank, maxBlank } = getMinMaxAntiBlank(room.totalCount);

  useEffect(() => {
    const newColorList = [];
    const thisAntiCount = room.hasStarted ? room.antiCount : antiCount;
    const thisBlankCount = room.hasStarted ? room.blankCount : blankCount;

    for (let i = 0; i < room.totalCount - thisAntiCount - thisBlankCount; i++) {
      newColorList.push(roles[RoleType.normal]);
    }
    for (let i = 0; i < thisAntiCount; i++) {
      newColorList.push(roles[RoleType.anti]);
    }
    for (let i = 0; i < thisBlankCount; i++) {
      newColorList.push(roles[RoleType.blank]);
    }
    setRoleList(newColorList);
  }, [room, roleCounts]);

  const handleBlankChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    const newBlankCount = isChecked ? 1 : 0;
    handleRoleCountsChange(antiCount, newBlankCount);
  };

  const handleRoleChange = (role: Role) => {
    if (room.hasStarted || !user.isHost) {
      return;
    }
    if (role === roles[RoleType.blank]) {
      return;
    }
    if (role === roles[RoleType.anti] && antiCount <= 1) {
      return;
    }
    if (role === roles[RoleType.normal] && antiCount >= getMinMaxAntiBlank(room.totalCount).maxAnti) {
      return;
    }
    handleRoleCountsChange(role === roles[RoleType.normal] ? antiCount + 1 : antiCount - 1, blankCount);
  };

  return (
    <Stack spacing={1}>
      <div>Room Id: {room.roomId}</div>
      <div style={{ display: "flex" }}>
        <Tooltip
          title={
            <>
              Undercover: min {minAnti}, max {maxAnti}
              <br />
              Blank: min {minBlank}, max {maxBlank}
            </>
          }
        >
          <Button>
            <HelpOutlineIcon fontSize="small" />
          </Button>
        </Tooltip>
        {roleList.map((role, i) => (
          <span key={i} style={{ display: "inline-block", margin: "0 5px" }}>
            <AccessibilityNewIcon fontSize="large" sx={{ color: role.color }} onClick={() => handleRoleChange(role)} />
            <div style={{ fontSize: "14px" }}>{role.label}</div>
          </span>
        ))}
      </div>

      {!room.hasStarted && user.isHost && (
        <FormControlLabel
          control={<Checkbox checked={blankCount === 1} onChange={handleBlankChange} name="blank" />}
          label="Include blank?"
          disabled={room.totalCount < 4}
        />
      )}
    </Stack>
  );
}
