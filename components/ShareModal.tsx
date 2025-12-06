
import React, { useState, useEffect, useCallback } from 'react';
import { X, Link, Users, Lock, ChevronDown, Check, Globe, AlertCircle, Trash2 } from 'lucide-react';

interface ShareModalProps {
  projectTitle: string;
  projectId: string;
  ownerEmail?: string;
  ownerName?: string;
  ownerPhotoURL?: string;
  onClose: () => void;
  project: any; // The full project document
  onUpdate: (data: any) => void; // Function to save changes
}

interface UserRole {
  email: string;
  role: 'viewer' | 'editor';
}

const ShareModal: React.FC<ShareModalProps> = ({
  projectTitle,
  projectId,
  ownerEmail,
  ownerName,
  ownerPhotoURL,
  onClose,
  project,
  onUpdate,
}) => {
  const [accessLevel, setAccessLevel] = useState('restricted');
  const [people, setPeople] = useState<UserRole[]>([]);
  const [emailToAdd, setEmailToAdd] = useState('');
  const [roleToAdd, setRoleToAdd] = useState<'viewer' | 'editor'>('viewer');
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setAccessLevel(project.publicAccess || 'restricted');
      const roles = project.roles || {};
      // Map roles to people, but exclude the owner from this list
      const currentPeople = Object.entries(roles)
        .map(([email, role]) => ({
          email,
          role: role as 'viewer' | 'editor' | 'owner',
        }))
        .filter(p => p.role !== 'owner');
      setPeople(currentPeople);
    }
  }, [project]);

  const handleAddPerson = async () => {
    if (!emailToAdd || !/\S+@\S+\.\S+/.test(emailToAdd)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (emailToAdd === ownerEmail) {
      setError('You cannot change the owner\'s role.');
      return;
    }
    if (people.find(p => p.email === emailToAdd) || emailToAdd === ownerEmail) {
        setError('This person already has access.');
        return;
    }

    setError(null);
    const updatedRoles = { ...project.roles, [emailToAdd]: roleToAdd };
    onUpdate({ roles: updatedRoles });
    setEmailToAdd('');
  };

  const handleRemovePerson = async (emailToRemove: string) => {
    const { [emailToRemove]: _, ...updatedRoles } = project.roles;
    onUpdate({ roles: updatedRoles });
  };

  const handleRoleChange = async (emailToUpdate: string, newRole: 'viewer' | 'editor') => {
    const updatedRoles = { ...project.roles, [emailToUpdate]: newRole };
    onUpdate({ roles: updatedRoles });
  };


  const handlePublicAccessChange = async (newAccessLevel: 'restricted' | 'viewer' | 'editor') => {
    onUpdate({ publicAccess: newAccessLevel });
  };


  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/storyboard/${projectId}`;
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
          return { icon: Globe, text: 'Anyone with link can edit', description: 'Anyone on the internet with the link can edit' };
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

        <div className="p-6 space-y-4">
          <div className="flex space-x-2">
            <input
              type="email"
              value={emailToAdd}
              onChange={(e) => setEmailToAdd(e.target.value)}
              placeholder="Add people by email"
              className="flex-grow bg-slate-900 border border-slate-600 rounded-lg pl-4 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
            <select 
              value={roleToAdd}
              onChange={e => setRoleToAdd(e.target.value as 'viewer' | 'editor')} 
              className="bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
            </select>
            <button onClick={handleAddPerson} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-semibold">
              Add
            </button>
          </div>
          {error && 
            <div className='flex items-center text-red-400 text-sm'>
              <AlertCircle size={16} className="mr-2"/> 
              {error}
            </div>
          }
          
          <div className="space-y-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
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
            {people.map(person => (
              <div key={person.email} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
                    {person.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{person.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={person.role} 
                    onChange={e => handleRoleChange(person.email, e.target.value as 'viewer' | 'editor')}
                    className="bg-slate-700 border border-slate-600 rounded-lg py-1 px-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button onClick={() => handleRemovePerson(person.email)} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                      <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
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
                  onChange={(e) => handlePublicAccessChange(e.target.value as any)}
                  className="w-full appearance-none bg-transparent font-semibold text-white focus:outline-none cursor-pointer pr-8"
                >
                  <option value="restricted" className="bg-slate-800 text-white">Restricted</option>
                  <option value="viewer" className="bg-slate-800 text-white">Anyone with the link</option>
                  <option value="editor" className="bg-slate-800 text-white">Anyone with link can edit</option>
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
