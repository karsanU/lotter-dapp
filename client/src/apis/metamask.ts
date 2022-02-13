import { ethers } from "ethers";

export const getWeb3Provider = (provider: any) => {
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

export const approveBBTToken = async () => {};
