import express from "express";
import {
  checkSession,
  endGame,
  endTurn,
  enterRoom,
  getRoom,
  hostVote,
  leaveGame,
  leaveRoom,
  startGame,
  vote,
} from "../controllers/game.js";

const router = express.Router();

router.get("/check-session", checkSession);

router.post("/enter-room", enterRoom);
router.post("/leave-room", leaveRoom);
router.post("/room", getRoom);

router.post("/start-game", startGame);
router.post("/end-game", endGame);
router.post("/leave-game", leaveGame);

router.post("/end-turn", endTurn);
router.post("/vote", vote, endGame);
router.post("/host-vote", hostVote, endGame);

export default router;
