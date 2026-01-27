import { useState, useEffect } from 'react'; // Removed 'React' (unused)
import PropTypes from 'prop-types'; // Added for prop validation
import { X, Send, TrendingUp } from 'lucide-react';

const SignalModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    pair: '', type: 'buy', entry_price: '', sl: '', tp: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ pair: '', type: 'buy', entry_price: '', sl: '', tp: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = initialData ? 'PUT' : 'POST';
    const url = initialData 
      ? `${import.meta.env.VITE_API_URL}/api/admin/signals/${initialData.id}`
      : `${import.meta.env.VITE_API_URL}/api/admin/signals`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Signal save error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <TrendingUp className="text-blue-400" size={24} /> 
            {initialData ? 'Edit Signal' : 'Broadcast Signal'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="Pair (BTC/USDT)" 
              className="bg-black/40 border border-white/10 p-3 rounded-lg outline-none text-white"
              value={formData.pair}
              onChange={e => setFormData({...formData, pair: e.target.value.toUpperCase()})}
            />
            <select 
              className="bg-black/40 border border-white/10 p-3 rounded-lg outline-none text-white"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="buy">BUY</option>
              <option value="sell">SELL</option>
            </select>
          </div>
          <input 
            type="number" step="any" placeholder="Entry Price" 
            className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white"
            value={formData.entry_price}
            onChange={e => setFormData({...formData, entry_price: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="SL" className="bg-black/40 border border-red-500/20 p-3 rounded-lg text-white"
              value={formData.sl} onChange={e => setFormData({...formData, sl: e.target.value})}
            />
            <input 
              placeholder="TP" className="bg-black/40 border border-green-500/20 p-3 rounded-lg text-white"
              value={formData.tp} onChange={e => setFormData({...formData, tp: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition-all">
            <Send size={18}/> {initialData ? 'UPDATE' : 'DEPLOY'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- THIS SECTION FIXES THE "PROPS VALIDATION" ERRORS ---
SignalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pair: PropTypes.string,
    type: PropTypes.string,
    entry_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tp: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
};

export default SignalModal;