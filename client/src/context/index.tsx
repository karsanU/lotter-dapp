import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getWeb3Provider } from "../apis";
import { ethers, Signer } from "ethers";
import BigBoyTokenAbi from "../abis/BigBoyToken.json";
import LotteryAbi from "../abis/Lottery.json";
import { LotteryAddress, BBTAddress } from "../constants";
declare global {
  interface Window {
    ethereum: any;
  }
}

export interface User {
  signer: Signer;
  signerAddress: string;
  provider: ethers.providers.Web3Provider;
  BBT: ethers.Contract;
  LotteryContract: ethers.Contract;
  load: boolean;
  loadMessage: string;
  pricePool: string;
  ticketPrice: string;
  manager1: string;
  manager2: string;
  owner: string;
  lastDrawTime: number;
  loggedIn: boolean;
}

const BlockchainContext = createContext({
  load: false,
  pricePool: "loading..",
  ticketPrice: "loadings..",
  loggedIn: false,
} as User);
const UpdateBlockchainContext = createContext(
  {} as React.Dispatch<React.SetStateAction<User>>
);

export const useBlockchainContext = () => {
  return useContext(BlockchainContext);
};
export const useUpdateBlockchainContext = () => {
  return useContext(UpdateBlockchainContext);
};

interface Props {
  children: ReactNode;
}

export default function ContextProvider({ children }: Props) {
  const [user, setUser] = useState<User>({} as User);
  useEffect(() => {
    // find and set the provider
    async function setUp() {
      if (window.ethereum !== undefined) {
        try {
          const provider = getWeb3Provider(window.ethereum);
          if (provider === null) return;
          const BBT = new ethers.Contract(
            BBTAddress,
            JSON.stringify(BigBoyTokenAbi.abi),
            provider as any
          );
          const LotteryContract = new ethers.Contract(
            LotteryAddress,
            JSON.stringify(LotteryAbi.abi),
            provider as any
          );
          const ticketPrice = await LotteryContract.ticketPrice();
          const pricePool = await LotteryContract.pricePool();
          const manager1 = await LotteryContract.managers(0);
          const manager2 = await LotteryContract.managers(1);
          const owner = await LotteryContract.owner();
          const lastDrawTime =
            parseInt(await LotteryContract.lastDrawTime()) * 1000;
          // try to get signer if user has logged in
          let signer: Signer;
          let loggedIn: boolean = false;
          let signerAddress: string;
          try {
            signer = provider.getSigner();
            if ((await provider.getSigner().getAddress()) !== null) {
              signerAddress = await provider.getSigner().getAddress();
              loggedIn = true;
            }
          } catch {
            console.log(`unable to get signer, not logged in`);
          }
          setUser((user) => ({
            ...user,
            provider,
            BBT,
            LotteryContract,
            ticketPrice,
            pricePool,
            manager1,
            manager2,
            lastDrawTime,
            owner,
            signer,
            loggedIn,
            signerAddress,
          }));
        } catch (e) {
          alert(e);
        }
      }
    }
    setUp();
  }, []);
  return (
    <BlockchainContext.Provider value={user as User}>
      <UpdateBlockchainContext.Provider value={setUser}>
        {children}
      </UpdateBlockchainContext.Provider>
    </BlockchainContext.Provider>
  );
}
