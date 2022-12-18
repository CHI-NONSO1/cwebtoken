//import "./App.css";

import { Route, Routes } from "react-router-dom";
import Allowance from "./components/Allowance";
import Approve from "./components/Approve";

import { Home } from "./components/Home";
import Transfer from "./components/Transfer";
import TransferFrom from "./components/TransferFrom";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route exact path="/transfer/:selectedAddress" element={<Transfer />} />
        <Route path="/approval/:selectedAddress" element={<Approve />} />
        <Route path="/allowance/:selectedAddress" element={<Allowance />} />
        <Route
          path="/transfer-from/:selectedAddress"
          element={<TransferFrom />}
        />
      </Routes>
    </div>
  );
}

export default App;
