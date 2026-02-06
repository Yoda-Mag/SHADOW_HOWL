import { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Shield, UserX, Signal, 
  Trash2, Edit, Plus, Users,
  X, Send, TrendingUp, CheckCircle,
  AlertCircle, Loader2
} from 'lucide-react';

// --- SIGNAL MODAL COMPONENT ---
const SignalModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    pair: '', 
    direction: 'BUY', 
    entry_price: '', 
    stop_loss: '', 
    take_profit: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        pair: initialData.pair || '',
        direction: initialData.direction?.toUpperCase() || 'BUY',
        entry_price: initialData.entry_price || '',
        stop_loss: initialData.stop_loss || '',
        take_profit: initialData.take_profit || '',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({ 
        pair: '', 
        direction: 'BUY', 
        entry_price: '', 
        stop_loss: '', 
        take_profit: '',
        notes: ''
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const endpoint = initialData 
      ? `/api/signals/update/${initialData.id}`
      : '/api/signals/create';
    
    const method = initialData ? 'PUT' : 'POST';

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to save signal');
      }
    } catch (err) {
      console.error("Signal save error:", err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl transform transition-all">
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-blue-400" size={24} /> 
            {initialData ? 'Edit Signal' : 'Create New Signal'}
          </h3>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="Pair (BTC/USDT)" 
              className="bg-black/40 border border-white/10 p-3 rounded-lg outline-none text-white focus:border-blue-500/50 transition-colors"
              value={formData.pair}
              onChange={e => setFormData({...formData, pair: e.target.value.toUpperCase()})}
              maxLength={10}
              required
              disabled={isSubmitting}
            />
            <select 
              className="bg-black/40 border border-white/10 p-3 rounded-lg outline-none text-white focus:border-blue-500/50 transition-colors"
              value={formData.direction}
              onChange={e => setFormData({...formData, direction: e.target.value})}
              disabled={isSubmitting}
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          <input 
            type="number" 
            step="any" 
            placeholder="Entry Price" 
            className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white focus:border-blue-500/50 transition-colors outline-none"
            value={formData.entry_price}
            onChange={e => setFormData({...formData, entry_price: e.target.value})}
            required
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" 
              step="any"
              placeholder="Stop Loss" 
              className="bg-black/40 border border-red-500/20 p-3 rounded-lg text-white focus:border-red-500/50 transition-colors outline-none"
              value={formData.stop_loss} 
              onChange={e => setFormData({...formData, stop_loss: e.target.value})}
              required
              disabled={isSubmitting}
            />
            <input 
              type="number" 
              step="any"
              placeholder="Take Profit" 
              className="bg-black/40 border border-green-500/20 p-3 rounded-lg text-white focus:border-green-500/50 transition-colors outline-none"
              value={formData.take_profit} 
              onChange={e => setFormData({...formData, take_profit: e.target.value})}
              required
              disabled={isSubmitting}
            />
          </div>

          <textarea 
            placeholder="Notes (optional)" 
            className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white resize-none focus:border-blue-500/50 transition-colors outline-none"
            rows="3"
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            disabled={isSubmitting}
          />

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {initialData ? 'UPDATING...' : 'CREATING...'}
              </>
            ) : (
              <>
                <Send size={18}/> 
                {initialData ? 'UPDATE SIGNAL' : 'CREATE SIGNAL'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

SignalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

// --- SIGNAL CARD COMPONENT ---
const SignalCard = ({ signal, onEdit, onDelete, onToggleApproval, isProcessing }) => {
  const isApproved = signal.is_approved === 1;

  return (
    <div className={`bg-black/30 border p-4 rounded-xl group relative transition-all hover:scale-[1.02] ${
      isApproved ? 'border-green-500/30' : 'border-yellow-500/30'
    }`}>
      {/* Approval Badge */}
      <div className="absolute top-2 right-2">
        {isApproved ? (
          <CheckCircle className="text-green-400" size={20} />
        ) : (
          <AlertCircle className="text-yellow-400" size={20} />
        )}
      </div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-blue-400 font-bold text-lg">{signal.pair}</span>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {isApproved ? '✓ LIVE' : '⏳ PENDING APPROVAL'}
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-slate-400">Entry:</span>
          <b className="text-white">{signal.entry_price}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Stop Loss:</span>
          <b className="text-red-400">{signal.stop_loss}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Take Profit:</span>
          <b className="text-green-400">{signal.take_profit}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Direction:</span>
          <span className={`uppercase font-bold ${
            signal.direction === 'BUY' ? 'text-green-400' : 'text-red-400'
          }`}>
            {signal.direction}
          </span>
        </div>
      </div>

      {signal.notes && (
        <div className="text-xs text-slate-400 mb-4 p-2 bg-white/5 rounded border border-white/5">
          {signal.notes}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-white/10">
        <button 
          onClick={() => onToggleApproval(signal.id)}
          disabled={isProcessing}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isApproved
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
        >
          {isProcessing ? (
            <Loader2 size={14} className="animate-spin mx-auto" />
          ) : (
            isApproved ? 'Unapprove' : 'Approve'
          )}
        </button>
        <button 
          onClick={() => onEdit(signal)} 
          disabled={isProcessing}
          className="px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-all disabled:opacity-50"
        >
          <Edit size={16}/>
        </button>
        <button 
          onClick={() => onDelete(signal.id)} 
          disabled={isProcessing}
          className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all disabled:opacity-50"
        >
          <Trash2 size={16}/>
        </button>
      </div>
    </div>
  );
};

SignalCard.propTypes = {
  signal: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleApproval: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool
};

// --- MAIN ADMIN COMPONENT ---
const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [signals, setSignals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingSignalId, setProcessingSignalId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    const headers = { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    };
    
    try {
      if (activeTab === 'users') {
        const res = await fetch(`${API_URL}/api/admin/users`, { headers });
        const data = await res.json();
        setUsers(data);
      } else {
        // Admin sees all signals (approved and unapproved)
        const res = await fetch(`${API_URL}/api/signals`, { headers });
        const data = await res.json();
        setSignals(data);
      }
    } catch (err) { 
      console.error("Fetch error:", err); 
    } finally {
      setLoading(false);
    }
  }, [activeTab, API_URL]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleEditClick = useCallback((signal) => {
    setEditingSignal(signal);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingSignal(null);
  }, []);

  const handleUserToggle = async (userId, currentStatus) => {
    const headers = { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    };
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
        method: 'PATCH', 
        headers, 
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error("User toggle error:", err);
    }
  };

  const toggleApproval = async (signalId) => {
    setProcessingSignalId(signalId);
    
    const headers = { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const res = await fetch(`${API_URL}/api/admin/signals/${signalId}/approve`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_approved: 1 })
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Toggle approval error:", err);
    } finally {
      setProcessingSignalId(null);
    }
  };

  const deleteSignal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this signal? This action cannot be undone.")) {
      return;
    }

    const headers = { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    };
    
    try {
      await fetch(`${API_URL}/api/signals/delete/${id}`, { 
        method: 'DELETE', 
        headers 
      });
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Separate approved and unapproved signals
  const { approvedSignals, pendingSignals } = useMemo(() => {
    const approved = signals.filter(s => s.is_approved === 1);
    const pending = signals.filter(s => s.is_approved === 0);
    return { approvedSignals: approved, pendingSignals: pending };
  }, [signals]);

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="text-blue-500" size={32} /> Admin Center
        </h1>
        {loading && (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-6 border-b border-white/10">
        <TabButton 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')} 
          icon={<Users size={18}/>} 
          label="Users" 
        />
        <TabButton 
          active={activeTab === 'signals'} 
          onClick={() => setActiveTab('signals')} 
          icon={<Signal size={18}/>} 
          label="Signals" 
          badge={pendingSignals.length > 0 ? pendingSignals.length : null}
        />
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-6 min-h-[500px]">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-400 text-sm uppercase">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Expiry</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-slate-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.username && (
                            <div className="text-xs text-slate-400">@{user.username}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md text-xs font-bold bg-purple-500/20 text-purple-400">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          user.subscription_status === 'active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.subscription_status || 'inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {user.subscription_expiry 
                          ? new Date(user.subscription_expiry).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleUserToggle(user.id, user.subscription_status)} 
                          className="hover:text-red-400 transition-colors"
                          title={user.subscription_status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <UserX size={20}/>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'signals' && (
          <div>
            <div className="flex justify-between mb-6">
              <h3 className="text-lg font-semibold">Signal Management</h3>
              <button 
                onClick={() => { 
                  setEditingSignal(null); 
                  setIsModalOpen(true); 
                }} 
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all"
              >
                <Plus size={18}/> NEW SIGNAL
              </button>
            </div>

            {/* Pending Approval Section */}
            {pendingSignals.length > 0 && (
              <div className="mb-8">
                <h4 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Pending Approval ({pendingSignals.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingSignals.map(signal => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      onEdit={handleEditClick}
                      onDelete={deleteSignal}
                      onToggleApproval={toggleApproval}
                      isProcessing={processingSignalId === signal.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Approved Signals Section */}
            <div>
              <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                <CheckCircle size={18} />
                Live Signals ({approvedSignals.length})
              </h4>
              {approvedSignals.length === 0 && !loading ? (
                <div className="text-center p-12 text-slate-400 bg-black/20 rounded-xl">
                  <Signal size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No approved signals yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedSignals.map(signal => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      onEdit={handleEditClick}
                      onDelete={deleteSignal}
                      onToggleApproval={toggleApproval}
                      isProcessing={processingSignalId === signal.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <SignalModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        onSuccess={fetchData}
        initialData={editingSignal}
      />
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, badge }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all relative ${
      active 
        ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
        : 'border-transparent text-slate-500 hover:text-slate-300'
    }`}
  >
    {icon} {label}
    {badge && (
      <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

TabButton.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func,
  icon: PropTypes.node,
  label: PropTypes.string,
  badge: PropTypes.number
};

export default Admin;