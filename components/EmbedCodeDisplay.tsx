import React, { useState, useEffect } from 'react';
import { ClipboardIcon, CheckSquareIcon } from './icons';

interface EmbedCodeDisplayProps {
  onClose: () => void;
}

const EmbedCodeDisplay: React.FC<EmbedCodeDisplayProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const embedUrl = new URL(window.location.href);
  embedUrl.searchParams.set('embed', 'true');
  const iframeCode = `<iframe src="${embedUrl.toString()}" width="100%" height="800" frameborder="0" allowfullscreen></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle clicks outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const modal = document.getElementById('embed-modal');
        if (modal && !modal.contains(event.target as Node)) {
            onClose();
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-fast">
      <div id="embed-modal" className="bg-gray-800 border border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-2xl font-bold mb-4 text-white">Embed Certification</h3>
        <p className="text-gray-400 mb-6">
          Copy and paste the code below into your website's HTML to embed this interactive certification program.
        </p>
        <div className="relative">
          <textarea
            readOnly
            value={iframeCode}
            className="w-full h-32 p-4 font-mono text-sm bg-gray-900 text-gray-300 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center bg-gray-700 text-white font-semibold py-1 px-3 rounded-md hover:bg-gray-600 transition-colors"
          >
            {copied ? (
                <>
                    <CheckSquareIcon className="w-4 h-4 mr-2 text-green-400" />
                    Copied!
                </>
            ) : (
                <>
                    <ClipboardIcon className="w-4 h-4 mr-2" />
                    Copy
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbedCodeDisplay;