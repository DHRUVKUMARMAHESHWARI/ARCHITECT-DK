
import React, { useRef, useEffect, useState } from 'react';

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichEditor: React.FC<RichEditorProps> = ({ content, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastContent = useRef(content);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [editingElement, setEditingElement] = useState<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
      lastContent.current = content;
    }
  }, [content]);

  const notifyChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html !== lastContent.current) {
        lastContent.current = html;
        onChange(html);
      }
    }
  };

  const getSelectedLink = (): HTMLAnchorElement | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    let node: Node | null = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'A') return node as HTMLAnchorElement;
      node = node.parentNode;
    }
    
    const range = selection.getRangeAt(0);
    let common = range.commonAncestorContainer;
    if (common.nodeType === 3) common = common.parentNode!;
    while (common && common !== editorRef.current) {
      if (common.nodeName === 'A') return common as HTMLAnchorElement;
      common = common.parentNode as Node;
    }
    return null;
  };

  const openLinkModal = (existingLink?: HTMLAnchorElement) => {
    const selection = window.getSelection();
    if (!selection) return;

    // Auto-select word if nothing is selected and we're not clicking an existing link
    if (!existingLink && selection.isCollapsed) {
      try {
        (selection as any).modify('move', 'backward', 'word');
        (selection as any).modify('extend', 'forward', 'word');
      } catch (e) {
        console.warn('Word selection not supported');
      }
    }

    if (!existingLink && selection.isCollapsed) {
      alert("Please select some text to create a link.");
      return;
    }

    // Save the range so we can restore it after typing in the modal
    if (selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0).cloneRange());
    }

    if (existingLink) {
      setEditingElement(existingLink);
      setLinkUrl(existingLink.getAttribute('href') || '');
    } else {
      setEditingElement(null);
      setLinkUrl('');
    }
    setIsModalOpen(true);
  };

  const handleSaveLink = () => {
    if (!linkUrl.trim()) {
      handleRemoveLink();
      return;
    }

    // Restore selection focus
    const selection = window.getSelection();
    if (selection && savedRange) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }

    if (editingElement) {
      editingElement.setAttribute('href', linkUrl);
      editingElement.setAttribute('target', '_blank');
      editingElement.setAttribute('rel', 'noopener noreferrer');
    } else {
      document.execCommand('createLink', false, linkUrl);
      // Ensure target="_blank" on newly created links
      setTimeout(() => {
        const newLink = getSelectedLink();
        if (newLink) {
          newLink.setAttribute('target', '_blank');
          newLink.setAttribute('rel', 'noopener noreferrer');
          notifyChange();
        }
      }, 10);
    }

    setIsModalOpen(false);
    notifyChange();
    editorRef.current?.focus();
  };

  const handleRemoveLink = () => {
    if (editingElement) {
      const fragment = document.createDocumentFragment();
      while (editingElement.firstChild) fragment.appendChild(editingElement.firstChild);
      editingElement.parentNode?.replaceChild(fragment, editingElement);
    } else {
      document.execCommand('unlink');
    }
    setIsModalOpen(false);
    notifyChange();
    editorRef.current?.focus();
  };

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    if (command === 'createLink') {
      const link = getSelectedLink();
      openLinkModal(link || undefined);
    } else {
      document.execCommand(command, false, value);
      notifyChange();
    }
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && editorRef.current?.contains(link)) {
      e.preventDefault();
      e.stopPropagation();
      openLinkModal(link as HTMLAnchorElement);
    }
  };

  return (
    <div className="relative group">
      {/* Link Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-1 tracking-tight text-slate-900">Project Connection</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Attach a URL to this entry</p>
            
            <div className="space-y-4">
              <div className="relative">
                <input 
                  autoFocus
                  type="text" 
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLink();
                    if (e.key === 'Escape') setIsModalOpen(false);
                  }}
                  placeholder="https://github.com/my-project"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleSaveLink}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                >
                  Save Link
                </button>
                {editingElement && (
                  <button 
                    onClick={handleRemoveLink}
                    className="px-6 bg-red-50 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                  >
                    Remove
                  </button>
                )}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toolbar */}
      <div className="absolute -top-14 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 z-50">
        <div className="flex items-center gap-1 p-1.5 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-xl">
          <button 
            onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
            className="w-10 h-10 hover:bg-white/10 rounded-xl transition-colors text-white text-sm font-black active:scale-90"
            title="Bold"
          >
            B
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
            className="w-10 h-10 hover:bg-white/10 rounded-xl transition-colors text-white text-sm italic font-serif active:scale-90"
            title="Italic"
          >
            I
          </button>
          
          <div className="w-[1px] h-6 bg-slate-700/50 mx-1" />
          
          <button 
            onMouseDown={(e) => { e.preventDefault(); execCommand('createLink'); }}
            className="w-10 h-10 bg-indigo-600/20 hover:bg-indigo-600/40 rounded-xl transition-colors text-indigo-400 flex items-center justify-center border border-indigo-500/30 active:scale-90"
            title="Add or Edit Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          
          <div className="w-[1px] h-6 bg-slate-700/50 mx-1" />
          
          <button 
            onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'H1'); }}
            className="px-4 h-10 hover:bg-white/10 rounded-xl text-white text-[11px] font-black uppercase active:scale-90"
          >
            H1
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'H2'); }}
            className="px-4 h-10 hover:bg-white/10 rounded-xl text-white text-[11px] font-black uppercase active:scale-90"
          >
            H2
          </button>
          
          <div className="w-[1px] h-6 bg-slate-700/50 mx-1" />
          
          <button 
            onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
            className="w-10 h-10 hover:bg-white/10 rounded-xl text-white text-2xl leading-none active:scale-90"
            title="Bullet List"
          >
            •
          </button>
        </div>
      </div>

      {/* Editor Main Surface */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={notifyChange}
        onClick={handleEditorClick}
        onBlur={notifyChange}
        spellCheck={false}
        className="editor-content focus:outline-none min-h-[600px] w-full cursor-text selection:bg-indigo-100/50"
      />
      
      {/* Help Indicator */}
      <div className="mt-8 hidden md:flex items-center justify-center gap-4 opacity-30 select-none pointer-events-none">
        <div className="h-[1px] flex-grow bg-slate-300"></div>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap">
          Click any word to link a project
        </span>
        <div className="h-[1px] flex-grow bg-slate-300"></div>
      </div>
    </div>
  );
};

export default RichEditor;
