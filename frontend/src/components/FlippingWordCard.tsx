import { Box, Card, CardContent, Typography } from "@mui/material";
import { useState } from "react";
import ThreeSixtyIcon from "@mui/icons-material/ThreeSixty";

interface Props {
  word: string;
}

function WordCard({ word, front }: { word: string; front: boolean }) {
  return (
    <Card
      raised
      sx={{
        position: "absolute",
        width: "100%",
        backfaceVisibility: "hidden",
        transform: front ? undefined : "rotateY(180deg)",
      }}
    >
      <CardContent>
        <Typography variant="h6">{front ? word : "Reveal word"}</Typography>
        <ThreeSixtyIcon fontSize="small" />
      </CardContent>
    </Card>
  );
}

export default function FlippingWordCard({ word }: Props) {
  const [cardState, setCardState] = useState(false);

  const handleTurnCard = () => {
    setCardState(!cardState);
  };

  return (
    <Box
      sx={{
        perspective: 1000, // Enables 3D perspective
        cursor: "pointer",
      }}
      onClick={handleTurnCard}
    >
      <Box
        sx={{
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s",
          transform: cardState ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <WordCard word={word} front={true} />
        <WordCard word={word} front={false} />
      </Box>
    </Box>
  );
}
