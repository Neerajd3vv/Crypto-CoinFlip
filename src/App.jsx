// src/App.js
import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import coinFlipAbi from "./coinFlipAbi.json";

const contractAddress = "0x04aEE09De3a56800CDB69EF4d6c75F34C6CF9D24";
const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(
  contractAddress,
  coinFlipAbi,
  provider.getSigner()
);

function App() {
  const [balance, setBalance] = useState("0");
  const [amount, setAmount] = useState("0");
  const [choice, setChoice] = useState(true); // true for heads, false for tails
  const [connected, setConnected] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected) {
      getBalance();
    }
  }, [connected]);

  const connectWallet = async () => {
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    console.log("Connected address:", address);
    setConnected(true);
    getBalance();
  };

  const getBalance = async () => {
    const balance = await provider.getBalance(
      await provider.getSigner().getAddress()
    );
    setBalance(ethers.utils.formatEther(balance));
  };

  const deposit = async () => {
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
  };

  const flipCoin = async () => {
    try {
      setLoading(true)
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
        setLoading(!loading);
      } else {
        setTransactions([
          ...transactions,
          { type: "Flip Coin", amount, result: `Loss. ${amount} ETH deducted` },
        ]);
        
      }

      getBalance();
    } catch (error) {
      setLoading(true)
      setTransactions([
        ...transactions,
        { type: "Flip Coin", amount, result: "Failed" },
      ]);
      
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="min-h-screen bg-gray-200  flex  items-center justify-center p-4">
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
                <span className="text-lg font-medium text-gray-700">Heads</span>
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
                <span className="text-lg font-medium text-gray-700">Tails</span>
              </label>
            </div>
            <div className="flex justify-between space-x-4">
              <button
                onClick={flipCoin}
                className="bg-red-600 font-semibold text-white py-2 px-4 rounded-full shadow-md hover:bg-red w-full"
              >
                Flip Coin
              </button>
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 text-center  text-gray-800">
              Bet Result
            </h2>
            {loading ? (
              
                <div className="bg-slate-100 flex justify-center p-3" role="status">
                  <svg
                    aria-hidden="true"
                    class="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span class="sr-only">Loading...</span>
                </div>
              
            ) : (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 max-h-72 overflow-y-auto">
                {transactions.length > 0 ? (
                  <ul>
                    {transactions.map((transaction, index) => (
                      <li
                        key={index}
                        className={`mb-2 p-2 rounded-lg ${
                          transaction.result.includes("Win")
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        <span className="font-semibold">
                          {transaction.type}:
                        </span>{" "}
                        {transaction.amount} ETH - {transaction.result}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No transactions yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default App;
