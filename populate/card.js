import { getDB } from "./db.js";

export class Card {
  constructor(num, a, b, language) {
    this.num = num;
    this.a = a;
    this.b = b;
    this.language = language;
  }

  insert() {
    const db = getDB();
    return db
      .collection("cards")
      .insertOne(this)
      .then((result) => console.log("Inserted card: " + JSON.stringify(this)))
      .catch((err) => console.error(err));
  }

  static dropCollection() {
    const db = getDb();
    return db
      .collection("cards")
      .drop()
      .then((result) => console.log('collection "cards" dropped from db!'))
      .catch((err) => console.error(err));
  }
}
