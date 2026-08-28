'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { DECENTRAVOTE_ABI, CONTRACT_ADDRESS } from '../lib/contract';

const Web3Context = createContext(null);

// Enforced strict MetaMask integration

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [readOnlyContract, setReadOnlyContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balance, setBalance] = useState('0');
  const [connectionType, setConnectionType] = useState(null); // 'METAMASK' or 'HARDHAT_SIMULATED'

  // Initialize Read-Only Provider & Contract
  useEffect(() => {
    async function initReadOnly() {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
        const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);
        const readContract = new ethers.Contract(CONTRACT_ADDRESS, DECENTRAVOTE_ABI, jsonRpcProvider);
        setReadOnlyContract(readContract);
        setProvider(jsonRpcProvider);
      } catch (err) {
        console.error("Failed to initialize read-only provider:", err);
      }
    }
    initReadOnly();
  }, []);

  // Check roles for connected account
  const checkRoles = useCallback(async (userAddress, contractInst) => {
    if (!userAddress || !contractInst) return;
    try {
      const orgRole = await contractInst.ORGANIZER_ROLE();
      const adminRole = await contractInst.DEFAULT_ADMIN_ROLE();
      const hasOrg = await contractInst.hasRole(orgRole, userAddress);
      const hasAdm = await contractInst.hasRole(adminRole, userAddress);
      setIsOrganizer(hasOrg);
      setIsAdmin(hasAdm);
    } catch (err) {
      console.warn("Could not fetch user roles:", err);
    }
  }, []);

  // Connect MetaMask Wallet
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert("MetaMask extension is required to vote on this production platform.");
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        const userSigner = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();
        const userBalance = await browserProvider.getBalance(accounts[0]);
        const contractInst = new ethers.Contract(CONTRACT_ADDRESS, DECENTRAVOTE_ABI, userSigner);

        setAccount(accounts[0]);
        setProvider(browserProvider);
        setSigner(userSigner);
        setContract(contractInst);
        setChainId(Number(network.chainId));
        setBalance(ethers.formatEther(userBalance));
        setConnectionType('METAMASK');

        await checkRoles(accounts[0], contractInst);
      }
    } catch (err) {
      console.error("MetaMask connection failed:", err);
      alert("Could not connect to MetaMask. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [checkRoles]);

  // Handle MetaMask events
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && connectionType === 'METAMASK') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setSigner(null);
          setContract(null);
          setIsOrganizer(false);
          setIsAdmin(false);
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [connectWallet, connectionType]);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        contract: contract || readOnlyContract,
        readOnlyContract,
        chainId,
        balance,
        isConnecting,
        isOrganizer,
        isAdmin,
        connectWallet,
        isWalletConnected: !!account,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
