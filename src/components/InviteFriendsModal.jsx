// InviteFriendsModal.jsx
import React, { useState } from 'react';
import { X, EnvelopeSimple, WhatsappLogo, ShareNetwork, Copy, Check } from 'phosphor-react';

export default function InviteFriendsModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('share');
  
  if (!isOpen) return null;
  
  const appUrl = window.location.origin;
  const inviteLink = `${appUrl}?ref=${encodeURIComponent(localStorage.getItem('currentUser') || '')}`;
  const inviteMessage = `Join me on MetABook! It's a great app for book lovers to track reading, share recommendations, and connect with friends. Sign up here: ${inviteLink}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on MetABook!',
          text: inviteMessage,
          url: inviteLink
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      setActiveTab('copy');
    }
  };
  
  const handleEmailInvite = (e) => {
    e.preventDefault();
    if (!email) return;
    
    const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Join me on MetABook!')}&body=${encodeURIComponent(inviteMessage)}`;
    window.open(mailtoLink, '_blank');
    setEmail('');
  };
  
  const handleWhatsAppShare = () => {
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    if (!formattedPhone) return;
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(inviteMessage)}`;
    window.open(whatsappUrl, '_blank');
    setPhone('');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">Invite Friends to MetABook</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-4">
            <button
              onClick={() => setActiveTab('share')}
              className={`px-4 py-2 text-sm ${activeTab === 'share' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
            >
              Share
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 text-sm ${activeTab === 'email' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
            >
              Email
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-4 py-2 text-sm ${activeTab === 'whatsapp' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setActiveTab('copy')}
              className={`px-4 py-2 text-sm ${activeTab === 'copy' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
            >
              Copy Link
            </button>
          </div>
          
          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="text-center py-4">
              <ShareNetwork size={48} className="mx-auto text-purple-400 mb-3" />
              <p className="text-gray-300 mb-4">Share MetABook with your friends using your device's sharing options</p>
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
              >
                <ShareNetwork size={20} />
                Share with Friends
              </button>
            </div>
          )}
          
          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="py-4">
              <EnvelopeSimple size={48} className="mx-auto text-purple-400 mb-3" />
              <p className="text-gray-300 mb-4 text-center">Send an email invitation to your friend</p>
              <form onSubmit={handleEmailInvite}>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Friend's Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
                >
                  <EnvelopeSimple size={20} />
                  Send Email Invitation
                </button>
              </form>
            </div>
          )}
          
          {/* WhatsApp Tab */}
          {activeTab === 'whatsapp' && (
            <div className="py-4">
              <WhatsappLogo size={48} className="mx-auto text-green-500 mb-3" />
              <p className="text-gray-300 mb-4 text-center">Share via WhatsApp</p>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Friend's Phone Number (with country code)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white"
              >
                <WhatsappLogo size={20} />
                Share via WhatsApp
              </button>
            </div>
          )}
          
          {/* Copy Link Tab */}
          {activeTab === 'copy' && (
            <div className="py-4">
              <Copy size={48} className="mx-auto text-purple-400 mb-3" />
              <p className="text-gray-300 mb-4 text-center">Copy your invitation link and share it anywhere</p>
              <div className="flex mb-4">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 p-3 rounded-l-lg bg-gray-800 border border-gray-700 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-4 bg-purple-600 hover:bg-purple-700 rounded-r-lg transition-colors text-white"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              {copied && (
                <p className="text-green-400 text-sm text-center">Link copied to clipboard!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}