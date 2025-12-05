import React, { useState, useCallback } from 'react';
import { X, Link, Globe, Users, User, Shield, Copy, Loader2 } from 'lucide-react';
import { useDocument } from '../hooks/useDocument';

interface ShareModalProps {
  docId: string;
  ownerId: string;
  currentUserId: string;
  currentRoles: Record<string, 'viewer' | 'editor' | 'owner'>;
  currentPublicAccess: 'none' | 'viewer' | 'editor';
  onClose: () => void;
}

// Dummy function to simulate looking up a user's UID by their email.
// In a real application, this would query a 'users' collection or a Cloud Function.
const lookupUserByEmail = async (email: string): Promise<{ id: string; name: string } | null> => {
  console.log(`Searching for user with email: ${email}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, you would have a users collection to lookup the UID.
  // For demonstration, we'll return a mock UID.
  if (email === 'test@example.com') {
    return { id: 'mock-test-user-id', name: 'Test User' };
  }
  return null;
};


const ShareModal: React.FC<ShareModalProps> = ({
  docId,
  ownerId,
  currentUserId,
  currentRoles,
  currentPublicAccess,
  onClose,
}) => {
  const { updateSharingSettings } = useDocument();
  const [publicAccess, setPublicAccess] = useState(currentPublicAccess);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const isOwner = currentUserId === ownerId;

  const handlePublicAccessChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPublicAccess = e.target.value as 'none' | 'viewer' | 'editor';
    setPublicAccess(newPublicAccess);
    await updateSharingSettings(docId, { publicAccess: newPublicAccess });
  };
  
  const handleInviteUser = async () => {
    if (!inviteEmail) return;
    setIsUpdating(true);
    setError('');

    const user = await lookupUserByEmail(inviteEmail);
    if (!user) {
      setError('User not found.');
      setIsUpdating(false);
      return;
    }
    
    const newRoles = { ...currentRoles, [user.id]: inviteRole };
    await updateSharingSettings(docId, { roles: newRoles });
    
    setInviteEmail('');
    setIsUpdating(false);
  };
  
  const handleRoleChange = async (userId: string, newRole: 'viewer' | 'editor' | 'owner') => {
    const newRoles = { ...currentRoles, [userId]: newRole };
    await updateSharingSettings(docId, { roles: newRoles });
  };
  
  const handleRemoveUser = async (userId: string) => {
    const newRoles = { ...currentRoles };
    delete newRoles[userId];
    await updateSharingSettings(docId, { roles: newRoles });
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Share Document</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex space-x-3">
            <input 
              type="text" 
              readOnly 
              value={window.location.href}
              className="flex-grow bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none"
            />
            <button 
              onClick={handleCopyLink}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-500 flex items-center space-x-2"
            >
              <Copy size={16} />
              <span>{copied ? 'Copied!' : 'Copy link'}</span>
            </button>
          </div>
          
          {isOwner && (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                  <Globe size={16} />
                  <span>Public Access</span>
                </label>
                <select 
                  value={publicAccess} 
                  onChange={handlePublicAccessChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">Restricted</option>
                  <option value="viewer">Anyone with the link can view</option>
                  <option value="editor">Anyone with the link can edit</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                  <Users size={16} />
                  <span>Invite People</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-grow bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
                    className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={handleInviteUser}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-500 disabled:bg-slate-600"
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
                  </button>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
            </>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
              <User size={16} />
              <span>People with Access</span>
            </h3>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(currentRoles).map(([userId, role]) => (
                <li key={userId} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md">
                  <span className="text-sm text-gray-200">{userId === ownerId ? 'Owner' : userId}</span>
                  {isOwner && userId !== ownerId ? (
                    <div className="flex items-center space-x-2">
                       <select 
                         value={role} 
                         onChange={(e) => handleRoleChange(userId, e.target.value as 'viewer' | 'editor')}
                         className="bg-slate-600 border-none rounded-md py-1 px-2 text-sm text-white"
                       >
                         <option value="viewer">Viewer</option>
                         <option value="editor">Editor</option>
                       </select>
                       <button onClick={() => handleRemoveUser(userId)} className="text-gray-400 hover:text-red-400">
                         <X size={16} />
                       </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 capitalize">{role}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
