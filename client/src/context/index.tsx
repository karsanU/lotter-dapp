import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getWeb3Provider } from "../apis/metamask";
import ethers, { Signer } from "ethers";

declare global {
  interface Window {
    ethereum: any;
  }
}

interface User {
  signer: Signer;
  provider: ethers.providers.Web3Provider | null;
  isMetaMaskConnected: Boolean;
}

const BlockchainContext = createContext({} as User);
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
    async function setProvider() {
      if (window.ethereum !== undefined) {
        const provider = getWeb3Provider(window.ethereum);
        setUser((user) => ({ ...user, provider }));
      } else {
        setUser((user) => ({ ...user, provider: null }));
      }
    }
    setProvider();
  }, []);
  return (
    <BlockchainContext.Provider value={user as User}>
      <UpdateBlockchainContext.Provider value={setUser}>
        {children}
      </UpdateBlockchainContext.Provider>
    </BlockchainContext.Provider>
  );
}
