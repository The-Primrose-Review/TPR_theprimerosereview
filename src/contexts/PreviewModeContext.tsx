import { createContext, useContext } from "react";

const PreviewModeContext = createContext<boolean>(false);

export const usePreviewMode = () => useContext(PreviewModeContext);

export default PreviewModeContext;
