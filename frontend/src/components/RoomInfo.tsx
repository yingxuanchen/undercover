import { useContext, useEffect, useState } from "react";
import { gameStore } from "../stores/gameStore";
import { Button, Checkbox, ClickAwayListener, FormControlLabel, Stack, Tooltip } from "@mui/material";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import { getMinMaxAntiBlank } from "../shared/utils";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { roles, RoleType, type Role } from "../shared/types";

interface Props {
  roleCounts: { antiCount: number; blankCount: number };
  handleRoleCountsChange: (antiCount: number, blankCount: number) => void;
}

export default function RoomInfo({ roleCounts, handleRoleCountsChange }: Props) {
  const { antiCount, blankCount } = roleCounts;
  const { state: gameState } = useContext(gameStore);
  const { room, user } = gameState;
  const [roleList, setRoleList] = useState<Role[]>([]);
  const [openTooltip, setOpenTooltip] = useState(false);

  if (!room || !user) {
    return <>No data</>;
  }

  const { minAnti, maxAnti, minBlank, maxBlank } = getMinMaxAntiBlank(room.totalCount);

  useEffect(() => {
    const newColorList = [];
    const thisAntiCount = room.hasStarted ? room.antiCount : antiCount;
    const thisBlankCount = room.hasStarted ? room.blankCount : blankCount;

    for (let i = 0; i < room.totalCount - thisAntiCount - thisBlankCount; i++) {
      newColorList.push(roles[RoleType.norm]);
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
    if (role === roles[RoleType.norm] && antiCount >= getMinMaxAntiBlank(room.totalCount).maxAnti) {
      return;
    }
    handleRoleCountsChange(role === roles[RoleType.norm] ? antiCount + 1 : antiCount - 1, blankCount);
  };

  const handleTooltipClose = () => {
    setOpenTooltip(false);
  };

  const handleTooltipOpen = () => {
    setOpenTooltip(true);
  };

  return (
    <Stack spacing={1} alignItems="center">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          overflow: "visible",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px 10px",
        }}
      >
        {roleList.map((role, i) => (
          <span key={i}>
            <AccessibilityNewIcon fontSize="large" sx={{ color: role.color }} onClick={() => handleRoleChange(role)} />
            <div style={{ fontSize: "14px" }}>{role.label}</div>
          </span>
        ))}
      </div>

      {!room.hasStarted && user.isHost && (
        <span>
          <FormControlLabel
            control={<Checkbox checked={blankCount === 1} onChange={handleBlankChange} name="blank" />}
            label="Include blank?"
            disabled={room.totalCount < 4}
          />
          <ClickAwayListener onClickAway={handleTooltipClose}>
            <Tooltip
              onClose={handleTooltipClose}
              open={openTooltip}
              disableFocusListener
              disableHoverListener
              disableTouchListener
              title={
                <>
                  Undercover: min {minAnti}, max {maxAnti}
                  <br />
                  Blank: min {minBlank}, max {maxBlank}
                </>
              }
              slotProps={{
                popper: {
                  disablePortal: true,
                },
              }}
            >
              <Button onClick={handleTooltipOpen} size="small" variant="text" sx={{ minWidth: "0px" }}>
                <HelpOutlineIcon fontSize="small" />
              </Button>
            </Tooltip>
          </ClickAwayListener>
        </span>
      )}
    </Stack>
  );
}
