import { Backdrop, CircularProgress, TextField, Button, Typography, Stack } from "@mui/material";
import { useState, useEffect } from "react";
import AlertDialog, { closedDialogArgs, type AlertDialogProps } from "../components/AlertDialog";
import { useNavigate } from "react-router-dom";
import fetcher from "../shared/fetcher";

function MainPage() {
  const navigate = useNavigate();

  const [inputState, setInputState] = useState({
    roomId: "",
    username: "",
  });
  const [roomIdErrorState, setRoomIdErrorState] = useState({
    error: false,
    helperText: "",
  });
  const [usernameErrorState, setUsernameErrorState] = useState({
    error: false,
    helperText: "",
  });
  const [backdropState, setBackdropState] = useState(false);

  const [dialogPropsState, setDialogPropsState] = useState<AlertDialogProps>({ ...closedDialogArgs });

  useEffect(() => {
    setBackdropState(true);

    fetcher
      .get(`/check-session`)
      .then((res) => {
        setBackdropState(false);
        if (res.data.roomId && res.data.username) {
          navigate("/room", { state: { roomId: res.data.roomId, username: res.data.username } });
        }
      })
      .catch((_err) => {
        setBackdropState(false);
        displayErrorDialog();
      });
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (value.trim() === "") {
      if (name === "roomId") {
        setRoomIdErrorState({ error: true, helperText: "Room Id cannot be blank" });
      }
      if (name === "username") {
        setUsernameErrorState({ error: true, helperText: "Username cannot be blank" });
      }
      return;
    }

    setRoomIdErrorState({ error: false, helperText: "" });
    setUsernameErrorState({ error: false, helperText: "" });

    const updatedInputState = { ...inputState, [name]: value };
    setInputState(updatedInputState);
  };

  const handleEnterRoom = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setBackdropState(true);

    setRoomIdErrorState({ error: false, helperText: "" });
    setUsernameErrorState({ error: false, helperText: "" });

    fetcher
      .post(`/enter-room`, inputState)
      .then((_res) => {
        navigate("/room", { state: { roomId: inputState.roomId, username: inputState.username } });
      })
      .catch((err) => {
        setBackdropState(false);
        const error = err.response.data.error;
        if (error === "game has started") {
          setRoomIdErrorState({
            error: true,
            helperText: "Game has started in this room",
          });
        } else if (error === "username already exists") {
          setUsernameErrorState({
            error: true,
            helperText: "Username already exists in this room",
          });
        }
      });
  };

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

  return (
    <div style={{ overflowX: "hidden" }}>
      <Backdrop className="backdrop" open={backdropState}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <form onSubmit={handleEnterRoom}>
        <Stack spacing={3} alignItems="center">
          <TextField
            required
            id="roomId"
            name="roomId"
            label="Room Id"
            onChange={handleInputChange}
            {...roomIdErrorState}
          />
          <TextField
            required
            id="username"
            name="username"
            label="Username"
            onChange={handleInputChange}
            {...usernameErrorState}
          />
          <Button variant="contained" type="submit">
            Enter Room
          </Button>
        </Stack>
      </form>
      <Typography variant="subtitle2" color="error" sx={{ marginTop: "1em", marginBottom: "1em" }}>
        Note: If you find that your game is not synchronized with other players at any point of time, please refresh
        your page.
      </Typography>
      <Typography variant="h6">Game Rules</Typography>
      <Typography variant="body2" align="left" component={"div"} sx={{ marginRight: "1em" }}>
        <ol>
          <li>In each game, there will be a pair of similar words.</li>
          <li>
            At the start of the game, each player will get either of the 2 words. Most of the players (Civilians) will
            get the same word, while the Undercover(s) will get the other word. If there is a Blank in the game, that
            player will not get any word. The Blank must hide the fact that he/she does not have any word.
          </li>
          <li>
            In each round, players will take turns to describe their word, without saying what the word is. Players
            cannot repeat what have been said before.
          </li>
          <li>
            After every player has spoken, each player will vote for the player that he/she thinks is an
            Undercover/Blank. The player with the most votes will be out of the game. If there is a tie, the players in
            the tie will describe their word again (with new description) and everyone will decide again who to vote
            for. The host of the game will do the voting in the system.
          </li>
          <li>
            At the end of each round,
            <ol type="a">
              <li>If only Civilians are left in the game, the Civilians win.</li>
              <li>
                If only 1 Civilian is left, the game ends. If there are Blanks alive, the Blanks win. If not, the
                Undercovers win.
              </li>
            </ol>
          </li>
        </ol>
      </Typography>
      <Typography variant="caption" sx={{ mt: "2em", mb: "1em", display: "inline-block" }}>
        The code for this app can be found{" "}
        <a href="https://github.com/yingxuanchen/undercover" target="_blank" rel="noreferrer">
          here
        </a>
        .
      </Typography>

      <AlertDialog
        open={dialogPropsState.open}
        onClose={dialogPropsState.onClose}
        title={dialogPropsState.title}
        message={dialogPropsState.message}
        onCancel={dialogPropsState.onCancel}
        onConfirm={dialogPropsState.onConfirm}
      />
    </div>
  );
}

export default MainPage;
