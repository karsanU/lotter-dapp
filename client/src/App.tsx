import React, { useState } from "react";
import { Button, TextField } from "@mui/material";
import { useBlockchainContext, useUpdateBlockchainContext } from "./context";
import { connectToMetamask } from "./apis/metamask";
import "./App.css";

function App() {
  const [totalTickets, setTotalTicket] = useState<Number>(1);
  const user = useBlockchainContext();
  const updateUser = useUpdateBlockchainContext();

  async function loginWithMetaMask() {
    const { provider } = user;
    if (provider) {
      try {
        await connectToMetamask(provider);
        alert("Connected");
      } catch (e) {
        alert("Connection failed");
      }
    } else {
      alert("Please install metamask");
    }
  }

  async function buyTickets() {
    // approve tokens
    // sene the order
    console.log(user.provider);
  }

  return (
    <div className="App">
      <Button onClick={() => loginWithMetaMask()}>login with metamask</Button>
      <p>{`Total Price Pool is BBT`}</p>
      <p>{`Ticket Price is: BBT`}</p>
      <TextField
        label={"Total tickets "}
        type={"number"}
        value={totalTickets}
        onChange={(event) => {
          const val = Number(event.target.value);
          val > 0 && setTotalTicket(val);
        }}
      />
      <Button onClick={() => buyTickets()}>Buy</Button>
    </div>
  );
}

export default App;
