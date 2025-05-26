import { Room } from "../models/room.js";
import { Card } from "../models/card.js";
import { getIO } from "../util/socket.js";

const isProduction = process.env.NODE_ENV === "production";

export const checkServiceStatus = (req, res, next) => {
  console.log("Service is running");
  res.status(200).json({ message: "Service is running" });
};

export const destroySession = (req, res, next) => {
  const { errorStatus, errorMessage } = req.errorResponse || {};

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }

    res.clearCookie("connect.sid", {
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    if (errorStatus) {
      res.status(errorStatus).json({ error: errorMessage });
    } else {
      res.sendStatus(200);
    }
  });
};

export const checkSession = (req, res, next) => {
  const roomId = req.session.roomId;
  const username = req.session.username;

  if (!roomId || !username) {
    return res.sendStatus(200);
  }

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        return next();
      }
      const user = room.users.find((user) => user.name === username);
      if (!user) {
        return next();
      }
      return res.status(200).json({ roomId: roomId, username: username });
    })
    .catch((err) => console.error(err));
};

export const enterRoom = (req, res, next) => {
  const roomId = req.body.roomId.trim();
  const username = req.body.username.trim();

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        const room = new Room(roomId, username);
        return room.insert();
      }

      if (room.hasStarted) {
        res.status(400).json({ error: "game has started" });
        return null;
      }

      const usernames = room.users.map((user) => user.name);
      if (usernames.includes(username)) {
        res.status(400).json({ error: "username already exists" });
        return null;
      }

      const updatedRoom = { ...room };
      updatedRoom.totalCount += 1;
      updatedRoom.users.push({ name: username, isHost: false });
      return Room.updateRoom(updatedRoom);
    })
    .then((room) => {
      if (room) {
        req.session.roomId = roomId;
        req.session.username = username;
        req.session.save((err) => {
          getIO().emit("room" + room.roomId, { action: "enterRoom", room: room });
          return res.sendStatus(200);
        });
      }
    })
    .catch((err) => console.error(err));
};

export const leaveRoom = (req, res, next) => {
  const roomId = req.session.roomId;
  const username = req.session.username;

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        req.errorResponse = { errorStatus: 400, errorMessage: "room does not exist" };
        return next();
      }

      if (room.users.length === 1) {
        return Room.deleteRoom(room);
      }

      const updatedRoom = { ...room };
      updatedRoom.totalCount -= 1;
      updatedRoom.users = room.users.filter((user) => user.name !== username);

      const user = room.users.find((user) => user.name === username);
      if (user.isHost) {
        updatedRoom.users[0].isHost = true;
      }

      return Room.updateRoom(updatedRoom);
    })
    .then((room) => {
      req.session.destroy((err) => {
        if (room) {
          getIO().emit("room" + room.roomId, { action: "leaveRoom", room: room });
          next();
        }
      });
    })
    .catch((err) => console.error(err));
};

export const kickUser = (req, res, next) => {
  const roomId = req.session.roomId;
  const username = req.session.username;
  const userToKick = req.body.userToKick;

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        req.errorResponse = { errorStatus: 400, errorMessage: "room does not exist" };
        return next();
      }

      const host = room.users.find((user) => user.name === username && user.isHost);
      if (!host) {
        res.status(403).json({ error: "not authorized" });
        return null;
      }

      const updatedRoom = { ...room };
      updatedRoom.totalCount -= 1;
      updatedRoom.users = room.users.filter((user) => user.name !== userToKick);

      return Room.updateRoom(updatedRoom);
    })
    .then((room) => {
      if (room) {
        getIO().emit("room" + room.roomId, { action: "kickUser", room: room });
        return res.sendStatus(200);
      }
    })
    .catch((err) => console.error(err));
};

export const getRoom = (req, res, next) => {
  const roomId = req.session.roomId;
  const username = req.session.username;

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        req.errorResponse = { errorStatus: 400, errorMessage: "room does not exist" };
        return next();
      }
      const user = room.users.find((user) => user.name === username);
      if (!user) {
        req.errorResponse = { errorStatus: 400, errorMessage: "user does not exist in room" };
        return next();
      }
      return res.status(200).send({ room: room, user: user });
    })
    .catch((err) => console.error(err));
};

