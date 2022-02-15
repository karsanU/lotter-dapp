import React, { useState, useEffect } from "react";
import { Button, TextField } from "@mui/material";
import { useBlockchainContext, useUpdateBlockchainContext } from "./context";
import { connectToMetamask, buyTickets, setManager } from "./apis";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import "./App.css";

function App() {
  const [totalTickets, setTotalTicket] = useState<number>(1);
  const [ticketPrice, setTicketPrice] = useState<string>("loading...");
  const [pricePool, setPricePool] = useState<string>("loading...");
  const [userBBT, setUserBBT] = useState<string>("loading...");
  const [manager1, setManager1] = useState<string>("");
  const [manager2, setManager2] = useState<string>("");

  const user = useBlockchainContext();
  const updateUser = useUpdateBlockchainContext();

  useEffect(() => {
    async function setLotteryInfo() {
      if (!user.provider) return;
      console.log(user.provider);
      const signerAddress = user.provider.getSigner().getAddress();
      const ticketPrice = await user.LotteryContract.ticketPrice();
      const pricePool = await user.LotteryContract.pricePool();
      const userBBT = await user.BBT.balanceOf(signerAddress);
      setTicketPrice(ticketPrice);
      setPricePool(pricePool);
      setUserBBT(userBBT);
    }
    setLotteryInfo();
  }, [user]);

  async function handleLoginWithMetaMask() {
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

  async function handleBuyTickets() {
    const { provider, BBT, LotteryContract } = user;
    // approve tokens
    try {
      buyTickets(provider, BBT, LotteryContract, totalTickets);
    } catch (e) {
      console.log(e);
      alert("Something went wrong");
    }
  }

  function userIsOwner() {
    if (!user.provider) return null;
    try {
      const userIsOwner = true;
      if (userIsOwner) {
        return (
          <>
            <TextField
              label={"Manager 1 address"}
              value={manager1}
              onChange={(event) => {
                const val = event.target.value;
                setManager1(val);
              }}
            />
            <Button onClick={() => setManager(true, manager1, user)}>
              Set Manager 1
            </Button>
            <br />
            <br />
            <TextField
              label={"Manager 2 address"}
              value={manager2}
              onChange={(event) => {
                const val = event.target.value;
                setManager2(val);
              }}
            />
            <Button onClick={() => setManager(false, manager2, user)}>
              Set Manager 2
            </Button>
          </>
        );
      }
    } catch (e) {
      console.log(e);
    }
  }

  function userIsManager() {
    return null;
  }
  return (
    <>
      <Backdrop
        sx={{
          display: "flex",
          flexDirection: "column",
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        onClick={() => updateUser((user) => ({ ...user, load: false }))}
        open={user.load}
      >
        <CircularProgress color="inherit" />
        <p>{user.loadMessage}</p>
      </Backdrop>
      <div className="App">
        <Button onClick={() => handleLoginWithMetaMask()}>
          login with metamask
        </Button>
        <p>{`Total Price Pool is: ${pricePool} BBT`}</p>
        <p>{`Ticket Price is: ${ticketPrice} BBT`}</p>
        <TextField
          label={"Total tickets "}
          type={"number"}
          value={totalTickets}
          onChange={(event) => {
            const val = Number(event.target.value);
            val > 0 && setTotalTicket(val);
          }}
        />
        <Button onClick={() => handleBuyTickets()}>Buy</Button>
        <p>-----------</p>
        <p>{`You have: ${userBBT} BBT in you account`}</p>
        {userIsOwner()}
        {userIsManager()}
      </div>
    </>
  );
}

export default App;
