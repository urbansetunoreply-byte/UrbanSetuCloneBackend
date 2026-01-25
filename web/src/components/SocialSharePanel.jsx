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
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
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
      link: `https://wa.me/?text=${encodeURIComponent(`${title}\n${description}\n${url}`)}`
    },
    {
      name: 'Facebook',
      icon: <FaFacebook />,
      color: 'bg-[#1877F2]',
      hover: 'hover:bg-[#0d65d9]',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: 'Twitter',
      icon: <FaTwitter />,
      color: 'bg-[#000000]',
      hover: 'hover:bg-[#333333]',
      link: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title}\n${description}`)}`
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
      link: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title}\n${description}`)}`
    }
  ];

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-300 transform flex flex-col border border-gray-200 dark:border-gray-800 ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>

        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Share</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="p-4 overflow-hidden">
          {/* Social Icons Row - YouTube Style */}
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          <div className="flex items-center gap-6 overflow-x-auto pb-4 pt-2 mb-2 no-scrollbar justify-start sm:justify-center">
            {shareOptions.map((opt) => (
              <button
                key={opt.name}
                onClick={() => window.open(opt.link, '_blank')}
                className="flex flex-col items-center gap-2 group shrink-0"
              >
                <div className={`w-14 h-14 ${opt.color} rounded-full flex items-center justify-center text-white text-2xl transition-transform duration-200 transform group-hover:scale-110 shadow-md`}>
                  {opt.icon}
                </div>
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 truncate w-14 text-center">
                  {opt.name}
                </span>
              </button>
            ))}
          </div>

          {/* Link Copy Section - More compact */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-3">
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate select-all">{url}</p>
            </div>
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 shrink-0 ${copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
            >
              {copied ? (
                <span className="flex items-center gap-1.5"><FaCheck size={12} /> Copied</span>
              ) : (
                'Copy'
              )}
            </button>
          </div>

          {url.includes('ref=') && (
            <div className="mt-4 text-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                Earn <span className="font-bold">100 coins</span> per successful referral.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialSharePanel;
