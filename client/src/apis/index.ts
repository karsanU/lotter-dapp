import { ethers } from "ethers";
import { LotteryAddress } from "../constants";
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

export const buyTickets = async (
  provider: ethers.providers.Web3Provider,
  bbtContract: ethers.Contract,
  lotteryContract: ethers.Contract,
  totalTickets: number
) => {
  const ticketPrice = parseInt(await lotteryContract.ticketPrice());
  try {
    // check if it's already approved
    await approveMaxToken(provider, bbtContract, ticketPrice * totalTickets);
    const signer = provider.getSigner();
    const lotteryContractWithSigner = lotteryContract.connect(signer);
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
