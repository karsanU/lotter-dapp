import React, { useState, useEffect } from "react";
import { Button, Card, CardContent, TextField, Box, Grid } from "@mui/material";
import { useBlockchainContext, useUpdateBlockchainContext } from "./context";
import {
  connectToMetamask,
  buyTickets,
  setManager,
  setTicketPrice,
  drawLottery,
} from "./apis";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { ethers, Signer } from "ethers";
import "./App.css";

function App() {
  const [totalTickets, setTotalTicket] = useState<number>(1);
  const [userBBT, setUserBBT] = useState<string>("loading...");
  const [manager1, setManager1] = useState<string>("");
  const [manager2, setManager2] = useState<string>("");
  const [newTicketPrice, setNewTicketPrice] = useState<number>(1);

  const user = useBlockchainContext();
  const updateUser = useUpdateBlockchainContext();

  useEffect(() => {
    async function setLotteryInfo() {
      if (!user.provider) return;
      const signerAddress = user.provider.getSigner().getAddress();
      const userBBT = await user.BBT.balanceOf(signerAddress);
      setUserBBT(userBBT);
    }
    setLotteryInfo();
  }, [user]);

  async function handleLoginWithMetaMask() {
    const { provider } = user;
    if (provider) {
      try {
        await connectToMetamask(provider);
        let signer: Signer;
        let loggedIn: boolean;
        signer = provider.getSigner();
        loggedIn = (await signer.getAddress()) !== null;
        console.log(loggedIn);
        updateUser({ ...user, signer, loggedIn });
      } catch (e) {
        alert("Connection failed");
      }
    } else {
      alert("Provider not found");
    }
  }

  async function handleBuyTickets() {
    // approve tokens
    try {
      buyTickets(totalTickets, user);
    } catch (e) {
      console.log(e);
      alert("Something went wrong");
    }
  }

  function userIsOwner() {
    if (!user.loggedIn) return null;
    try {
      if (user.signerAddress === user.owner) {
        return (
          <Card sx={{ width: 300, display: "grid" }}>
            <CardContent>
              <h2>Owner</h2>
              <TextField
                label={"Manager 1 address"}
                value={manager1}
                onChange={(event) => {
                  const val = event.target.value;
                  setManager1(val);
                }}
              />
              <Button
                disabled={!ethers.utils.isAddress(manager1)}
                onClick={() => setManager(true, manager1, user)}
              >
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
              <Button
                disabled={!ethers.utils.isAddress(manager2)}
                onClick={() => setManager(false, manager2, user)}
              >
                Set Manager 2
              </Button>
              <br />
              <br />
              <TextField
                type={"number"}
                label={"Set Ticket Price"}
                value={newTicketPrice}
                onChange={(event) => {
                  const val = Number(event.target.value);
                  val > 0 && setNewTicketPrice(val);
                }}
              />
              <Button onClick={() => setTicketPrice(newTicketPrice, user)}>
                Set new ticket Price
              </Button>
            </CardContent>
          </Card>
        );
      }
    } catch (e) {
      console.log(e);
    }
  }

  function userInfo() {
    if (!user.loggedIn)
      return (
        <Card sx={{ width: 300, display: "grid" }}>
          <p>must login with metamask to access account info...</p>
        </Card>
      );
    return (
      <Card sx={{ width: 300, display: "grid" }}>
        <CardContent>
          <h2>User</h2>
          <p>{`You have: ${userBBT} BBT in you account`}</p>
        </CardContent>
      </Card>
    );
  }

  function userIsManager() {
    if (!user.loggedIn) return null;
    if (
      ![user.owner, user.manager1, user.manager2].includes(user.signerAddress)
    )
      return null;
    const rightNow = new Date().getTime();
    const diff = Math.abs(user.lastDrawTime - rightNow);
    const fiveMinPassed = diff / 1000 / 60 > 5.1;
    return (
      <Card sx={{ width: 300, display: "grid" }}>
        <h2> Manager </h2>
        <p>
          You can draw the lottery:
          {fiveMinPassed ? " Now" : ` in ${5000 - diff / 1000} seconds`}{" "}
        </p>
        {
          <Button
            disabled={!fiveMinPassed || parseInt(user.pricePool) < 1}
            onClick={() => drawLottery(user)}
          >
            Draw the lottery now
          </Button>
        }
      </Card>
    );
  }

  function renderBuyTickets() {
    return (
      <Card sx={{ width: 300, display: "grid" }}>
        <CardContent>
          <h2>Enter Lottery</h2>
          {user.pricePool && user.ticketPrice && (
            <>
              <p>{`Total Price Pool is: ${user.pricePool} BBT`}</p>
              <p>{`Ticket Price is: ${user.ticketPrice} BBT`}</p>
            </>
          )}
          {user.loggedIn ? (
            <>
              <TextField
                label={"Total tickets "}
                type={"number"}
                value={totalTickets}
                onChange={(event) => {
                  const val = Number(event.target.value);
                  val > 0 && setTotalTicket(val);
                }}
              />
              <Button sx={{ mx: "auto" }} onClick={() => handleBuyTickets()}>
                Buy Tickets
              </Button>
            </>
          ) : (
            <p> Must login with metamask to buy tickets...</p>
          )}
        </CardContent>
      </Card>
    );
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
        open={user.load || false}
      >
        <CircularProgress color="inherit" />
        <p>{user.loadMessage}</p>
      </Backdrop>
      <div className="App">
        <Box sx={{ m: 2 }}>
          <Button onClick={() => handleLoginWithMetaMask()}>
            login with metamask
          </Button>
        </Box>
        <Grid
          spacing={2}
          container
          sx={{ width: `1200px`, maxWidth: "80%", mx: "auto" }}
        >
          <Grid item>{userInfo()}</Grid>
          <Grid item>{renderBuyTickets()}</Grid>
          <Grid item>{userIsManager()}</Grid>
          <Grid item>{userIsOwner()}</Grid>
        </Grid>
      </div>
    </>
  );
}

export default App;
