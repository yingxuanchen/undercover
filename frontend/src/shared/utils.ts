import type { User } from "./types";

export const applyDrag = (arr: User[], dragResult: any) => {
  const { removedIndex, addedIndex, payload } = dragResult;
  if (removedIndex === null && addedIndex === null) return arr;

  const result = [...arr];
  let itemToAdd = payload;

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0];
  }

  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd);
  }

  return result;
};

export const getUserString = (user: User, index: number, currentTurn: number | string) => {
  return (
    (user.isOut ? "☠️" : "") +
    (user.isHost ? "👑" : "") +
    user.name +
    (currentTurn === index ? "🎙️" : "") +
    (currentTurn === "ended" ? " - " + user.card : "")
  );
};

export const getCurrentTurnUser = (users: User[], currentTurn: number): string => {
  const currentUser = users[currentTurn];
  return currentUser.name;
};

export const getMinMaxAntiBlank = (totalCount: number) => {
  return {
    minAnti: 1,
    maxAnti: Math.floor(totalCount / 3),
    minBlank: 0,
    maxBlank: totalCount < 4 ? 0 : 1,
  };
};

export const backendUrl = import.meta.env.DEV ? "http://localhost:3000" : "https://undercover-gwsk.onrender.com";
