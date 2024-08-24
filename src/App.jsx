// src/App.js
import { ethers } from "ethers";
import React, { useState, useEffect, useCallback } from "react";
import coinFlipAbi from "./coinFlipAbi.json";

const contractAddress = "0x1771e539a0D0f3A4A9f3972A6E7371Af2a5D854B";

function App() {
  const [balance, setBalance] = useState("0");
  const [amount, setAmount] = useState("");
  const [choice, setChoice] = useState(true); // true for heads, false for tails
  const [connected, setConnected] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const providerInstance = new ethers.providers.Web3Provider(
        window.ethereum
      );
      setProvider(providerInstance);

      const contractInstance = new ethers.Contract(
        contractAddress,
        coinFlipAbi,
        providerInstance.getSigner()
      );
      setContract(contractInstance);
    } else {
      setError("MetaMask is not installed. Please install MetaMask.");
    }
  }, []);

  useEffect(() => {
    if (connected && provider && contract) {
      getBalance();
    }
  }, [connected, provider, contract]);

  const connectWallet = useCallback(async () => {
    try {
      if (!provider) {
        setError("MetaMask is not installed. Please install MetaMask.");
        return;
      }

      await provider.send("eth_requestAccounts", []);
      setConnected(true);
      getBalance();
    } catch (error) {
      setError("Failed to connect wallet. Please try again.");
      console.error("Failed to connect wallet:", error);
    }
  }, [provider]);

  const getBalance = useCallback(async () => {
    if (provider) {
      try {
        const signer = provider.getSigner();
        const balance = await provider.getBalance(await signer.getAddress());
        setBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        setError("Failed to fetch balance. Please try again.");
        console.error("Failed to fetch balance:", error);
      }
    }
  }, [provider]);

  const flipCoin = useCallback(async () => {
    if (!contract || !amount) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Step 1: Deposit the amount
      const depositTx = await contract.deposit({
        value: ethers.utils.parseEther(amount),
      });
      await depositTx.wait();

      // Step 2: Flip the coin
      const flipTx = await contract.flipCoin(choice);
      const receipt = await flipTx.wait();

      // Assuming the contract emits an event for the result
      const win = receipt.events.some(
        (event) =>
          event.event === "CoinFlipResult" && event.args.result === choice
      );

      const resultMessage = win
        ? `Win! ${ethers.utils.formatEther(
            ethers.utils.parseEther(amount).mul(2)
          )} ETH credited`
        : `Loss. ${amount} ETH deducted`;

      setTransactions([
        ...transactions,
        { type: "Flip Coin", amount, result: resultMessage },
      ]);

      getBalance();
    } catch (error) {
      setError("Failed to flip the coin. Please try again.");
      console.error("Failed to flip the coin:", error);
    } finally {
      setLoading(false);
    }
  }, [contract, amount, choice, transactions, getBalance]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8">
          Coin Flip Game
        </h1>
        {!connected ? (
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-8 space-y-6">
            <div className="text-center">
              <span className="text-2xl font-semibold text-gray-700">
                Balance: {balance} ETH
              </span>
            </div>
            {error && (
              <div className="text-red-600 font-semibold">{error}</div>
            )}
            <div className="space-y-4">
              <input
                type="number"
                min="0"
                placeholder="Amount (ETH)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 p-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
              />
              <div className="flex justify-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    id="heads"
                    name="choice"
                    checked={choice}
                    onChange={() => setChoice(true)}
                    className="form-radio text-blue-500"
                  />
                  <span className="text-lg font-medium text-gray-700">
                    Heads
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    id="tails"
                    name="choice"
                    checked={!choice}
                    onChange={() => setChoice(false)}
                    className="form-radio text-blue-500"
                  />
                  <span className="text-lg font-medium text-gray-700">
                    Tails
                  </span>
                </label>
              </div>
              <button
                onClick={flipCoin}
                className="bg-red-600 font-semibold text-white py-3 px-4 rounded-full shadow-md hover:bg-red-700 w-full transition duration-300"
                disabled={loading}
              >
                {loading ? "Flipping..." : "Flip Coin"}
              </button>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
                Bet Results
              </h2>
              <div className="space-y-2">
                {loading ? (
                  <div className="bg-gray-100 p-3 flex justify-center">
                    <svg
                      aria-hidden="true"
                      className="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5537C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7233 75.2124 7.41289C69.5422 4.10251 63.2754 1.94025 56.7221 1.05117C51.7663 0.367515 46.7355 0.446996 41.8234 1.27873C39.3072 1.6942 37.8173 4.19778 38.4544 6.62326C39.0915 9.04874 41.5741 10.5181 43.9995 9.90262C48.2298 9.00103 52.6142 9.00073 56.8638 9.86978C61.8727 10.8218 66.6278 12.7973 70.8347 15.6993C75.0417 18.6013 78.615 22.3586 81.3076 26.7478C83.5846 30.3736 85.2811 34.3468 86.3423 38.4764C86.9594 40.8343 89.5422 42.3414 91.9676 41.7043Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span className="sr-only">Loading...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-gray-500">No bets placed yet.</p>
                ) : (
                  transactions.map((tx, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg text-white shadow-md ${
                        tx.result.includes("Win")
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      <p>{tx.result}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
