import { createContext, useReducer } from "react";
import type { Room, User } from "../shared/types";

export interface GameState {
  room: Room | null;
  user: User | null;
}

export interface Action {
  room?: Room;
  user?: User;
}

const emptyState = {
  room: null,
  user: null,
};

const gameStore = createContext<{
  state: GameState;
  dispatch: React.Dispatch<Action>;
}>({ state: { ...emptyState }, dispatch: () => null });

const { Provider } = gameStore;

const reducer = (state: GameState, action: Action) => {
  const newState = { ...state };

  if (action.room) {
    newState.room = { ...action.room };
  }

  if (action.user) {
    newState.user = { ...action.user };
  }

  return newState;
};

interface Props {
  children: React.ReactNode;
}

function GameStateProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, { ...emptyState });

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
}

export { gameStore, GameStateProvider };
