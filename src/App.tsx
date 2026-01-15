import "./App.css";
import { ReactFlowProvider } from "reactflow";
import InternalsVizPage from "./features/internals-viz/ui/InternalsVizPage";

const App = () => {
  return (
    <ReactFlowProvider>
      <InternalsVizPage />
    </ReactFlowProvider>
  );
};

export default App;
