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
  FormHelperText,
  RadioGroup,
  Radio,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import RoomInfo from "../components/RoomInfo";
import { io } from "socket.io-client";
import type { User } from "../shared/types";
import { backendUrl, getMinMaxAntiBlank, getUserString } from "../shared/utils";
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
  const [chosenUserState, setChosenUserState] = useState<number | null>(null);

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
        setChosenUserState(null);
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
    if (chosenUserState === null) {
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

  const getVoteMessage = () => {
    if (room.currentTurn === "hostVoting") {
      return "";
    }
    if (user.isOut) {
      return "You cannot vote because you are out";
    }
    if (user.hasVoted) {
      return "Please wait for others to vote";
    }
    if (!chosenUserState) {
      return "Please choose a user";
    }
    return "";
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
      <div>
        <Backdrop className="backdrop" open={backdropState}>
          <CircularProgress color="inherit" />
        </Backdrop>

        {room.hasStarted && <FlippingWordCard word={user.card} />}

        <Typography variant="h6">
          <Stack spacing={1} alignItems="center">
            {!room.hasStarted && (
              <Button variant="contained" onClick={handleLeaveRoom}>
                Leave Room
              </Button>
            )}
            {user.isHost && !room.hasStarted && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartGame}
                disabled={room.totalCount < 3 || languageError ? true : false}
              >
                Start Game
              </Button>
            )}
            {user.isHost && room.hasStarted && !(room.currentTurn === "ended") && (
              <Button variant="contained" onClick={handleEndGame} style={{ marginTop: "6rem" }}>
                End Game
              </Button>
            )}
            {user.isHost && room.currentTurn === "ended" && (
              <Button variant="contained" onClick={handleLeaveGame} style={{ marginTop: "6rem" }}>
                Leave Game
              </Button>
            )}
          </Stack>
        </Typography>

        <Typography variant="h6" color="primary" sx={{ whiteSpace: "pre-line" }}>
          {!room.hasStarted && !user.isHost && room.totalCount >= 3 && `Waiting for host to start game...`}
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

        {!room.hasStarted && (
          <Typography sx={{ whiteSpace: "pre-line" }} color="error">
            {room.totalCount < 3 ? "Game must have at least 3 players" : ""}
          </Typography>
        )}

        {!room.hasStarted && user.isHost && (
          <Typography component="div">
            <p></p>
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
                          color="primary"
                        />
                      }
                      label={lang.label}
                    />
                  );
                })}
              </FormGroup>
              {languageError && <FormHelperText>Please choose at least 1 language</FormHelperText>}
            </FormControl>
            {/* <Grid container alignItems="center" justifyContent="center" spacing={1}>
              <Grid>Follow Order</Grid>
              <Grid>
                <Switch checked={randomOrderState} onChange={handleOrderSwitch} color="primary" />
              </Grid>
              <Grid>Random Order</Grid>
            </Grid> */}
          </Typography>
        )}

        <Divider>
          <Chip label={`Room Id: ${room.roomId}`} />
        </Divider>
        <div style={{ marginTop: "1rem" }}>
          <RoomInfo roleCounts={roleCounts} handleRoleCountsChange={handleRoleCountsChange} />
        </div>
        <Divider />

        {room.hasStarted && (room.currentTurn === "voting" || room.currentTurn === "hostVoting") ? (
          <>
            <br />
            <FormControl component="fieldset">
              <FormLabel component="legend">Users</FormLabel>
              <RadioGroup aria-label="users" name="users" value={chosenUserState} onChange={handleChooseUser}>
                {room.users.map((roomUser, index) => {
                  return (
                    <FormControlLabel
                      key={index}
                      value={index}
                      disabled={
                        roomUser.isOut ||
                        user.hasVoted ||
                        (room.currentTurn === "hostVoting" && !room.usersWithMostVotes.includes(index))
                      }
                      control={<Radio />}
                      label={getUserString(roomUser, index, room.currentTurn)}
                    />
                  );
                })}
              </RadioGroup>
              <FormHelperText>{getVoteMessage()}</FormHelperText>
              <Button
                variant="contained"
                color="primary"
                disabled={
                  (room.currentTurn === "hostVoting" && !user.isHost) ||
                  (room.currentTurn === "voting" && user.isOut) ||
                  user.hasVoted
                }
                onClick={handleVote}
              >
                Vote
              </Button>
            </FormControl>
            <p></p>
          </>
        ) : !room.hasStarted && user.isHost && !randomOrderState ? (
          <UserList handleEndTurn={handleEndTurn} />
        ) : room.users !== undefined ? (
          <UserList handleEndTurn={handleEndTurn} />
        ) : null}

        <AlertDialog
          open={dialogPropsState.open}
          onClose={dialogPropsState.onClose}
          title={dialogPropsState.title}
          message={dialogPropsState.message}
          onCancel={dialogPropsState.onCancel}
          onConfirm={dialogPropsState.onConfirm}
        />
      </div>
    )
  );
}

export default Room;
