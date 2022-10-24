import { ethers } from "ethers";
import { TransactionResponse } from "@ethersproject/abstract-provider";

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

export const buyTickets = async (
  totalTickets: number,
  user: User,
  updateUser: React.Dispatch<React.SetStateAction<User>>
) => {
  try {
    const signer = user.provider.getSigner();
    const lotteryContractWithSigner = user.LotteryContract.connect(signer);
    // enter the user with their tickets
    const transaction = await lotteryContractWithSigner.enter(totalTickets);
    waitForTransactionToFinish(transaction, updateUser);
  } catch (e) {
    console.error(e);
  }
};

export const approveMaxTokens = async (
  user: User,
  updateUser: React.Dispatch<React.SetStateAction<User>>
) => {
  const { BBTContract, signer } = user;
  try {
    const bbtWithSigner = BBTContract.connect(signer);
    const transaction = await bbtWithSigner.approve(
      LotteryAddress,
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    );
    waitForTransactionToFinish(transaction, updateUser);
  } catch (e) {
    console.error(e);
    throw new Error("Failure to approve/confirm token usage");
  }
};

export async function setManager(
  isFirstManager: boolean,
  address: string,
  user: User,
  updateUser: React.Dispatch<React.SetStateAction<User>>
) {
  console.log(address);
  if (ethers.utils.isAddress(address)) {
    const signer = user.provider.getSigner();
    const lotteryContractWithSinger = user.LotteryContract.connect(signer);
    try {
      const transaction = await lotteryContractWithSinger.setManager(
        isFirstManager,
        address
      );
      waitForTransactionToFinish(transaction, updateUser);
    } catch (e) {
      alert("updating manager failed");
    }
  } else {
    alert("incorrect address double check");
  }
}

export async function setTicketPrice(
  price: number,
  user: User,
  updateUser: React.Dispatch<React.SetStateAction<User>>
) {
  try {
    const signer = user.provider.getSigner();
    const lotteryContractWithSigner = user.LotteryContract.connect(signer);
    const transaction = lotteryContractWithSigner.setTicketPrice(price);
    waitForTransactionToFinish(transaction, updateUser);
  } catch {
    alert("Something went wrong try agin");
  }
}

export async function drawLottery(
  user: User,
  updateUser: React.Dispatch<React.SetStateAction<User>>
) {
  try {
    const signer = user.provider.getSigner();
    const lotteryContractWithSigner = user.LotteryContract.connect(signer);
    const transaction = await lotteryContractWithSigner.draw();
    waitForTransactionToFinish(transaction, updateUser);
  } catch {
    alert("Something went wrong try agin");
  }
}

async function waitForTransactionToFinish(
  transaction: TransactionResponse,
  updateUser: React.Dispatch<React.SetStateAction<User>>
) {
  try {
    updateUser((user: User) => ({ ...user, load: true }));
    await transaction.wait();
    updateUser((user: User) => ({ ...user, load: false }));
  } catch (e) {
    updateUser((user: User) => ({ ...user, load: false }));
    alert("transaction failed");
  }
}
