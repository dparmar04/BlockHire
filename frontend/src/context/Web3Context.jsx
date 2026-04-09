import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import BlockHireABI from '../abi/BlockHire.json';

const Web3Context = createContext();

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);

  const connectWallet = async () => {
    // Check if MetaMask exists
    if (!window.ethereum) {
      toast.error('MetaMask not detected! Please install MetaMask.');
      return;
    }

    setIsConnecting(true);

    try {
      // First, get current accounts
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        // Already connected
        await setupConnection(accounts[0]);
        toast.success('Wallet already connected!');
        setIsConnecting(false);
        return;
      }

      // Request connection
      toast.loading('Waiting for MetaMask...');
      
      const requestedAccounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (requestedAccounts.length === 0) {
        throw new Error('No accounts found');
      }

      await setupConnection(requestedAccounts[0]);
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Connection error:', error);
      
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else if (error.code === -32002) {
        toast.error('Connection request already pending. Check MetaMask.');
      } else {
        toast.error('Failed to connect wallet. Try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const setupConnection = async (userAccount) => {
    try {
      // Check network
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        toast.loading('Switching to Sepolia network...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'SEP',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
          }
        }
      }

      // Setup provider and signer
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const userSigner = await browserProvider.getSigner();
      
      // Setup contract
      if (CONTRACT_ADDRESS && BlockHireABI.abi) {
        const blockHireContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          BlockHireABI.abi,
          userSigner
        );
        setContract(blockHireContract);
      }

      setProvider(browserProvider);
      setSigner(userSigner);
      setAccount(userAccount);
      setChainId(currentChainId);

    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Failed to setup connection');
    }
  };

  // Check connection on mount
  useEffect(() => {
    if (window.ethereum) {
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await setupConnection(accounts[0]);
          }
        } catch (error) {
          console.log('No existing connection');
        }
      };
      checkConnection();

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          toast.success('Account changed');
        } else {
          setAccount(null);
          setContract(null);
          toast.info('Wallet disconnected');
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    toast.success('Wallet disconnected');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Web3Context.Provider value={{
      account,
      provider,
      signer,
      contract,
      isConnecting,
      chainId,
      connectWallet,
      disconnect,
      formatAddress,
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}