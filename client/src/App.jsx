import "./App.css";
import { ChatPage } from "./pages/ChatPage";
import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import CaptionGenerator from "./components/CaptionGenerator";
import EmailGenerator from "./components/EmailGenerator";
import DataAnalysis from "./components/DataAnalysis";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/caption-generator" element={<CaptionGenerator />} />
        <Route path="/email-generator" element={<EmailGenerator />} />
        <Route path="/data-analysis" element={<DataAnalysis />} />
      </Routes>
    </>
  );
}

export default App;