export const startGame = (req, res, next) => {
  const roomId = req.session.roomId;
  const room = req.body.room;
  const randomOrder = req.body.randomOrder;
  const languageArray = req.body.languageArray;
  let updatedRoom;

  Room.findByRoomId(roomId)
    .then((oldRoom) => {
      if (!oldRoom) {
        req.errorResponse = { errorStatus: 400, errorMessage: "room does not exist" };
        return next();
      }
      updatedRoom = { ...oldRoom };
      return Card.getOne(languageArray);
    })
    .then((card) => {
      if (!card) {
        return null;
      }

      updatedRoom = Object.assign(updatedRoom, room, {
        hasStarted: true,
        firstTurn: 0,
        currentTurn: 0,
        votes: [],
        currentCount: updatedRoom.totalCount,
      });

      const roleCardArray = getRoleCardArray(
        card,
        updatedRoom.totalCount,
        updatedRoom.antiCount,
        updatedRoom.blankCount
      );
      updatedRoom.users.forEach((user, index) => {
        user.role = roleCardArray[index].role;
        user.card = roleCardArray[index].card;
        user.isOut = false;
      });

      if (randomOrder) {
        do {
          shuffleArray(updatedRoom.users);
        } while (updatedRoom.users[0].role === "blank");
      } else {
        let firstTurn = 0;
        do {
          firstTurn = getRandomInt(0, updatedRoom.users.length);
        } while (updatedRoom.users[firstTurn].role === "blank");
        updatedRoom.firstTurn = firstTurn;
        updatedRoom.currentTurn = firstTurn;
      }

      return Room.updateRoom(updatedRoom);
    })
    .then((updatedRoom) => {
      if (updatedRoom) {
        getIO().emit("room" + updatedRoom.roomId, { action: "startGame", room: updatedRoom });
        return res.sendStatus(200);
      }
    })
    .catch((err) => console.error(err));
};

export const endGame = (req, res, next) => {
  const roomId = req.session.roomId;

  if (!req.body) {
    req.body = {};
  }

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        req.errorResponse = { errorStatus: 400, errorMessage: "room does not exist" };
        return next();
      }
      const updatedRoom = { ...room, currentTurn: "ended" };
      if (req.body.winner) {
        updatedRoom.winner = req.body.winner;
      }
      return Room.updateRoom(updatedRoom);
    })
    .then((updatedRoom) => {
      if (updatedRoom) {
        getIO().emit("room" + updatedRoom.roomId, {
          action: "endGame",
          room: updatedRoom,
          userVotedOut: req.body.userVotedOut,
        });
        return res.sendStatus(200);
      }
    })
    .catch((err) => console.error(err));
};

export const leaveGame = (req, res, next) => {
  const roomId = req.session.roomId;

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        req.errorResponse = { errorStatus: 400, errorMessage: "room does not exist" };
        return next();
      }

      const updatedRoom = { ...room, hasStarted: false };
      delete updatedRoom.currentTurn;
      delete updatedRoom.firstTurn;
      delete updatedRoom.currentCount;
      delete updatedRoom.winner;
      updatedRoom.users.forEach((user) => {
        delete user.isOut;
        delete user.role;
        delete user.card;
      });

      return Room.updateRoom(updatedRoom);
    })
    .then((updatedRoom) => {
      if (updatedRoom) {
        getIO().emit("room" + updatedRoom.roomId, { action: "leaveGame", room: updatedRoom });
        return res.sendStatus(200);
      }
    })
    .catch((err) => console.error(err));
};

export const endTurn = (req, res, next) => {
  const roomId = req.session.roomId;

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        req.errorResponse = { errorStatus: 400, errorMessage: "room does not exist" };
        return null;
      }

      const nextTurn = getNextTurn(room.users, +room.currentTurn, +room.firstTurn, room.totalCount);

      const updatedRoom = { ...room, currentTurn: nextTurn };
      if (nextTurn === "voting") {
        updatedRoom.users.forEach((user) => (user.hasVoted = false));
      }

      return Room.updateRoom(updatedRoom);
    })
    .then((updatedRoom) => {
      if (updatedRoom) {
        getIO().emit("room" + updatedRoom.roomId, { action: "endTurn", room: updatedRoom });
        return res.sendStatus(200);
      }
    })
    .catch((err) => console.error(err));
};

export const vote = (req, res, next) => {
  const roomId = req.session.roomId;
  const username = req.session.username;
  const chosenUser = req.body.chosenUser;
  let userVotedOut = null;

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        res.status(400).json({ error: "room does not exist" });
        return null;
      }

      const updatedRoom = { ...room, currentTurn: "voting" };
      updatedRoom.votes.push(chosenUser);
      const userIndex = updatedRoom.users.findIndex((user) => user.name === username);
      updatedRoom.users[userIndex].hasVoted = true;

      if (updatedRoom.votes.length === updatedRoom.currentCount) {
        const countDict = getCountDict(updatedRoom.votes);
        let mostVotes = 0;
        let usersWithMostVotes;
        for (const index in countDict) {
          const i = +index;
          if (countDict[i] > mostVotes) {
            usersWithMostVotes = [i];
            mostVotes = countDict[i];
          } else if (countDict[i] === mostVotes) {
            usersWithMostVotes.push(i);
          }
        }

        if (usersWithMostVotes.length > 1) {
          updatedRoom.votes = [];
          updatedRoom.currentTurn = "hostVoting";
          updatedRoom.usersWithMostVotes = [...usersWithMostVotes];
        } else {
          updatedRoom.votes = [];
          userVotedOut = usersWithMostVotes[0];
          updatedRoom.users[usersWithMostVotes[0]].isOut = true;
          updatedRoom.firstTurn = getFirstTurn(updatedRoom.users, usersWithMostVotes[0], updatedRoom.totalCount);
          updatedRoom.currentTurn = updatedRoom.firstTurn;
          updatedRoom.currentCount -= 1;
          delete updatedRoom.usersWithMostVotes;
        }

        updatedRoom.users.forEach((user) => delete user.hasVoted);
      }

      return Room.updateRoom(updatedRoom);
    })
    .then((updatedRoom) => {
      if (updatedRoom) {
        if (shouldEndGame(updatedRoom.users)) {
          req.body.winner = getWinner(updatedRoom.users);
          req.body.userVotedOut = userVotedOut;
          next();
        } else {
          getIO().emit("room" + updatedRoom.roomId, {
            action: "vote",
            room: updatedRoom,
            userVotedOut: userVotedOut,
          });
          return res.sendStatus(200);
        }
      }
    })
    .catch((err) => console.error(err));
};

