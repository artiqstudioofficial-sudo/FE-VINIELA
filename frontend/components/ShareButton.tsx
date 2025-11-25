import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from '../contexts/i18n';

interface ShareButtonProps {
    title: string;
    url: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ title, url }) => {
    const { t } = useTranslations();
    const [showOptions, setShowOptions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);


    const handleShare = async () => {
        if (navigator.share) {
            try {
                // To prevent "Invalid URL" errors with hash-based routing on some platforms,
                // we include the URL in the text body and omit the dedicated `url` field,
                // which was causing the issue. Most platforms will correctly hyperlink the URL in the text.
                await navigator.share({
                    title,
                    text: t.shareButton.shareText.replace('{title}', title).replace('{url}', url),
                });
            } catch (error) {
                // The share can still be cancelled by the user (AbortError), which we can ignore.
                if ((error as DOMException).name !== 'AbortError') {
                    console.error('Web Share API failed, falling back to manual options:', error);
                    // If even the text-based share fails, show the manual options as a last resort.
                    setShowOptions(true);
                }
            }
        } else {
            // Fallback for browsers that don't support the Web Share API at all.
            setShowOptions(prev => !prev);
        }
    };
    
    const shareOptions = [
        { name: t.shareButton.networks.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, icon: "fa-brands fa-facebook" },
        { name: t.shareButton.networks.twitter, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, icon: "fa-brands fa-twitter" },
        { name: t.shareButton.networks.linkedIn, href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, icon: "fa-brands fa-linkedin" },
        { name: t.shareButton.networks.whatsApp, href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`, icon: "fa-brands fa-whatsapp" },
        { name: t.shareButton.networks.email, href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this article: ${url}`)}`, icon: "fa-solid fa-envelope" },
    ];


    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-viniela-gold text-white font-semibold rounded-lg shadow-md hover:bg-viniela-gold-dark transition-all duration-300"
                aria-label="Share article"
            >
                <i className="fa-solid fa-share-nodes w-5 h-5" aria-hidden="true"></i>
                <span className="hidden sm:inline">{t.shareButton.share}</span>
            </button>
            {showOptions && (
                 <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl p-2 z-10 animate-fade-in-up-fast">
                    <p className="text-sm font-semibold text-viniela-dark px-2 pb-2 border-b mb-2">{t.shareButton.shareVia}</p>
                    <div className="space-y-1">
                        {shareOptions.map(option => (
                            <a 
                                key={option.name}
                                href={option.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShowOptions(false)}
                                className="w-full flex items-center text-left px-3 py-2 text-sm rounded-md transition-colors duration-200 text-viniela-gray hover:bg-viniela-silver"
                            >
                                <i className={`${option.icon} w-5 h-5 mr-3 fa-lg`} aria-hidden="true"></i>
                                {option.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fade-in-up-fast { 
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up-fast { animation: fade-in-up-fast 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ShareButton;