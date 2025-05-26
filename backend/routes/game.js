import express from "express";
import {
  checkServiceStatus,
  checkSession,
  destroySession,
  endGame,
  endTurn,
  enterRoom,
  getRoom,
  hostVote,
  kickUser,
  leaveGame,
  leaveRoom,
  startGame,
  vote,
} from "../controllers/game.js";

const router = express.Router();

router.get("/status", checkServiceStatus);

router.get("/check-session", checkSession, destroySession);

router.post("/enter-room", enterRoom);
router.get("/leave-room", leaveRoom);
router.post("/kick-user", kickUser);
router.get("/room", getRoom, destroySession);

router.post("/start-game", startGame, destroySession);
router.get("/end-game", endGame, destroySession);
router.get("/leave-game", leaveGame, destroySession);

router.get("/end-turn", endTurn, destroySession);
router.post("/vote", vote, endGame);
router.post("/host-vote", hostVote, endGame);

export default router;