export const hostVote = (req, res, next) => {
  const roomId = req.session.roomId;
  const chosenUser = req.body.chosenUser;

  Room.findByRoomId(roomId)
    .then((room) => {
      if (!room) {
        res.status(400).json({ error: "room does not exist" });
        return null;
      }

      const updatedRoom = { ...room };
      updatedRoom.votes = [];
      updatedRoom.users[chosenUser].isOut = true;
      updatedRoom.firstTurn = getFirstTurn(updatedRoom.users, chosenUser, updatedRoom.totalCount);
      updatedRoom.currentTurn = updatedRoom.firstTurn;
      updatedRoom.currentCount -= 1;
      delete updatedRoom.usersWithMostVotes;

      return Room.updateRoom(updatedRoom);
    })
    .then((updatedRoom) => {
      if (updatedRoom) {
        if (shouldEndGame(updatedRoom.users)) {
          req.body.winner = getWinner(updatedRoom.users);
          req.body.userVotedOut = chosenUser;
          next();
        } else {
          getIO().emit("room" + updatedRoom.roomId, {
            action: "hostVote",
            room: updatedRoom,
            userVotedOut: chosenUser,
          });
          return res.sendStatus(200);
        }
      }
    })
    .catch((err) => console.error(err));
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function shuffleArray(arr) {
  let i, index, temp;
  for (i = 0; i < arr.length; i++) {
    index = getRandomInt(0, arr.length);
    temp = arr[i];
    arr[i] = arr[index];
    arr[index] = temp;
  }
}

function getRoleCardArray(card, totalCount, antiCount, blankCount) {
  const randomBool = Math.random() >= 0.5;
  const normCard = randomBool ? card.a : card.b;
  const antiCard = randomBool ? card.b : card.a;

  const normCount = totalCount - antiCount - blankCount;
  let arr = [];
  let i;
  for (i = 0; i < normCount; i++) {
    arr.push({ role: "norm", card: normCard });
  }
  for (i = 0; i < antiCount; i++) {
    arr.push({ role: "anti", card: antiCard });
  }
  for (i = 0; i < blankCount; i++) {
    arr.push({ role: "blank", card: "" });
  }

  do {
    shuffleArray(arr);
  } while (arr[0].role === "blank");
  return arr;
}

function getCountDict(arr) {
  return arr.reduce((acc, el) => {
    acc[el] = acc[el] ? acc[el] + 1 : 1;
    return acc;
  }, {});
}

function getNextTurn(usersArray, currentTurn, firstTurn, totalCount) {
  let nextTurn = currentTurn;
  do {
    nextTurn = (nextTurn + 1) % totalCount === firstTurn ? "voting" : (nextTurn + 1) % totalCount;
  } while (nextTurn !== "voting" && usersArray[nextTurn].isOut);
  return nextTurn;
}

function getFirstTurn(usersArray, outIndex, totalCount) {
  let firstTurn = outIndex;
  do {
    firstTurn = (firstTurn + 1) % totalCount;
  } while (usersArray[firstTurn].isOut);
  return firstTurn;
}

function shouldEndGame(users) {
  const inUsers = users.filter((user) => !user.isOut);
  const normUsers = inUsers.filter((user) => user.role === "norm");

  if (inUsers.length === normUsers.length || normUsers.length === 1) {
    return true;
  }
  return false;
}

function getWinner(users) {
  const inUsers = users.filter((user) => !user.isOut);
  const normUsers = inUsers.filter((user) => user.role === "norm");
  const blankUsers = inUsers.filter((user) => user.role === "blank");

  if (inUsers.length === normUsers.length) {
    return "norm";
  }
  if (blankUsers.length === 1) {
    return users.findIndex((user) => user.name === blankUsers[0].name);
  }
  if (blankUsers.length > 1) {
    return "blank";
  }
  return "anti";
}
