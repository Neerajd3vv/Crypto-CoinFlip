// src/App.js
import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import coinFlipAbi from "./coinFlipAbi.json";

const contractAddress = "0x04aEE09De3a56800CDB69EF4d6c75F34C6CF9D24";

function App() {
  const [balance, setBalance] = useState("0");
  const [amount, setAmount] = useState("0");
  const [choice, setChoice] = useState(true); // true for heads, false for tails
  const [connected, setConnected] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialising  provider and contract only if MetaMask is present
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

  const deposit = async () => {
    if (contract) {
      try {
        const transaction = await contract.deposit({
          value: ethers.utils.parseEther(amount),
        });
        await transaction.wait();
        getBalance();
        setTransactions([
          ...transactions,
          { type: "Deposit", amount, result: "Success" },
        ]);
      } catch (error) {
        setTransactions([
          ...transactions,
          { type: "Deposit", amount, result: "Failed" },
        ]);
      }
    }
  };

  const flipCoin = async () => {
    if (contract) {
      try {
        setLoading(true);
        const transaction = await contract.flipCoin(choice, {
          value: ethers.utils.parseEther(amount),
        });
        const receipt = await transaction.wait();
        const win = receipt.events?.some(
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
              <button
                onClick={deposit}
                className="bg-green-600 font-semibold text-white py-2 px-4 rounded-full shadow-md hover:bg-green-700 w-full"
              >
                Bet Amount
              </button>
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
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.06326 38.0059 6.38002C38.1463 8.34047 40.4735 9.74595 42.5391 9.69367C46.5856 9.58629 50.6869 9.984 54.6323 10.9513C58.5777 11.9187 62.2534 13.4193 65.7572 15.3843C68.9414 17.054 71.9461 19.1858 74.6882 21.5736C76.7071 23.4464 78.5063 25.6018 80.0375 27.9642C81.1606 29.4516 82.0737 31.1258 82.6817 32.8869C82.9034 33.8727 84.4304 34.2988 85.6915 33.6683C88.6741 32.486 91.5371 30.7131 93.9676 28.0318V39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                </div>
              ) : (
                <ul className="list-disc list-inside p-4 bg-slate-100 rounded-lg">
                  {transactions.map((transaction, index) => (
                    <li
                      key={index}
                      className={`flex justify-between p-2 ${
                        transaction.result === "Success"
                          ? "text-green-600"
                          : transaction.result === "Failed"
                          ? "text-red-600"
                          : "text-gray-800"
                      }`}
                    >
                      <span>
                        {transaction.type}: {transaction.amount} ETH
                      </span>
                      <span>{transaction.result}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
