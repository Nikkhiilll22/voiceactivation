import React from "react";
import VoiceVisualizer from "../components/VoiceVisualizer";

export default function Home() {
  return (
    <div>
      {/* give path to public/profile.png */}
      <VoiceVisualizer src={"/profile.png"} name={"Nikhil Bhati"} />
    </div>
  );
}
