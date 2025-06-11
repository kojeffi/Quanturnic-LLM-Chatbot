import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { backend } from 'declarations/backend';
import botImg from '/bot.svg';
import userImg from '/user.svg';
import '/index.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [chat, setChat] = useState([
    {
      role: { system: null },
      content: "I'm Quantumic, an AI-powered trading bot on ICP. I can analyze markets, execute trades, and answer questions."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [trades, setTrades] = useState([]);
  const chatBoxRef = useRef(null);

  const formatDate = (date) => {
    const h = '0' + date.getHours();
    const m = '0' + date.getMinutes();
    return `${h.slice(-2)}:${m.slice(-2)}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const askAgent = async (messages) => {
    try {
      const response = await backend.chat(messages);
      setChat((prevChat) => {
        const newChat = [...prevChat];
        newChat.pop();
        newChat.push({ role: { system: null }, content: response });
        return newChat;
      });
    } catch (e) {
      console.log(e);
      const eStr = String(e);
      const match = eStr.match(/(SysTransient|CanisterReject), \\+"([^\\"]+)/);
      if (match) {
        alert(match[2]);
      }
      setChat((prevChat) => {
        const newChat = [...prevChat];
        newChat.pop();
        return newChat;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      role: { user: null },
      content: inputValue
    };
    const thinkingMessage = {
      role: { system: null },
      content: 'Thinking ...'
    };
    setChat((prevChat) => [...prevChat, userMessage, thinkingMessage]);
    setInputValue('');
    setIsLoading(true);
    const messagesToSend = chat.slice(1).concat(userMessage);
    askAgent(messagesToSend);
  };

  const fetchPortfolio = async () => {
    try {
      const data = await backend.getPortfolio();
      setPortfolio(data);
    } catch (e) {
      console.error("Failed to fetch portfolio:", e);
    }
  };

  const fetchMarketData = async () => {
    try {
      const data = await backend.getMarketData();
      setMarketData(data);
    } catch (e) {
      console.error("Failed to fetch market data:", e);
    }
  };

  const fetchTradeHistory = async () => {
    try {
      const data = await backend.getTradeHistory();
      setTrades(data);
    } catch (e) {
      console.error("Failed to fetch trade history:", e);
    }
  };

  const executeAutoTrade = async () => {
    try {
      setIsLoading(true);
      const trade = await backend.autoTrade();
      await Promise.all([fetchPortfolio(), fetchTradeHistory()]);
      addSystemMessage(`Executed auto trade: ${trade.direction} ${trade.amount} ${trade.asset} at ${formatCurrency(trade.price)}. Reason: ${trade.reason}`);
    } catch (e) {
      console.error("Auto trade failed:", e);
      addSystemMessage("Auto trade failed. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const addSystemMessage = (content) => {
    setChat(prev => [...prev, { role: { system: null }, content }]);
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    // Initial data fetch
    fetchPortfolio();
    fetchMarketData();
    fetchTradeHistory();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-xl font-bold mb-6">Quanturnic</h1>
        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full text-left p-2 rounded ${activeTab === 'chat' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            AI Chat
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`w-full text-left p-2 rounded ${activeTab === 'portfolio' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`w-full text-left p-2 rounded ${activeTab === 'market' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            Market Data
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`w-full text-left p-2 rounded ${activeTab === 'trades' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            Trade History
          </button>
        </nav>

        <div className="mt-8">
          <button
            onClick={executeAutoTrade}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-2 rounded"
          >
            Execute Auto Trade
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto rounded-t-lg bg-white p-4 shadow" ref={chatBoxRef}>
              {chat.map((message, index) => {
                const isUser = 'user' in message.role;
                const img = isUser ? userImg : botImg;
                const name = isUser ? 'You' : 'Quantumic';
                const text = message.content;

                return (
                  <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                    {!isUser && (
                      <div
                        className="mr-2 h-10 w-10 rounded-full"
                        style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }}
                      ></div>
                    )}
                    <div className={`max-w-[70%] rounded-lg p-3 ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 shadow'}`}>
                      <div
                        className={`mb-1 flex items-center justify-between text-sm ${isUser ? 'text-white' : 'text-gray-500'}`}
                      >
                        <div>{name}</div>
                        <div className="mx-2">{formatDate(new Date())}</div>
                      </div>
                      <div>{text}</div>
                    </div>
                    {isUser && (
                      <div
                        className="ml-2 h-10 w-10 rounded-full"
                        style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
            <form className="flex rounded-b-lg border-t bg-white p-4 shadow" onSubmit={handleSubmit}>
              <input
                type="text"
                className="flex-1 rounded-l border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask about markets or trading..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="rounded-r bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
                disabled={isLoading}
              >
                Send
              </button>
            </form>
          </div>
        )}

        {activeTab === 'portfolio' && portfolio && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Portfolio Overview</h2>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Total Value</h3>
              <p className="text-3xl font-bold">{formatCurrency(portfolio.totalValue)}</p>
            </div>
            
            <h3 className="text-xl font-semibold mb-4">Asset Balances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.balances.map(([asset, balance]) => {
                const assetData = marketData.find(d => d.asset === asset);
                const price = assetData ? assetData.price : 0;
                return (
                  <div key={asset} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{asset}</span>
                      <span className="text-lg">{balance.toFixed(4)}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Value: {formatCurrency(balance * price)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Market Data</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marketData.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{data.asset}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(data.price)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap ${data.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(data.volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Trade History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trades.map((trade, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(trade.timestamp / 1000000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trade.direction === '#BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.direction === '#BUY' ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{trade.asset}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{trade.amount.toFixed(4)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(trade.price)}</td>
                      <td className="px-6 py-4">{trade.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);