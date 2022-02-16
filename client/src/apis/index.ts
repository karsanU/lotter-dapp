import { ethers } from "ethers";
import { LotteryAddress } from "../constants";
import { User } from "../context";
export const getWeb3Provider = (
  provider: any
): ethers.providers.Web3Provider | null => {
  if (provider) {
    return new ethers.providers.Web3Provider(provider);
  } else {
    return null;
  }
};

export const connectToMetamask = async (
  provider: ethers.providers.Web3Provider
) => {
  await provider.send("eth_requestAccounts", []);
};

export const buyTickets = async (totalTickets: number, user: User) => {
  const ticketPrice = parseInt(await user.LotteryContract.ticketPrice());
  try {
    // check if it's already approved
    await approveMaxToken(user.provider, user.BBT, ticketPrice * totalTickets);
    const signer = user.provider.getSigner();
    const lotteryContractWithSigner = user.LotteryContract.connect(signer);
    // enter the user with their tickets
    await lotteryContractWithSigner.enter(totalTickets);
  } catch (e) {
    console.log(e);
  }
};

const approveMaxToken = async (
  provider: ethers.providers.Web3Provider,
  bbtContract: ethers.Contract,
  minTokensRequired: number
) => {
  try {
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    const bbtWithSigner = bbtContract.connect(signer);
    // check if it's already approved
    const allowance = parseInt(
      await bbtWithSigner.allowance(signerAddress, LotteryAddress)
    );
    if (allowance < minTokensRequired) {
      await bbtWithSigner.approve(
        LotteryAddress,
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      );
    }
  } catch (e) {
    console.log(e);
    throw new Error("Failure to approve/confirm token usage");
  }
};

export async function setManager(
  firstManager: boolean,
  address: string,
  user: User
) {
  console.log(address);
  if (ethers.utils.isAddress(address)) {
    const signer = user.provider.getSigner();
    const lotteryContractWithSinger = user.LotteryContract.connect(signer);
    try {
      await lotteryContractWithSinger.setManger(firstManager, address);
      alert("successfully sent set manager request");
    } catch (e) {
      alert(e);
    }
  } else {
    alert("incorrect address double check");
  }
}

export async function setTicketPrice(price: number, user: User) {
  try {
    const signer = user.provider.getSigner();
    const lotteryContractWithSigner = user.LotteryContract.connect(signer);
    lotteryContractWithSigner.setTicketPrice(price);
    alert(`Update price request successfully sent`);
  } catch {
    alert("Something went wrong try agin");
  }
}
