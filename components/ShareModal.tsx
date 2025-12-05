
import React, { useState } from 'react';
import { X, Link, Users, Lock, ChevronDown, Check, Globe } from 'lucide-react';

interface ShareModalProps {
  projectTitle: string;
  projectId: string;
  ownerEmail?: string;
  ownerName?: string;
  ownerPhotoURL?: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  projectTitle,
  projectId,
  ownerEmail,
  ownerName,
  ownerPhotoURL,
  onClose,
}) => {
  const [accessLevel, setAccessLevel] = useState<'restricted' | 'viewer' | 'editor'>('restricted');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    // Note: The 'edit' flag is just a concept for now.
    // Real-time collaboration for anonymous users would require backend changes (e.g. security rules).
    const shareUrl = `${window.location.origin}/share/${projectId}${accessLevel === 'editor' ? '?edit=true' : ''}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const getAccessInfo = () => {
    switch(accessLevel) {
      case 'restricted':
        return { icon: Lock, text: 'Restricted', description: 'Only people with access can open with the link' };
      case 'viewer':
        return { icon: Globe, text: 'Anyone with the link', description: 'Anyone on the internet with the link can view' };
      case 'editor':
         return { icon: Globe, text: 'Anyone with the link', description: 'Anyone on the internet with the link can edit' };
      default:
        return { icon: Lock, text: 'Restricted', description: 'Only people with access can open with the link' };
    }
  };

  const AccessIcon = getAccessInfo().icon;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center font-sans" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg text-slate-100 border border-slate-700" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Share "{projectTitle}"</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Add people, groups, and calendar events"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>

          <div>
            <h3 className="text-slate-300 font-semibold mb-3">People with access</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {ownerPhotoURL ? (
                   <img src={ownerPhotoURL} alt={ownerName || 'Owner'} className="w-10 h-10 rounded-full"/>
                ) : (
                   <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                     {ownerName ? ownerName[0].toUpperCase() : 'U'}
                   </div>
                )}
                <div>
                  <p className="font-semibold">{ownerName} (you)</p>
                  <p className="text-xs text-slate-400">{ownerEmail}</p>
                </div>
              </div>
              <span className="text-sm text-slate-400">Owner</span>
            </div>
          </div>

          <div>
            <h3 className="text-slate-300 font-semibold mb-3">General access</h3>
            <div className="flex items-start gap-4">
              <div className="bg-slate-700/50 p-2.5 rounded-full mt-1">
                 <AccessIcon size={20} className="text-slate-300" />
              </div>
              <div className="flex-1 relative group">
                <select 
                  value={accessLevel} 
                  onChange={(e) => setAccessLevel(e.target.value as any)}
                  className="w-full appearance-none bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="restricted" className="bg-slate-800 text-white">Restricted</option>
                  <option value="viewer" className="bg-slate-800 text-white">Anyone with the link</option>
                   <option value="editor" className="bg-slate-800 text-white">Anyone with the link can edit</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">{getAccessInfo().description}</p>
                <ChevronDown size={16} className="absolute top-1 right-0 text-slate-400 pointer-events-none group-hover:text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-between items-center rounded-b-2xl">
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            {isCopied ? <Check size={16} className="text-emerald-400"/> : <Link size={16} />}
            {isCopied ? 'Link Copied!' : 'Copy link'}
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-semibold">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
