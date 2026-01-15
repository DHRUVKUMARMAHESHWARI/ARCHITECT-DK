import React, { useEffect, useState } from 'react';
import { getAllUsers, approvePayment, rejectPayment } from '../services/api';
import { User } from '../types';

interface AdminDashboardProps {
  currentUser: any;
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onClose }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!window.confirm('Approve this payment?')) return;
    try {
      await approvePayment(userId);
      fetchUsers(); // Refresh list
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm('Reject this payment?')) return;
    try {
      await rejectPayment(userId);
      fetchUsers(); // Refresh list
    } catch (err) {
      alert('Failed to reject');
    }
  };

  if (currentUser?.email !== 'dhruv@gmail.com') return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-white flex flex-col font-sans">
      <div className="h-20 border-b border-slate-200 flex items-center justify-between px-8 bg-white">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
        <button 
          onClick={onClose}
          className="text-sm font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-6 mb-8">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
                <p className="text-3xl font-black text-slate-900">{users.length}</p>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Premium Users</p>
                <p className="text-3xl font-black text-indigo-600">{users.filter(u => u.isPremium).length}</p>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue (Est)</p>
                <p className="text-3xl font-black text-green-600">₹{users.filter(u => u.isPremium).length * 50}</p>
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Downloads</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction ID</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Date</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="p-4">
                      {user.isPremium ? (
                         <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wide">
                            Premium
                         </span>
                      ) : user.paymentStatus === 'pending' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-yellow-50 text-yellow-600 border border-yellow-100 uppercase tracking-wide">
                            Pending
                         </span>
                      ) : (
                         <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 uppercase tracking-wide">
                            Free
                         </span>
                      )}
                    </td>
                    <td className="p-4">
                       <span className="font-mono text-sm font-bold text-slate-600">{user.downloads}</span>
                    </td>
                    <td className="p-4">
                       {user.transactionId ? (
                         <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 select-all">
                           {user.transactionId}
                         </span>
                       ) : (
                         <span className="text-slate-300 text-xs">-</span>
                       )}
                    </td>
                    <td className="p-4">
                        {user.paymentDate ? (
                          <span className="text-xs text-slate-500 font-medium">
                            {new Date(user.paymentDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                    </td>
                    <td className="p-4 flex gap-2">
                       {user.paymentStatus === 'pending' && (
                         <>
                           <button 
                            onClick={() => handleApprove(user._id)}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-green-200 transition-colors"
                           >
                             Approve
                           </button>
                           <button 
                            onClick={() => handleReject(user._id)}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-red-200 transition-colors"
                           >
                             Reject
                           </button>
                         </>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="p-8 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">Loading...</div>}
            {!loading && users.length === 0 && <div className="p-8 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">No users found</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
