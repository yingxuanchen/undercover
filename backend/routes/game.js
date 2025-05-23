import express from "express";
import {
  checkServiceStatus,
  checkSession,
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

router.get("/check-session", checkSession);

router.post("/enter-room", enterRoom);
router.get("/leave-room", leaveRoom);
router.post("/kick-user", kickUser);
router.get("/room", getRoom);

router.post("/start-game", startGame);
router.get("/end-game", endGame);
router.get("/leave-game", leaveGame);

router.get("/end-turn", endTurn);
router.post("/vote", vote, endGame);
router.post("/host-vote", hostVote, endGame);

export default router;
