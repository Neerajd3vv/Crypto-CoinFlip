import React, { useState } from "react";
import { ethers } from "ethers";
import contractABI from "./coinFlipAbi.json";

const contractAddress = "0x727eD6Af0C22D5F16AC2C9B857a15b9ca0780278";

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [isHeads, setIsHeads] = useState(true);
  const [result, setResult] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);

  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const accounts = await provider.listAccounts();
        setWalletAddress(accounts[0]);
        setProvider(provider);
        setContract(contract);
        
        const balance = await provider.getBalance(accounts[0]);
        setWalletBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
      }
    } else {
      alert("MetaMask not detected. Please install MetaMask to use this app.");
    }
  }

  async function updateBalance(account) {
    if (provider) {
      const balance = await provider.getBalance(account);
      setWalletBalance(ethers.utils.formatEther(balance));
    }
  }

  async function flipCoin() {
    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
      alert("Please enter a valid bet amount.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const transaction = await contract.flipCoin(isHeads, {
        value: ethers.utils.parseEther(betAmount),
      });

      contract.once("CoinFlipped", (player, amount, win) => {
        const result = win;
        setResult(result);
        updateBalance(walletAddress);
        setGameHistory(prevHistory => [
          { betAmount, choice: isHeads ? "Heads" : "Tails", result },
          ...prevHistory
        ]);
        setIsLoading(false);
      });

      await transaction.wait();
    } catch (error) {
      console.error("Transaction failed:", error);
      setIsLoading(false);
    }
  }

  return (
    <div className="App min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Coin Flip Game</h1>
        
        {!walletAddress ? (
          <button
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        ) : (
          <>
            <p className="mb-6 text-xl text-center text-green-400">Balance: {walletBalance} ETH</p>
            <input
              className="border border-gray-700 bg-gray-700 text-white rounded-lg w-full py-3 px-4 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bet amount (ETH)"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
            <div className="flex mb-6">
              <button
                className={`flex-1 py-3 px-4 mr-2 rounded-lg transition-colors duration-200 ${
                  isHeads ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                onClick={() => setIsHeads(true)}
              >
                Heads
              </button>
              <button
                className={`flex-1 py-3 px-4 rounded-lg transition-colors duration-200 ${
                  !isHeads ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                onClick={() => setIsHeads(false)}
              >
                Tails
              </button>
            </div>
            <button
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
              onClick={flipCoin}
              disabled={isLoading}
            >
              {isLoading ? "Flipping..." : "Flip Coin"}
            </button>
            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-white"></div>
              </div>
            )}
            {result !== null && (
              <p className={`mt-6 text-xl text-center ${result ? "text-green-400" : "text-red-400"}`}>
                {result ? "You win!" : "You lose!"}
              </p>
            )}
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 text-white">Game History</h2>
              <ul className="space-y-2">
                {gameHistory.map((game, index) => (
                  <li key={index} className="text-white">
                    Bet: {game.betAmount} ETH - Choice: {game.choice} - Result: {game.result ? "Win" : "Loss"}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;