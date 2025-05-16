import { getDB } from "../util/db.js";

export class Room {
  constructor(roomId, username) {
    this.roomId = roomId;
    this.totalCount = 1;
    this.antiCount = 0;
    this.blankCount = 0;
    this.users = [{ name: username, isHost: true }];
    this.hasStarted = false;
  }

  insert() {
    const db = getDB();
    return db
      .collection("rooms")
      .insertOne(this)
      .then((result) => this)
      .catch((err) => console.error(err));
  }

  static updateRoom(room) {
    room.lastUpdated = Date.now();
    const db = getDB();
    return db
      .collection("rooms")
      .replaceOne({ _id: room._id }, room)
      .then((result) => room)
      .catch((err) => console.error(err));
  }

  static deleteRoom(room) {
    const db = getDB();
    return db
      .collection("rooms")
      .deleteOne({ _id: room._id })
      .then((result) => room)
      .catch((err) => console.error(err));
  }

  static findByRoomId(roomId) {
    const db = getDB();
    return db
      .collection("rooms")
      .findOne({ roomId: roomId })
      .then((room) => room)
      .catch((err) => console.error(err));
  }
}
