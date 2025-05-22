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
  role: RoleType;
  card: string;
  isHost: boolean;
  isOut: boolean;
  hasVoted: boolean;
}

export enum RoleType {
  norm = "norm",
  anti = "anti",
  blank = "blank",
}

export interface Role {
  label: string;
  color: string;
}

export const roles: Record<RoleType, Role> = {
  [RoleType.norm]: { label: "Civilian", color: "green" },
  [RoleType.anti]: { label: "Undercover", color: "red" },
  [RoleType.blank]: { label: "Blank", color: "gray" },
};
