export interface Room {
  roomId: string;
  lastUpdated: string;
  totalCount: number;
  antiCount: number;
  blankCount: number;
  hasStarted: boolean;
  firstTurn: number;
  currentTurn: number | string;
  currentCount: number;
  votes: number[];
  usersWithMostVotes: number[];
  winner: number | string;
  users: User[];
}

export interface User {
  name: string;
  role: string;
  card: string;
  isHost: boolean;
  isOut: boolean;
  hasVoted: boolean;
}
