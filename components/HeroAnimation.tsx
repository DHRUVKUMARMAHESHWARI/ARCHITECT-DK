import React, { useEffect, useState } from 'react';

const HeroAnimation: React.FC = () => {
  const [phase, setPhase] = useState<'old' | 'scanning' | 'new'>('old');

  // Loop the animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase('old');
      setTimeout(() => setPhase('scanning'), 1000); // Start scanning after 1s
      setTimeout(() => setPhase('new'), 2500); // Show new after 1.5s scan
      // Wait in 'new' state for 3s then loop
    }, 6000); // Total loop 6s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md h-[500px] perspective-1000">
      <div className="relative w-full h-full transform transition-all duration-700 animate-float">
        
        {/* Container with Glassmorphism */}
        <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Header Mockup */}
            <div className="h-4 bg-slate-100 border-b border-slate-200 flex items-center px-3 gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>

            {/* Content Area */}
            <div className="relative flex-grow p-6 overflow-hidden">
                
                {/* OLD RESUME LAYER */}
                <div 
                    className={`absolute inset-0 p-8 transition-opacity duration-500 bg-slate-50 ${phase === 'new' ? 'opacity-0' : 'opacity-100'}`}
                >
                     <div className="w-20 h-20 bg-slate-200 rounded-full mb-6 mx-auto"></div>
                     <div className="h-4 bg-slate-300 w-3/4 mx-auto mb-2 rounded"></div>
                     <div className="h-3 bg-slate-200 w-1/2 mx-auto mb-8 rounded"></div>
                     
                     <div className="space-y-3 opacity-60">
                        <div className="h-2 bg-slate-300 w-full rounded"></div>
                        <div className="h-2 bg-slate-300 w-5/6 rounded"></div>
                        <div className="h-2 bg-slate-300 w-full rounded"></div>
                        <div className="h-2 bg-slate-300 w-4/6 rounded"></div>
                     </div>
                     <div className="mt-8 space-y-3 opacity-60">
                        <div className="h-2 bg-slate-300 w-11/12 rounded"></div>
                        <div className="h-2 bg-slate-300 w-full rounded"></div>
                        <div className="h-2 bg-slate-300 w-3/4 rounded"></div>
                     </div>
                </div>

                {/* SCANNER BEAM */}
                {phase === 'scanning' && (
                    <div className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] z-20 animate-scan"></div>
                )}

                {/* NEW RESUME LAYER */}
                <div 
                    className={`absolute inset-0 p-0 transition-opacity duration-1000 bg-white ${phase !== 'new' ? 'opacity-0' : 'opacity-100'}`}
                >
                    {/* Modern Template Look */}
                    <div className="h-full flex flex-col">
                        <div className="h-24 bg-slate-900 flex items-center px-6 justify-between">
                            <div>
                                <div className="h-4 bg-white w-32 rounded mb-2"></div>
                                <div className="h-2 bg-slate-400 w-24 rounded"></div>
                            </div>
                            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">JS</div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1/3 space-y-2">
                                    <div className="h-2 bg-slate-200 w-full rounded"></div>
                                    <div className="h-2 bg-slate-200 w-2/3 rounded"></div>
                                    <div className="h-2 bg-slate-200 w-4/5 rounded"></div>
                                </div>
                                <div className="w-2/3 space-y-3">
                                     <div className="h-3 bg-slate-800 w-1/2 rounded mb-2"></div>
                                     <div className="h-2 bg-slate-300 w-full rounded"></div>
                                     <div className="h-2 bg-slate-300 w-full rounded"></div>
                                </div>
                            </div>
                            <div className="pt-2">
                                <div className="h-3 bg-slate-800 w-1/3 rounded mb-2"></div>
                                <div className="flex gap-2">
                                    <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
                                    <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
                                    <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

             {/* Status Badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/90 text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-lg transition-all duration-300">
                {phase === 'old' && 'Raw Format'}
                {phase === 'scanning' && <span className="text-indigo-400 animate-pulse">Analyzing...</span>}
                {phase === 'new' && <span className="text-green-400">Architected</span>}
            </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-700"></div>

      </div>
    </div>
  );
};

export default HeroAnimation;
