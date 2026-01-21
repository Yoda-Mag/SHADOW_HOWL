import React, { useEffect, useState } from 'react';

export default function Feed() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/signals', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setSignals(data);
      } catch (err) {
        console.error("Failed to intercept signals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, []);


const [input, setInput] = useState('');
const [messages, setMessages] = useState([
  { role: 'system', content: 'SadowHowl_OPERATOR v1.0 connected. How can I assist with the data stream?' }
]);

const sendMessage = async (e) => {
  e.preventDefault();
  if (!input.trim()) return;

  const userMsg = { role: 'user', content: input };
  setMessages(prev => [...prev, userMsg]);
  setInput('');

  try {
    // Replace with your chatbot backend endpoint
    const response = await fetch('http://localhost:5000/api/chat/ask', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ prompt: input }),
    });
    
    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
  } catch (err) {
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
        {loading ? (
          <div className="animate-pulse text-blue-500 font-mono">Scanning frequencies...</div>
        ) : (
          signals.map((signal) => (
            <div key={signal.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md hover:border-blue-500/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                    {signal.type || 'DATA_NODE'}
                </span>
                <span className="text-xs text-slate-500 italic">
                    {/* MySQL 'datetime' or 'timestamp' works perfectly with new Date() */}
                    {new Date(signal.created_at || signal.createdAt).toLocaleString()}
                </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {signal.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                {signal.content}
                </p>
            </div>
            ))
        )}

        {/* Floating Chatbot Console */}
            <div className="fixed bottom-6 right-6 w-80 h-96 bg-slate-900/90 border border-blue-500/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
            <div className="bg-blue-600/20 p-3 border-b border-white/10 flex justify-between">
                <span className="text-xs font-mono font-bold text-blue-400">OPERATOR_LOG</span>
                <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
                </div>
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


      </main>
    </div>
  );
}