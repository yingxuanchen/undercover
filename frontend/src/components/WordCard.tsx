import { Button, Card } from "@mui/material";
import { useState } from "react";

interface Props {
  word: string;
}

export default function WordCard({ word }: Props) {
  const [cardState, setCardState] = useState(false);

  const handleTurnCard = () => {
    setCardState(!cardState);
  };

  return (
    <>
      <Card raised sx={{ width: "fit-content", margin: "auto", padding: "20px" }}>
        {cardState ? word : "Reveal your word"}
      </Card>
      <p></p>
      <Button variant="contained" onClick={handleTurnCard}>
        {cardState ? "Hide Word" : "Show Word"}
      </Button>
    </>
  );
}
