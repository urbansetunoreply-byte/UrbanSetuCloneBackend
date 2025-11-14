import React, { useState, useEffect } from 'react';
import { FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp, FaTelegram, FaCopy, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const SocialSharePanel = ({ isOpen, onClose, url, title = "Check out this property!", description = "Amazing property listing" }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Auto-copy link to clipboard when panel opens
      copyToClipboard();
    }
  }, [isOpen]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy link');
    }
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(telegramUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Share Property</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Copy Link Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-3">
              <p className="text-sm text-gray-600 mb-1">Property Link</p>
              <p className="text-xs text-gray-500 break-all">{url}</p>
            </div>
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                copied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {copied ? <FaCheck size={14} /> : <FaCopy size={14} />}
              <span className="text-sm font-medium">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Social Media Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Share on Social Media</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareToFacebook}
              className="flex items-center gap-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaFacebook size={20} />
              <span className="font-medium">Facebook</span>
            </button>

            <button
              onClick={shareToTwitter}
              className="flex items-center gap-3 p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            >
              <FaTwitter size={20} />
              <span className="font-medium">Twitter</span>
            </button>

            <button
              onClick={shareToLinkedIn}
              className="flex items-center gap-3 p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <FaLinkedin size={20} />
              <span className="font-medium">LinkedIn</span>
            </button>

            <button
              onClick={shareToWhatsApp}
              className="flex items-center gap-3 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaWhatsapp size={20} />
              <span className="font-medium">WhatsApp</span>
            </button>

            <button
              onClick={shareToTelegram}
              className="flex items-center gap-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors col-span-2"
            >
              <FaTelegram size={20} />
              <span className="font-medium">Telegram</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialSharePanel;