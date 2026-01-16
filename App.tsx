
import React, { useState, useRef, useEffect } from 'react';
import { convertResumeFile, createResumeFromText, getATSFeedback, improveResumeContent, reorderResumeSections, logout, getMe } from './services/api';
import { AppState, ExtractedResume, ATSFeedback, ToastMessage, TemplateId } from './types';
import RichEditor from './components/RichEditor';
import AuthModal from './components/AuthModal';
import PremiumModal from './components/PremiumModal';
import AdminDashboard from './components/AdminDashboard';
import { trackDownload, upgradeToPremium } from './services/api';

const TEMPLATES: {id: TemplateId, name: string, description: string, preview: string}[] = [
  { id: 'sourabh', name: 'Executive Classic', description: 'Horizontal rules & split header. Highly professional.', preview: 'border-t-4 border-slate-900' },
  { id: 'modern-mono', name: 'Modern Mono', description: 'Clean, monospaced developer aesthetic.', preview: 'border-t-4 border-slate-700' },
  { id: 'editorial', name: 'The Editorial', description: 'Magazine-style serif for creative leaders.', preview: 'border-t-4 border-red-800' },
  { id: 'brutalist', name: 'The Brutalist', description: 'Bold, heavy borders and high-impact type.', preview: 'border-t-4 border-black' },
  { id: 'jacqueline', name: 'Thompson Purple', description: 'Centered header with purple accents.', preview: 'border-t-4 border-purple-500' },
  { id: 'neon-tech', name: 'Neon Futurist', description: 'Sleek, tech-focused with teal accents.', preview: 'border-t-4 border-teal-500' },
  { id: 'swiss-grid', name: 'Swiss Grid', description: 'Ultra-clean, architectural grid design.', preview: 'border-t-4 border-slate-400' },
  { id: 'academic-vintage', name: 'The Scholar', description: 'Typewriter serif for academic profiles.', preview: 'border-t-4 border-orange-200' },
  { id: 'geometric-eng', name: 'Technical Engineer', description: 'Slanted geometric headers and blue accents.', preview: 'border-t-4 border-blue-900' },
  { id: 'executive-gold', name: 'Partner Suite', description: 'Luxury gold accents with classic serif.', preview: 'border-t-4 border-yellow-700' },
  { id: 'midnight-navy', name: 'The Corporate', description: 'Deep navy professional corporate blocks.', preview: 'border-t-4 border-indigo-950' },
  { id: 'soft-minimal', name: 'Soft Minimal', description: 'Rounded edges and gentle pink highlights.', preview: 'border-t-4 border-pink-200' },
  { id: 'startup-clean', name: 'Startup Clean', description: 'Friendly, rounded fonts with sky blue accents.', preview: 'border-t-4 border-sky-400' },

  { id: 'minimal', name: 'Standard Minimal', description: 'Ultra-clean, single column design.', preview: 'border-t-4 border-slate-200' },
  { id: 'deloitte', name: 'Deloitte Resume Temp', description: 'Premium Deloitte Style with Photo.', preview: 'border-t-4 border-green-600' }
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [pastedText, setPastedText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeData, setResumeData] = useState<ExtractedResume | null>(null);
  const [editedHtml, setEditedHtml] = useState<string>('');
  const [feedback, setFeedback] = useState<ATSFeedback | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('sourabh');
  
  // Auth State
  const [user, setUser] = useState<any>(null); // Ideally use a proper User type
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  
  // Security: Blur State
  const [isBlurred, setIsBlurred] = useState(false);

  // New: Profile Image State for Premium Templated (e.g. Deloitte)
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Block Context Menu (Inspect Element)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Block DevTools Shortcuts & Detect Screenshot Attempts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block DevTools (F12, Ctrl+Shift+I/J/C, Cmd+Option+I/J/C)
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
        (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        return false;
      }

      // Detect Screenshot Keys (Mac Cmd+Shift+3/4/5, Windows PrtSc)
      if (
        e.key === 'PrintScreen' || 
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))
      ) {
        setIsBlurred(true);
        // Keep blurred briefly to ruin the screenshot
        setTimeout(() => setIsBlurred(false), 2000);
      }
    };

    // 3. Blur on Window Focus Loss (Snipping Tools, Tab Switching)
    const handleWindowBlur = () => {
      setIsBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsBlurred(false);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  const addToast = (text: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Strict Lock: Upload is Premium Only
    if (!user.isPremium) {
      setShowPremiumModal(true);
      addToast('Resume Upload is a Premium Feature. Please Paste Text or Upgrade.', 'info');
      // Reset input
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    setState('PROCESSING');
    addToast('Architecting your data...', 'info');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const result = await convertResumeFile(base64, file.type, jobDescription);
        setResumeData(result);
        setEditedHtml(result.htmlContent);
        setState('EDITING');
        addToast('Architecture complete!', 'success');
        const fb = await getATSFeedback(result.rawText, jobDescription);
        setFeedback(fb);
      } catch (err) {
        addToast('Process failed. Try a different image or text.', 'error');
        setState('IDLE');
      }
    };
    reader.readAsDataURL(file);
    reader.readAsDataURL(file);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image too large. Max 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setProfileImage(result);
      addToast('Profile photo added!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!pastedText.trim()) return addToast('Please enter text.', 'info');
    setState('PROCESSING');
    try {
      const result = await createResumeFromText(pastedText, jobDescription);
      setResumeData(result);
      setEditedHtml(result.htmlContent);
      setState('EDITING');
      addToast('Resume structured!', 'success');
      const fb = await getATSFeedback(result.rawText, jobDescription);
      setFeedback(fb);
    } catch (err) {
      addToast('Structure failed.', 'error');
      setState('IDLE');
    }
  };

  const handleSmartReorder = async () => {
    if (!jobDescription.trim()) {
      addToast('Please provide a Job Description for Smart Reordering.', 'info');
      return;
    }
    setState('PROCESSING');
    addToast('AI analyzing JD vs Content for optimal sequence...', 'info');
    try {
      const reorderedHtml = await reorderResumeSections(editedHtml, jobDescription);
      setEditedHtml(reorderedHtml);
      addToast('Smart Sequence Applied!', 'success');
    } catch (err) {
      addToast('Reordering failed.', 'error');
    } finally {
      setState('EDITING');
    }
  };

  const handleExportPDF = async () => {
    if (!user) {
       setShowAuthModal(true);
       return;
    }

    // Check limit
    try {
      const res = await trackDownload(selectedTemplate);
      // Update local user state with new download count
      setUser((prev: any) => ({ ...prev, downloads: res.downloads }));
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        setShowPremiumModal(true);
        return;
      }
      addToast('Download failed. Try again.', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Popup blocked! Please allow popups to generate your PDF.', 'error');
      return;
    }
    
    // Clear photo after export triggered (Requirement: delete after download)
    if (selectedTemplate === 'deloitte') {
        setTimeout(() => setProfileImage(null), 5000); 
    }
    
    const styles = Array.from(document.querySelectorAll('style'))
      .map(style => style.innerHTML)
      .join('\n');

    const photoHtml = (selectedTemplate === 'deloitte' && profileImage) 
      ? `<div class="deloitte-photo-container"><img src="${profileImage}" /></div>` 
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume - ${resumeData?.candidateName || 'ATS Architect'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&family=IBM+Plex+Mono:wght@400;500&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            ${styles}
            body { 
              background: white !important; 
              margin: 0; 
              padding: 0; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .resume-page-container { 
              box-shadow: none !important; 
              margin: 0 auto !important; 
              padding: 0.5in 0.6in !important;
              width: 100% !important;
              min-height: auto !important;
            }
            .editor-content { width: 100%; }
            @media print {
              @page { margin: 0; size: A4; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body class="template-${selectedTemplate}">
          <div class="resume-page-container">
            ${photoHtml}
            <div class="editor-content">
              ${editedHtml}
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 1000);
            };
            window.onafterprint = () => {
              window.close();
              // Delete user image as per requirement
              // "we'll take users image when user successfully downloaded the resume we'll delete"
              // Ideally communicate back to parent window to clear state, but simple way is strictly client side.
              // Note: This script runs in the POPUP. It cannot affect the main window React state directly.
              // We'll clear the state in the main window AFTER trackDownload success or just rely on session.
              // But requirements say "we'll delete".
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    addToast('Logged out successfully', 'success');
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    addToast(`Welcome back, ${userData.name}!`, 'success');
  };

  const handleApplyImprovement = async (instruction: string) => {
    setState('IMPROVING');
    try {
      const newHtml = await improveResumeContent(editedHtml, instruction, jobDescription);
      setEditedHtml(newHtml);
      addToast('AI Optimization Applied!', 'success');
    } catch (err) {
      addToast('Optimization failed.', 'error');
    } finally {
      setState('EDITING');
    }
  };

  const handleUpgrade = async (transactionId: string) => {
    try {
      const res = await upgradeToPremium(transactionId);
      setUser((prev: any) => ({ ...prev, isPremium: true }));
      setShowPremiumModal(false);
      addToast(res.message, 'success');
    } catch (err) {
      addToast('Verification failed. Invalid ID.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="h-20 bg-white border-b border-slate-200 sticky top-0 z-[100] flex items-center px-8 justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setState('IDLE')}>
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">A</div>
          <span className="font-black text-lg tracking-tighter uppercase italic text-slate-900">ATS Architect</span>
        </div>
        
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
               {user.email === 'dhruv@gmail.com' && (
                 <button 
                  onClick={() => setShowAdminDashboard(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                 >
                   Admin Panel
                 </button>
               )}
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <div className="flex items-center justify-end gap-1">
                    {user.isPremium && <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Premium</span>}
                    <p className="text-[10px] font-medium text-slate-400">{user.email}</p>
                  </div>
               </div>
               <button 
                onClick={handleLogout}
                className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest"
               >
                 Logout
               </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="text-[10px] font-black uppercase text-slate-900 bg-slate-100 hover:bg-slate-200 px-5 py-2 rounded-full transition-all tracking-widest"
            >
              Sign In
            </button>
          )}

          {state === 'EDITING' && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setState('IDLE')}
              className="px-5 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 border border-slate-100 rounded-full transition-all tracking-widest"
            >
              New Upload
            </button>
            <button 
              onClick={handleExportPDF}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              Print to PDF
            </button>
          </div>
        )}
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full p-8 flex flex-col">
        {state === 'IDLE' && (
          <div className="flex flex-col gap-12 py-6 animate-in">
            <div className="max-w-4xl">
              <h1 className="text-[5rem] font-black text-slate-900 tracking-tighter leading-[0.85] mb-8">
                Your Career, <br /><span className="text-slate-300">Perfectly Re-Architected.</span>
              </h1>
              <p className="text-2xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                Upload your old resume image or PDF. We'll extract your history and let you switch between premium templates in one click.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">1. Target Job Description (Optional)</h3>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste requirements here..."
                    className="w-full h-32 p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-200 outline-none text-slate-600 font-medium resize-none transition-all text-sm"
                  />
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm max-h-[500px] overflow-y-auto" style={{scrollbarWidth: 'none'}}>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 sticky top-0 bg-white py-2">2. Select Starting Template</h3>
                  <div className="grid gap-3">
                    {TEMPLATES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${selectedTemplate === t.id ? 'border-slate-900 bg-white shadow-xl translate-x-2' : 'border-slate-50 bg-white/50 hover:border-slate-200'}`}
                      >
                        <div className={`w-1 h-8 rounded-full ${t.preview}`} />
                        <div>
                          <div className="font-black text-[10px] text-slate-900 uppercase tracking-tight">{t.name}</div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{t.description}</p>
                          
                          {/* Deloitte Photo Upload in IDLE */}
                          {t.id === 'deloitte' && selectedTemplate === 'deloitte' && (
                             <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  ref={profileImageInputRef}
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleProfileImageChange} 
                                />
                                <div className="flex gap-2 items-center">
                                  <button
                                      onClick={() => profileImageInputRef.current?.click()}
                                      className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-200 transition-colors"
                                  >
                                      {profileImage ? 'Change Photo' : 'Upload Photo'}
                                  </button>
                                  {profileImage && (
                                     <span className="text-[9px] font-bold text-green-600">✓ Added</span>
                                  )}
                                </div>
                             </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                  <div className="flex bg-slate-50/50 p-3 gap-2">
                    <button onClick={() => user ? setInputMode('file') : setShowAuthModal(true)} className={`flex-1 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all relative overflow-hidden ${inputMode === 'file' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>
                      {user && !user.isPremium && (
                        <div className="absolute top-2 right-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                           </svg>
                        </div>
                      )}
                      Upload Old Resume
                    </button>
                    <button onClick={() => user ? setInputMode('text') : setShowAuthModal(true)} className={`flex-1 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${inputMode === 'text' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>Paste Text Instead</button>
                  </div>

                  <div className="p-12">
                    {inputMode === 'file' ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-4 border-dashed border-slate-100 rounded-[2.5rem] py-24 bg-slate-50/30 hover:bg-white hover:border-slate-300 transition-all cursor-pointer text-center group"
                      >
                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 group-hover:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <p className="text-slate-900 font-black text-2xl tracking-tighter uppercase">Drop Old Resume Here</p>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">PDF, Image, or Photo accepted</p>
                        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <textarea 
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          placeholder="Paste all content..."
                          className="w-full h-64 p-8 bg-slate-50 border-none rounded-[2rem] focus:ring-4 focus:ring-slate-100 outline-none text-slate-700 font-medium resize-none transition-all text-lg"
                        />
                        <button 
                          onClick={handleTextSubmit}
                          className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all active:scale-95"
                        >
                          Convert to Digital Format
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(state === 'PROCESSING' || state === 'IMPROVING') && (
          <div className="flex-grow flex flex-col items-center justify-center py-20 animate-in">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border-[14px] border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-[14px] border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-5xl font-black mt-16 mb-4 tracking-tighter uppercase italic">Architecting...</h2>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.5em]">AI is analyzing and formatting your history</p>
          </div>
        )}

        {state === 'EDITING' && resumeData && (
          <div className="flex flex-col lg:flex-row gap-12 animate-in">
            {/* Control Sidebar */}
            <div className="lg:w-1/3 space-y-6 lg:sticky lg:top-28 self-start max-h-[calc(100vh-140px)] overflow-y-auto" style={{scrollbarWidth: 'none'}}>
              
              <button 
                onClick={handleSmartReorder}
                className="w-full bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all group flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-1">AI Power Tool</div>
                  <div className="font-black text-xl tracking-tight">Smart Reorder</div>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </button>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Switch Active Template</h3>
                <div className="space-y-3">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setSelectedTemplate(t.id)} 
                      className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${selectedTemplate === t.id ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
                    >
                      <div>
                        <div className="font-black text-xs uppercase text-slate-900 tracking-tight">{t.name}</div>
                        <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{t.id === 'sourabh' ? 'High Precision' : 'Modern'}</div>
                      </div>
                      {selectedTemplate === t.id && <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse"></div>}
                    </button>
                  ))}
                </div>
              </div>

              {selectedTemplate === 'deloitte' && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-green-100 shadow-sm">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-4">Deloitte Template Actions</h3>
                   <input 
                      ref={profileImageInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleProfileImageChange} 
                   />
                   <div className="flex gap-2">
                     <button
                        onClick={() => profileImageInputRef.current?.click()}
                        className="flex-1 bg-green-50 text-green-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-100 transition-colors"
                     >
                        {profileImage ? 'Change Photo' : 'Upload Photo'}
                     </button>
                     {profileImage && (
                        <button 
                          onClick={() => setProfileImage(null)}
                          className="px-4 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100"
                        >
                           ✕
                        </button>
                     )}
                   </div>
                   {!profileImage && <p className="text-[9px] text-slate-400 mt-2 font-medium">Photo required for this layout.</p>}
                </div>
              )}


              {feedback && (
                <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl space-y-12">
                  <div className="flex justify-between items-end">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">ATS Readiness</h3>
                    <div className="text-7xl font-black italic">{feedback.score}<span className="text-xl not-italic text-slate-700 ml-1">%</span></div>
                  </div>
                  
                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Instant AI Improvements</h4>
                    <div className="space-y-4">
                      {feedback.improvements.map((imp, i) => {
                        const isLocked = !user?.isPremium && i >= 2;
                        return (
                        <button 
                          key={i} 
                          onClick={() => isLocked ? setShowPremiumModal(true) : handleApplyImprovement(imp)}
                          disabled={isLocked && false} // Just for style, we handle click
                          className={`w-full group bg-slate-800/40 p-6 rounded-[1.5rem] border border-slate-800 hover:border-white/20 transition-all text-left flex gap-5 items-center relative overflow-hidden ${isLocked ? 'cursor-pointer' : ''}`}
                        >
                          <div className={`shrink-0 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center transition-all ${!isLocked && 'group-hover:bg-white group-hover:text-slate-900'}`}>
                            {isLocked ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707zM16.243 16.243a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414z" /></svg>
                            )}
                          </div>
                          
                          <div className={isLocked ? "blur-sm select-none opacity-50 transition-all group-hover:blur-0 group-hover:opacity-100" : ""}>
                             <p className="text-[12px] font-bold text-slate-300 leading-snug uppercase tracking-tight">{imp}</p>
                          </div>

                          {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] opacity-100 group-hover:opacity-0 transition-opacity">
                               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-400/30 px-3 py-1 rounded-full bg-indigo-900/40">Premium</span>
                            </div>
                          )}
                        </button>
                      );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Resume Editor View */}
            <div className="lg:w-2/3 flex flex-col items-center">
               <div className={`template-${selectedTemplate} w-full ${isBlurred ? 'security-blur' : ''}`}>
                 <div className="resume-page-container">
                    {selectedTemplate === 'deloitte' && profileImage && (
                      <div className="deloitte-photo-container">
                          <img src={profileImage} alt="Profile" />
                      </div>
                    )}
                    <RichEditor content={editedHtml} onChange={setEditedHtml} />
                 </div>
               </div>
               
               <div className="mt-16 text-[11px] font-black uppercase tracking-[0.6em] text-slate-300 select-none animate-pulse">
                 Editor Active | Custom Formatting Enabled
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Toasts */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-[2000] pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto px-12 py-6 rounded-[2rem] font-black text-[11px] tracking-[0.2em] uppercase shadow-2xl border animate-in slide-in-from-right transition-all ${t.type === 'success' ? 'bg-slate-900 text-white border-slate-800' : t.type === 'error' ? 'bg-red-600 text-white border-red-500' : 'bg-white text-slate-900 border-slate-200'}`}>
            {t.text}
          </div>
        ))}
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />

      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handleUpgrade}
      />

      {showAdminDashboard && (
        <AdminDashboard 
          currentUser={user} 
          onClose={() => setShowAdminDashboard(false)} 
        />
      )}
    </div>
  );
};

export default App;
