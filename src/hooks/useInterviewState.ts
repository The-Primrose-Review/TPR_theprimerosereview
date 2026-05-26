import { useState } from "react";

export const useInterviewState = () => {
  const [programName, setProgramName] = useState("");
  const [university, setUniversity] = useState("Harvard University");

  const resetInterview = () => {
    setProgramName("");
    setUniversity("Harvard University");
  };

  return {
    programName,
    setProgramName,
    university,
    setUniversity,
    resetInterview,
  };
};
