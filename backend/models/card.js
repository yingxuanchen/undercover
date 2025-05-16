import { getDB } from "../util/db.js";

export class Card {
  constructor(num, a, b, language) {
    this.num = num;
    this.a = a;
    this.b = b;
    this.language = language;
  }

  static getOne(languageArray) {
    const db = getDB();
    return db
      .collection("cards")
      .aggregate([{ $match: { language: { $in: languageArray } } }, { $sample: { size: 1 } }])
      .next();
  }
}
