// src/App.js
import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import coinFlipAbi from "./coinFlipAbi.json";

const contractAddress = "0x1771e539a0D0f3A4A9f3972A6E7371Af2a5D854B";

function App() {
  const [balance, setBalance] = useState("0");
  const [amount, setAmount] = useState("0");
  const [choice, setChoice] = useState(true); // true for heads, false for tails
  const [connected, setConnected] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

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
      alert(
        "MetaMask is not installed. Please install MetaMask to use this application."
      );
    }
  }, []);

  useEffect(() => {
    if (connected && provider && contract) {
      getBalance();
    }
  }, [connected, provider, contract]);

  const connectWallet = async () => {
    try {
      if (!provider) {
        alert(
          "MetaMask is not installed. Please install MetaMask to use this application."
        );
        return;
      }

      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log("Connected address:", address);
      setConnected(true);
      getBalance();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const getBalance = async () => {
    if (provider) {
      const balance = await provider.getBalance(
        await provider.getSigner().getAddress()
      );
      setBalance(ethers.utils.formatEther(balance));
    }
  };

  const flipCoin = async () => {
    if (contract && amount) {
      try {
        setLoading(true);

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

        if (win) {
          const amountWon = ethers.utils.formatEther(
            ethers.utils.parseEther(amount).mul(2)
          );
          setTransactions([
            ...transactions,
            {
              type: "Flip Coin",
              amount,
              result: `Win! ${amountWon} ETH credited`,
            },
          ]);
        } else {
          setTransactions([
            ...transactions,
            {
              type: "Flip Coin",
              amount,
              result: `Loss. ${amount} ETH deducted`,
            },
          ]);
        }

        getBalance();
      } catch (error) {
        console.error("Failed to flip the coin:", error);
        setTransactions([
          ...transactions,
          { type: "Flip Coin", amount, result: "Failed" },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
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
            <div className="space-y-4">
              <input
                type="text"
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
              <div className="flex justify-between space-x-4">
                <button
                  onClick={flipCoin}
                  className="bg-red-600 font-semibold text-white py-2 px-4 rounded-full shadow-md hover:bg-red-700 w-full"
                  disabled={loading}
                >
                  Flip Coin
                </button>
              </div>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
                Bet Result
              </h2>
              {loading ? (
                <div
                  className="bg-slate-100 flex justify-center p-3"
                  role="status"
                >
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
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5537C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7233 75.2124 7.41289C69.5422 4.10251 63.2754 1.94025 56.7221 1.05117C51.7663 0.367515 46.7355 0.446996 41.8234 1.27873C39.3072 1.6942 37.8173 4.19778 38.4544 6.62326C39.0915 9.04874 41.5741 10.5181 43.9995 9.90262C48.2298 9.00103 52.6142 9.00073 56.8638 9.86978C61.8727 10.8218 66.6278 12.7973 70.8253 15.6867C75.0229 18.576 78.5912 22.3222 81.3117 26.7385C83.606 30.2747 85.2295 34.2267 86.1145 38.3296C86.6818 40.7859 89.5421 42.0109 91.9676 41.3738Z"
                      fill="currentFill"
                    />
                  </svg>
                </div>
              ) : (
                transactions.map((tx, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-300 py-2 px-4 text-gray-700"
                  >
                    {tx.type} - {tx.amount} ETH: {tx.result}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
