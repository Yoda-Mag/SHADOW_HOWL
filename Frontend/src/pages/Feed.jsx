import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

export default function Feed() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        // Check subscription status first
        const subscriptionStatus = localStorage.getItem('subscription_status');
        if (subscriptionStatus !== 'active') {
          window.location.href = '/restricted';
          return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/signals', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Handle error responses
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || 'Failed to fetch signals');
          setSignals([]);
        } else {
          const data = await response.json();
          setSignals(data || []);
          setError('');
        }
      } catch (err) {
        console.error("Failed to fetch signals:", err);
        setError('Network error. Please refresh the page.');
        setSignals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, []);


const [input, setInput] = useState('');
const [chatOpen, setChatOpen] = useState(false);
const [messages, setMessages] = useState([
  { role: 'system', content: 'SadowHowl_OPERATOR v1.0 connected. How can I assist with the data stream?' }
]);

const sendMessage = async (e) => {
  e.preventDefault();
  if (!input.trim()) return;

  const userMsg = { role: 'user', content: input };
  setMessages(prev => [...prev, userMsg]);
  const messageToSend = input;
  setInput('');

  try {
    const response = await fetch('http://localhost:5000/api/chat/ask', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ prompt: messageToSend }),
    });
    
    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.answer || data.text || 'No response' }]);
  } catch (err) {
    console.error('Error:', err);
    setMessages(prev => [...prev, { role: 'assistant', content: 'ERROR: Uplink failed. System offline.' }]);
  }
};

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">SIGNAL_FEED</h1>
          <p className="text-blue-400 text-xs font-mono tracking-widest uppercase">System Status: Encrypted</p>
        </div>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-xs border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-all"
        >
          Log out
        </button>
      </header>

      {/* Main Feed */}
      <main className="max-w-6xl mx-auto grid gap-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="animate-pulse text-blue-500 font-mono">Scanning frequencies...</div>
        ) : signals && signals.length > 0 ? (
          signals.map((signal) => (
            <div key={signal.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md hover:border-blue-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                {/* Show Direction (BUY/SELL) instead of type */}
                <span className={`text-xs font-mono px-2 py-1 rounded font-bold ${
                  signal.direction === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {signal.direction}
                </span>
                <span className="text-xs text-slate-500 italic">
                  {new Date(signal.created_at).toLocaleString()}
                </span>
              </div>

              {/* Display the Trading Pair (e.g., XAU/USD) */}
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {signal.pair}
              </h3>

              {/* Display Trading Details */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm font-mono">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Entry</p>
                  <p className="text-blue-300">{signal.entry_price}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Stop Loss</p>
                  <p className="text-red-400">{signal.stop_loss}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Take Profit</p>
                  <p className="text-green-400">{signal.take_profit}</p>
                </div>
              </div>

              {/* Display Notes/Disclaimer */}
              <p className="text-slate-400 text-xs leading-relaxed border-t border-white/5 pt-4">
                {signal.notes}
              </p>
            </div>
          ))
        ) : !loading && signals.length === 0 && !error ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg">No signals available at the moment.</p>
            <p className="text-sm">Check back soon for new trading opportunities.</p>
          </div>
        ) : null}

        {/* Floating Chatbot Toggle Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-50"
          title="Open AI Coach"
        >
          <FontAwesomeIcon icon={faRobot} size="lg" />
        </button>

        {/* Floating Chatbot Console */}
        {chatOpen && (
          <div className="fixed bottom-24 right-6 w-80 h-96 bg-slate-900/90 border border-blue-500/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden z-50">
            <div className="bg-blue-600/20 p-3 border-b border-white/10 flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-blue-400">WOLF CHAT</span>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white hover:text-red-400 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600/20 text-blue-100 border border-blue-500/20' 
                      : 'bg-white/5 text-slate-300 border border-white/5'
                  }`}>
                    {msg.content}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-white/10">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type command..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500 transition-all"
              />
            </form>
          </div>
        )}


      </main>
    </div>
  );
}