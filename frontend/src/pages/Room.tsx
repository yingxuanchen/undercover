import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gameStore } from "../stores/gameStore";
import AlertDialog, { closedDialogArgs, type AlertDialogProps } from "../components/AlertDialog";
import {
  Backdrop,
  CircularProgress,
  Typography,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
  Chip,
  TextField,
  MenuItem,
} from "@mui/material";
import RoomInfo from "../components/RoomInfo";
import { io } from "socket.io-client";
import type { User } from "../shared/types";
import { backendUrl, getCurrentTurnUser, getMinMaxAntiBlank } from "../shared/utils";
import UserList from "../components/UserList";
import fetcher from "../shared/fetcher";
import FlippingWordCard from "../components/FlippingWordCard";

const languages = [
  { prop: "english", label: "English" },
  { prop: "chinese", label: "Chinese" },
];

function Room() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId, username } = location.state || {};

  const { state: gameState, dispatch } = useContext(gameStore);
  const { room, user } = gameState;

  const [roleCounts, setRoleCounts] = useState({
    antiCount: 1,
    blankCount: 0,
  });
  const [chosenUserState, setChosenUserState] = useState<number>(-1);

  const [dialogPropsState, setDialogPropsState] = useState<AlertDialogProps>({ ...closedDialogArgs });

  const [messageState, setMessageState] = useState("");
  const [randomOrderState, _setRandomOrderState] = useState(false);
  const [languageState, setLanguageState] = useState(languages.map((el) => el.prop));
  const [backdropState, setBackdropState] = useState(false);

  const languageError = languageState.length < 1;

  const handleCloseDialog = () => {
    setDialogPropsState({ ...closedDialogArgs });
  };

  const displayErrorDialog = () => {
    setDialogPropsState({
      open: true,
      onClose: handleCloseDialog,
      title: "Server Error",
      message: "Please try again later.",
      onCancel: null,
      onConfirm: handleCloseDialog,
    });
  };

  useEffect(() => {
    const socket = io(backendUrl, { withCredentials: true });
    socket.on("room" + roomId, (data) => {
      dispatch({ room: data.room });
      const roomUser = data.room.users.find((roomUser: User) => roomUser.name === username);
      if (roomUser) {
        dispatch({ user: roomUser });
      }

      if (data.userVotedOut !== undefined && data.userVotedOut !== null) {
        const usernameVotedOut = data.room.users[data.userVotedOut].name;
        setMessageState(`${usernameVotedOut} was voted out!`);
        setChosenUserState(-1);
      } else {
        setMessageState("");
      }
    });

    return () => {
      // confirmLeaveGame();
      socket.close();
      console.log(`Client disconnected: id=${socket.id}, roomId=${roomId}, username=${username}`);
    };
  }, []);

  useEffect(() => {
    if (!roomId || !username) {
      navigate("/", { replace: true });
    }

    setBackdropState(true);

    fetcher
      .post(`/room`, { roomId: roomId, username: username })
      .then((res) => {
        setBackdropState(false);
        dispatch({ room: res.data.room, user: res.data.user });
      })
      .catch((_err) => {
        setBackdropState(false);
        displayErrorDialog();
      });
  }, [roomId, username, dispatch]);

  const handleRoleCountsChange = (antiCount: number, blankCount: number) => {
    setRoleCounts({ antiCount: antiCount, blankCount: blankCount });
  };

  const handleChooseLanguage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setLanguageState(languageState.concat([event.target.name]));
    } else {
      setLanguageState(languageState.filter((lang) => lang !== event.target.name));
    }
  };

  // const handleOrderSwitch = () => {
  //   setRandomOrderState(!randomOrderState);
  // };

  const handleLeaveRoom = () => {
    setBackdropState(true);

    fetcher
      .post(`/leave-room`, { roomId: roomId, username: username })
      .then((_res) => {
        return navigate("/", { replace: true });
      })
      .catch((_err) => {
        setBackdropState(false);
        displayErrorDialog();
      });
  };

  if (!room || !user) {
    return null;
  }

  const handleStartGame = () => {
    const { minAnti, maxAnti, minBlank, maxBlank } = getMinMaxAntiBlank(room.totalCount);
    if (
      roleCounts.antiCount < minAnti ||
      roleCounts.antiCount > maxAnti ||
      roleCounts.blankCount < minBlank ||
      roleCounts.blankCount > maxBlank
    ) {
      return;
    }

    setBackdropState(true);

    fetcher
      .post(`/start-game`, {
        room: {
          roomId: roomId,
          antiCount: roleCounts.antiCount,
          blankCount: roleCounts.blankCount,
          users: room.users,
        },
        randomOrder: randomOrderState,
        languageArray: languageState,
      })
      .then((_res) => {
        setBackdropState(false);
      })
      .catch((_err) => {
        setBackdropState(false);
        displayErrorDialog();
      });
  };

  const handleEndGame = () => {
    setDialogPropsState({
      open: true,
      onClose: handleCloseDialog,
      title: "Confirm End Game?",
      message: "The game will end and all words will be shown to all users.",
      onCancel: handleCloseDialog,
      onConfirm: confirmEndGame,
    });
  };

  const confirmEndGame = () => {
    setDialogPropsState({ ...closedDialogArgs });
    setBackdropState(true);

    fetcher
      .post(`/end-game`, { roomId: roomId })
      .then((_res) => {
        setBackdropState(false);
      })
      .catch((_err) => {
        setBackdropState(false);
        displayErrorDialog();
      });
  };

  const handleLeaveGame = () => {
    setDialogPropsState({
      open: true,
      onClose: handleCloseDialog,
      title: "Confirm Leave Game?",
      message: "All users will go back to the waiting area.",
      onCancel: handleCloseDialog,
      onConfirm: confirmLeaveGame,
    });
  };

  const confirmLeaveGame = () => {
    setDialogPropsState({ ...closedDialogArgs });
    setBackdropState(true);

    fetcher
      .post(`/leave-game`, { roomId: roomId })
      .then((_res) => {
        setBackdropState(false);
      })
      .catch((_err) => {
        setBackdropState(false);
        displayErrorDialog();
      });
  };

  const handleEndTurn = () => {
    setBackdropState(true);

    fetcher
      .post(`/end-turn`, { roomId: roomId })
      .then((_res) => {
        setBackdropState(false);
      })
      .catch((_err) => {
        setBackdropState(false);
        displayErrorDialog();
      });
  };

  const handleChooseUser = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChosenUserState(parseInt(event.target.value, 10));
  };

  const handleVote = () => {
    if (chosenUserState === -1) {
      return;
    }

    if (room.currentTurn === "hostVoting") {
      setDialogPropsState({
        open: true,
        onClose: handleCloseDialog,
        title: "Confirm Vote?",
        message: "Please make sure it has been agreed by all players.",
        onCancel: handleCloseDialog,
        onConfirm: confirmHostVote,
      });
    } else {
      setBackdropState(true);

      fetcher
        .post(`/vote`, { roomId: roomId, username: username, chosenUser: chosenUserState })
        .then((_res) => {
          setBackdropState(false);
        })
        .catch((_err) => {
          setBackdropState(false);
          displayErrorDialog();
        });
    }
  };

  const confirmHostVote = () => {
    setDialogPropsState({ ...closedDialogArgs });
    setBackdropState(true);

    fetcher
      .post(`/host-vote`, { roomId: roomId, chosenUser: chosenUserState })
      .then((_res) => {
        setBackdropState(false);
      })
      .catch((_err) => {
        setBackdropState(false);
        displayErrorDialog();
      });
  };

  const getWinnerMessage = (winner: string | number) => {
    if (winner === undefined) {
      return "There is no winner as the game was ended prematurely.";
    }
    if (typeof winner === "number") {
      return `${room.users[winner].name} wins as the only Blank left!`;
    }
    let groupName = "";
    switch (winner) {
      case "norm":
        groupName = "Civilians";
        break;
      case "anti":
        groupName = "Undercovers";
        break;
      case "blank":
        groupName = "Blanks";
        break;
      default:
        groupName = "Unknown";
        break;
    }
    return `The ${groupName} win!`;
  };

  return (
    room &&
    user && (
      <>
        <Backdrop className="backdrop" open={backdropState}>
          <CircularProgress color="inherit" />
        </Backdrop>

        {room.hasStarted && <FlippingWordCard word={user.card} />}

        <Stack spacing={1} alignItems="center" sx={{ marginTop: room.hasStarted ? "6rem" : 0 }}>
          {!room.hasStarted && (
            <Button variant="outlined" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          )}

          {!room.hasStarted && user.isHost && (
            <>
              <FormControl error={languageError} component="fieldset">
                <FormLabel component="legend">Language: </FormLabel>
                <FormGroup sx={{ flexDirection: "initial" }}>
                  {languages.map((lang) => {
                    return (
                      <FormControlLabel
                        key={lang.prop}
                        control={
                          <Checkbox
                            checked={languageState.includes(lang.prop)}
                            onChange={handleChooseLanguage}
                            name={lang.prop}
                          />
                        }
                        label={lang.label}
                      />
                    );
                  })}
                </FormGroup>
              </FormControl>
              {/* <Grid container alignItems="center" justifyContent="center" spacing={1}>
              <Grid>Follow Order</Grid>
              <Grid>
                <Switch checked={randomOrderState} onChange={handleOrderSwitch} />
              </Grid>
              <Grid>Random Order</Grid>
            </Grid> */}
              <Button
                variant="contained"
                onClick={handleStartGame}
                disabled={room.totalCount < 3 || languageError ? true : false}
              >
                Start Game
              </Button>
            </>
          )}

          {room.hasStarted && room.currentTurn !== "ended" && user.isHost && (
            <Button variant="outlined" onClick={handleEndGame}>
              End Game
            </Button>
          )}

          {room.currentTurn === "ended" && user.isHost && (
            <Button variant="contained" onClick={handleLeaveGame}>
              Leave Game
            </Button>
          )}

          <Typography variant="body1" color="secondary" sx={{ whiteSpace: "pre-line" }}>
            {!room.hasStarted && !user.isHost && room.totalCount >= 3 && `Waiting for host to start game...`}
            {!room.hasStarted && room.totalCount < 3 ? "Need at least 3 players to start game" : ""}
            {room.currentTurn === "hostVoting" &&
              `There is a tie in votes among:
          ${room.users
            .map((roomUser) => roomUser.name)
            .filter((_name, index) => room.usersWithMostVotes.includes(index))
            .join(", ")}
          Please discuss and host will vote in the system`}
            {messageState ? messageState + "\n" : ""}
            {room.currentTurn === "ended" &&
              `Game has ended!
          ${getWinnerMessage(room.winner)}`}
          </Typography>

          {typeof room.currentTurn === "number" && (
            <>
              <div>Current turn: {getCurrentTurnUser(room.users, room.currentTurn)}</div>
              <Button
                variant="contained"
                onClick={handleEndTurn}
                disabled={room.users[room.currentTurn].name !== user.name}
              >
                End Turn
              </Button>
            </>
          )}

          {(room.currentTurn === "voting" || room.currentTurn === "hostVoting") && (
            <>
              <div>Current turn: Voting</div>
              <TextField
                sx={{ width: "10rem" }}
                select
                variant="standard"
                value={chosenUserState}
                disabled={user.hasVoted}
                onChange={handleChooseUser}
              >
                <MenuItem value={-1} disabled>
                  Choose a bad guy
                </MenuItem>
                {room.users.map((roomUser, index) => {
                  return (
                    <MenuItem
                      key={index}
                      value={index}
                      disabled={
                        roomUser.isOut ||
                        (room.currentTurn === "hostVoting" && !room.usersWithMostVotes.includes(index))
                      }
                    >
                      {roomUser.name}
                    </MenuItem>
                  );
                })}
              </TextField>
              <Button
                variant="contained"
                disabled={
                  (room.currentTurn === "hostVoting" && !user.isHost) ||
                  (room.currentTurn === "voting" && user.isOut) ||
                  user.hasVoted
                }
                onClick={handleVote}
              >
                Vote
              </Button>
            </>
          )}
        </Stack>

        <Divider sx={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <Chip label={`Room Id: ${room.roomId}`} />
        </Divider>
        <div>
          <RoomInfo roleCounts={roleCounts} handleRoleCountsChange={handleRoleCountsChange} />
        </div>

        <Divider sx={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <Chip label={`Players`} />
        </Divider>

        <UserList />

        <AlertDialog
          open={dialogPropsState.open}
          onClose={dialogPropsState.onClose}
          title={dialogPropsState.title}
          message={dialogPropsState.message}
          onCancel={dialogPropsState.onCancel}
          onConfirm={dialogPropsState.onConfirm}
        />
      </>
    )
  );
}

export default Room;
