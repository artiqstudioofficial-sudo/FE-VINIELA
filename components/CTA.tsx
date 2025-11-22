
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../contexts/i18n';
import useOnScreen from '../hooks/useOnScreen';

interface CTAProps {
    title?: string;
    buttonText?: string;
    imageUrl?: string;
    imageAlt?: string;
}

const CTA: React.FC<CTAProps> = ({ title, buttonText, imageUrl, imageAlt }) => {
    const { t } = useTranslations();
    const [ref, isVisible] = useOnScreen({ threshold: 0.3, triggerOnce: true });

    const finalTitle = title || t.home.ctaTitle;
    const finalButtonText = buttonText || t.home.ctaButton;
    const finalImageUrl = imageUrl || 'https://picsum.photos/seed/meeting/800/600';
    const finalImageAlt = imageAlt || finalTitle;

    return (
        <section ref={ref} className="py-20 bg-viniela-silver overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="bg-viniela-dark rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row items-center">
                    {/* Text Content */}
                    <div className="p-10 md:p-16 md:w-3/5 text-center md:text-left">
                        <h2
                            className={`text-3xl md:text-4xl font-bold text-white leading-snug transition-all duration-700 ease-out ${
                                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                            }`}
                        >
                            {finalTitle}
                        </h2>
                        <Link
                            to="/contact"
                            className={`mt-8 inline-block px-8 py-3 bg-viniela-gold text-white font-semibold rounded-lg shadow-md hover:bg-viniela-gold-dark transition-all duration-700 ease-out transform hover:scale-105 ${
                                isVisible ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-5'
                            }`}
                        >
                            {finalButtonText}
                        </Link>
                    </div>
                    {/* Image */}
                    <div className="md:w-2/5 h-64 md:h-auto self-stretch overflow-hidden">
                        <img
                            src={finalImageUrl}
                            alt={finalImageAlt}
                            className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${
                                isVisible ? 'scale-100' : 'scale-110'
                            }`}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
