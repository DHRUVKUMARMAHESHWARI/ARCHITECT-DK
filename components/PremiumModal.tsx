import React, { useState } from 'react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (transactionId: string) => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!transactionId || transactionId.length < 8) {
      setError('Please enter a valid Transaction ID (min 8 chars)');
      return;
    }
    onUpgrade(transactionId);
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal - Glassmorphism */}
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-30 pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-30 pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Unlock Premium</h2>
          <p className="text-indigo-200 text-xs font-medium mb-6 uppercase tracking-widest">Lifetime Access for ₹50</p>

          <div className="bg-white p-4 rounded-2xl mb-6 inline-block shadow-lg">
             {/* Actual QR Code */}
             <div className="w-48 h-auto bg-slate-900 flex items-center justify-center rounded-lg overflow-hidden">
                <img src="/payment-qr.png" alt="Scan to Pay" className="w-full h-full object-cover" />
             </div>
             <div className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">UPI: 9302283069@ptsbi</div>
          </div>

          <div className="space-y-4 text-left mb-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block mb-2 ml-1">Step 1: Scan & Pay ₹50</label>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block mb-2 ml-1">Step 2: Enter Transaction ID / UTR</label>
              <input 
                type="text" 
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setError('');
                }}
                placeholder="Ex: 3125XXXX9821"
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-400 font-mono tracking-widest uppercase transition-all"
              />
              {error && <p className="text-red-400 text-[10px] font-bold mt-2 ml-1">{error}</p>}
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full py-4 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 hover:scale-[1.02] transition-all shadow-xl active:scale-95 mb-4"
          >
            Verify Payment
          </button>

          <button 
            onClick={onClose}
            className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
