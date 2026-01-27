import { useEffect, useState, useCallback } from 'react'; // Removed 'React' (unused)
import PropTypes from 'prop-types'; // Added for prop validation
import { 
  Shield, UserX, Signal, 
  Trash2, Edit, Plus, Users,
  X, Send, TrendingUp
} from 'lucide-react'; // Removed: Play, Pause, Activity, UserCheck, ShieldAlert, Target (unused)

// --- SIGNAL MODAL COMPONENT ---
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
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-blue-400" size={24} /> 
            {initialData ? 'Edit Signal' : 'Broadcast Signal'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
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

// Prop validation fixed here
SignalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

// --- MAIN ADMIN COMPONENT ---
const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [signals, setSignals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  
  // Wrapped in useCallback to satisfy useEffect dependency requirements
  const fetchData = useCallback(async () => {
    const headers = { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };
    try {
      const endpoint = activeTab === 'users' ? '/api/admin/users' : '/api/signals';
      const res = await fetch(`${API_URL}${endpoint}`, { headers });
      const data = await res.json();
      if (activeTab === 'users') setUsers(data); else setSignals(data);
    } catch (err) { console.error("Fetch error:", err); }
  }, [activeTab, API_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEditClick = (signal) => {
    setEditingSignal(signal);
    setIsModalOpen(true);
  };

  const handleUserToggle = async (userId, currentStatus) => {
    const headers = { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
      method: 'PATCH', headers, body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  const deleteSignal = async (id) => {
    const headers = { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };
    if (window.confirm("Delete this signal?")) {
      await fetch(`${API_URL}/api/admin/signals/${id}`, { method: 'DELETE', headers });
      fetchData();
    }
  };

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="text-blue-500" size={32} /> Command Center
        </h1>
      </div>

      <div className="flex gap-4 mb-6 border-b border-white/10">
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18}/>} label="Users" />
        <TabButton active={activeTab === 'signals'} onClick={() => setActiveTab('signals')} icon={<Signal size={18}/>} label="Signals" />
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-6">
        {activeTab === 'users' && (
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-400 text-sm uppercase">
                <th className="p-4">User</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${user.subscription_status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                      {user.subscription_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleUserToggle(user.id, user.subscription_status)} className="hover:text-red-400">
                      <UserX size={20}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'signals' && (
          <div>
            <div className="flex justify-between mb-6">
              <h3 className="text-lg font-semibold">Live Signals</h3>
              <button onClick={() => { setEditingSignal(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all">
                <Plus size={18}/> NEW SIGNAL
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {signals.map(signal => (
                <div key={signal.id} className="bg-black/30 border border-white/10 p-4 rounded-xl group">
                  <div className="flex justify-between">
                    <span className="text-blue-400 font-bold">{signal.pair}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleEditClick(signal)} className="hover:text-blue-400"><Edit size={16}/></button>
                      <button onClick={() => deleteSignal(signal.id)} className="hover:text-red-400"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 text-sm">
                    <span>Entry: <b>{signal.entry_price}</b></span>
                    <span className={`uppercase font-bold ${signal.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{signal.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SignalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData}
        initialData={editingSignal}
      />
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${active ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500'}`}>
    {icon} {label}
  </button>
);

TabButton.propTypes = {
    active: PropTypes.bool,
    onClick: PropTypes.func,
    icon: PropTypes.node,
    label: PropTypes.string
};

export default Admin;