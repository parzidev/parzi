import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Game from "../src/Game";
import "../src/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Game />
  </StrictMode>,
);
