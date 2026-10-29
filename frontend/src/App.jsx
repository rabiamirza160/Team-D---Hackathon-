import { useState } from "react";
import StackingGuide from "./components/StackingGuide";
import "./App.css";

const initialLanguage = navigator.language?.toLowerCase().startsWith("fr")
  ? "fr"
  : "en";

function App() {
  const [language, setLanguage] = useState(initialLanguage);

  return (
    <StackingGuide language={language} onLanguageChange={setLanguage} />
  );
}

export default App;
