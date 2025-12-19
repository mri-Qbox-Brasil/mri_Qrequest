import React from "react";
import "./App.css";
import RequestContainer from "./RequestContainer";
import { ThemeProvider } from "../contexts/ThemeContext";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="nui-wrapper">
        <RequestContainer />
      </div>
    </ThemeProvider>
  );
};

export default App;
