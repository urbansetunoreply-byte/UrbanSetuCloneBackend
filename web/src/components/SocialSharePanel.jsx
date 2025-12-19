import React, { useState, useEffect } from 'react';
import {
  FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp,
  FaTelegram, FaCopy, FaCheck, FaTimes, FaShareAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const SocialSharePanel = ({ isOpen, onClose, url, title = "Join UrbanSetu!", description = "Discover the future of real estate with UrbanSetu." }) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied! Ready to share. 💎');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy link');
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp />,
      color: 'bg-[#25D366]',
      hover: 'hover:bg-[#128C7E]',
      link: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
    },
    {
      name: 'Twitter',
      icon: <FaTwitter />,
      color: 'bg-[#1DA1F2]',
      hover: 'hover:bg-[#0c85d0]',
      link: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: 'LinkedIn',
      icon: <FaLinkedin />,
      color: 'bg-[#0077B5]',
      hover: 'hover:bg-[#005582]',
      link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      name: 'Telegram',
      icon: <FaTelegram />,
      color: 'bg-[#0088cc]',
      hover: 'hover:bg-[#006699]',
      link: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: 'Facebook',
      icon: <FaFacebook />,
      color: 'bg-[#1877F2]',
      hover: 'hover:bg-[#0d65d9]',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    }
  ];

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden transition-all duration-500 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <FaTimes size={16} />
          </button>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-inner">
              <FaShareAlt size={28} className="text-white drop-shadow-md" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">{title}</h3>
            <p className="text-indigo-100 text-sm mt-1 font-medium">{description}</p>
          </div>
        </div>

        <div className="p-8">
          {/* Link Copy Section */}
          <div className="mb-8">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">
              {url.includes('ref=') ? 'Your Referral Link' : 'Direct Link'}
            </label>
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5">
              <div className="flex-1 px-4 py-2 overflow-hidden">
                <p className="text-sm font-bold text-slate-700 truncate line-clamp-1">{url}</p>
              </div>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${copied
                  ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                  }`}
              >
                {copied ? <FaCheck /> : <FaCopy />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social Grid */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Share with friends</label>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => window.open(opt.link, '_blank')}
                  className={`flex items-center gap-3 p-4 ${opt.color} ${opt.hover} text-white rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group`}
                >
                  <div className="text-xl group-hover:scale-110 transition-transform">{opt.icon}</div>
                  <span className="font-bold text-sm tracking-tight">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {url.includes('ref=') && (
            <div className="mt-8 text-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <p className="text-xs text-indigo-700 font-bold">You earn <span className="text-indigo-900 font-black">100 coins</span> per successful referral. New users get <span className="text-indigo-900 font-black">50 coins</span>! 🚀</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialSharePanel;
