import readXlsxFile from "read-excel-file/node";
import { connectDB } from "./db.js";
import { Card } from "./card.js";
import fs from "fs";

const startNum = 1;
const language = "english";

await connectDB();

const rows = await readXlsxFile(fs.createReadStream("words.xlsx"));

// Card.dropCollection();

// rows is an array of rows
// each row being an array of cells.
for (let i = startNum - 1; i < rows.length; i++) {
  const num = rows[i][0];
  const a = rows[i][1];
  const b = rows[i][2];

  const card = new Card(num, a, b, language);
  await card.insert();
}

process.exit(0);
