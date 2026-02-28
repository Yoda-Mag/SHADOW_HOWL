import { useState, useRef, useEffect } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: userMessage })
      };

      console.log('Fetching from:', '/api/chat/ask');
      const response = await fetch('/api/chat/ask', requestOptions);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      const answer = data.answer || data.text || 'No answer received';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${err.message}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white">AI_COACH</h1>
            <p className="text-blue-400 text-xs font-mono tracking-widest uppercase">Trading Intelligence System</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="text-xs border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-all"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-20">
              <p className="text-lg font-mono">Awaiting transmission...</p>
              <p className="text-sm mt-2">Send a message to begin consultation</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-2xl p-4 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600/20 border border-blue-500/30 text-white' 
                      : 'bg-slate-900/40 border border-white/5 text-slate-200'
                  }`}
                >
                  <p className="text-xs font-mono mb-2 opacity-60">
                    {msg.role === 'user' ? 'USER_INPUT' : 'AI_RESPONSE'}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-lg">
                <p className="text-xs font-mono mb-2 opacity-60">AI_RESPONSE</p>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-white/5 p-6 bg-slate-900/20">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI Coach..."
              disabled={loading}
              className="flex-1 bg-black/40 border border-white/10 p-4 rounded-xl text-white placeholder-white/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed"
            >
              SEND
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
