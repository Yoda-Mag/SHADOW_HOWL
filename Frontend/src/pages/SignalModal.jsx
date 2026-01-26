import React, { useState } from 'react';
import { X, Send, Target, ShieldAlert, TrendingUp } from 'lucide-react';

const SignalModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    pair: '',
    type: 'BUY',
    entry: '',
    sl: '',
    tp: '',
    timeframe: '1H'
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/signals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess(); // Refresh signals list
        onClose();   // Close modal
        setFormData({ pair: '', type: 'BUY', entry: '', sl: '', tp: '', timeframe: '1H' });
      }
    } catch (err) {
      console.error("Failed to post signal:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-slate-800/50">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-blue-400" size={24} /> Broadcast Signal
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset Pair</label>
              <input 
                required
                placeholder="e.g. BTC/USDT"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 outline-none focus:border-blue-500 transition"
                value={formData.pair}
                onChange={(e) => setFormData({...formData, pair: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <select 
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 outline-none focus:border-blue-500 appearance-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="BUY" className="text-green-500">BUY / LONG</option>
                <option value="SELL" className="text-red-500">SELL / SHORT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
              <Target size={12}/> Entry Price
            </label>
            <input 
              required
              type="number" step="any"
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 outline-none focus:border-blue-500"
              value={formData.entry}
              onChange={(e) => setFormData({...formData, entry: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-red-400/60 uppercase mb-1 flex items-center gap-1">
                <ShieldAlert size={12}/> Stop Loss
              </label>
              <input 
                required
                type="number" step="any"
                className="w-full bg-black/40 border border-red-500/20 rounded-lg p-3 outline-none focus:border-red-500"
                value={formData.sl}
                onChange={(e) => setFormData({...formData, sl: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-green-400/60 uppercase mb-1 flex items-center gap-1">
                <Target size={12}/> Take Profit
              </label>
              <input 
                required
                type="number" step="any"
                className="w-full bg-black/40 border border-green-500/20 rounded-lg p-3 outline-none focus:border-green-500"
                value={formData.tp}
                onChange={(e) => setFormData({...formData, tp: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Transmitting...' : <><Send size={18}/> DEPLOY SIGNAL</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignalModal;