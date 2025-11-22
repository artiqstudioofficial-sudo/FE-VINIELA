
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useTranslations } from '../contexts/i18n';
import { divisions } from '../constants';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const WA_TAG = "[[WA_ACTION]]";
// Sanitized phone number for WA link
const WA_NUMBER = "6285693007099"; 

const ChatWidget: React.FC = () => {
    const { t, language } = useTranslations();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { 
            role: 'model', 
            text: language === 'id' 
                ? 'Halo! Saya Vivi, asisten virtual VINIELA. Ada yang bisa saya bantu mengenai layanan atau konsultasi proyek Anda?' 
                : 'Hello! I am Vivi, VINIELA\'s virtual assistant. How can I help you with our services or project consultation?' 
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Simple Markdown Parser for basic formatting
    const formatMessage = (text: string) => {
        let formatted = text.replace(WA_TAG, ''); // Remove the tag from visual text
        // Bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Lists
        formatted = formatted.replace(/^\* (.*$)/gm, '<li>$1</li>');
        formatted = formatted.replace(/^- (.*$)/gm, '<li>$1</li>');
        return formatted;
    };

    const getSystemInstruction = () => {
        const divisionList = divisions.map(d => {
            return `- ${d.slug.replace('viniela-', 'Viniela ').replace(/-/g, ' ')}`;
        }).join('\n');

        return `
        You are Vivi, a friendly, professional, and polite female virtual assistant exclusively for VINIELA Group.
        
        Company Overview:
        VINIELA Group is a dynamic holding company overseeing a diverse portfolio of businesses.
        
        Key Divisions:
        ${divisionList}
        
        Contact Info:
        Address: Ruko Puri Orchard RK/U/01/06, West Jakarta.
        Phone: +62 856-9300-7099
        Email: info@viniela.com
        
        Role & Strict Boundaries:
        - Your SOLE purpose is to assist with questions related to VINIELA Group, its divisions, services, location, and contact information.
        - If a user asks about ANYTHING unrelated to VINIELA Group (e.g., general knowledge, math, coding, news, personal advice, other companies, weather, politics, etc.), you MUST politely refuse to answer.
        - Example refusal (Indonesian): "Maaf, saya hanya dapat menjawab pertanyaan seputar layanan dan informasi mengenai VINIELA Group. Ada yang bisa saya bantu terkait VINIELA?"
        - Example refusal (English): "I apologize, I can only answer questions regarding VINIELA Group's services and information. Is there anything else I can help you with regarding VINIELA?"
        - Do NOT hallucinate or make up information about VINIELA not provided here.
        
        Instructions:
        - Answer questions about Viniela's services, divisions, and contact info.
        - Be concise and professional.
        - Use formatting (bullet points, bold text) to make answers easy to read.
        - Reply in the same language as the user (Indonesian, English, or Chinese).
        
        CRITICAL RULE FOR WHATSAPP/CONSULTATION:
        If the user asks for a consultation, asks to chat via WhatsApp, asks for a phone number to chat, or expresses interest in starting a project, you MUST:
        1. Provide a helpful text response encouraging them to connect.
        2. Append the exact tag "${WA_TAG}" at the very end of your response. 
        Do not output the link manually, just the tag. The system will render a button.
        `;
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: getSystemInstruction(),
                },
                history: history
            });

            const result = await chat.sendMessage({ message: userMessage });
            const responseText = result.text;

            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, { role: 'model', text: language === 'id' ? 'Maaf, Vivi sedang mengalami gangguan jaringan. Silakan coba lagi nanti.' : 'Sorry, Vivi is experiencing network issues. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Chat Window */}
            <div 
                className={`bg-white rounded-2xl shadow-2xl mb-4 w-[350px] flex flex-col transition-all duration-300 ease-in-out origin-bottom-right overflow-hidden border border-gray-200 ${
                    isOpen ? 'opacity-100 scale-100 h-[550px]' : 'opacity-0 scale-0 h-0'
                }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-viniela-dark to-[#2a2a2a] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img 
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" 
                                alt="Vivi Profile" 
                                className="w-11 h-11 rounded-full object-cover border-2 border-white/20 shadow-md"
                            />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-viniela-dark rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-base tracking-wide">Vivi</h3>
                            <p className="text-gray-300 text-xs">VINIELA Assistant</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                        <i className="fa-solid fa-xmark fa-lg"></i>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] space-y-4">
                    {messages.map((msg, idx) => {
                        const hasWaAction = msg.text.includes(WA_TAG);
                        
                        return (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                                    {msg.role === 'model' && (
                                        <img 
                                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" 
                                            alt="Vivi" 
                                            className="w-8 h-8 rounded-full object-cover mr-2 mt-1 border border-gray-200"
                                        />
                                    )}
                                    <div 
                                        className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                                            msg.role === 'user' 
                                                ? 'bg-viniela-gold text-white rounded-tr-sm' 
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                        }`}
                                    >
                                        <div 
                                            className="markdown-content"
                                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} 
                                        />
                                    </div>
                                </div>
                                
                                {/* Render WhatsApp Button if detected */}
                                {msg.role === 'model' && hasWaAction && (
                                    <div className="pl-10 mt-2 w-[85%]">
                                        <a 
                                            href={`https://wa.me/${WA_NUMBER}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-2.5 px-4 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 transform hover:scale-105"
                                        >
                                            <i className="fa-brands fa-whatsapp fa-lg"></i>
                                            Chat via WhatsApp
                                        </a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in-up">
                             <img 
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" 
                                alt="Vivi" 
                                className="w-8 h-8 rounded-full object-cover mr-2 mt-1 border border-gray-200"
                            />
                            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={language === 'id' ? "Tanya Vivi..." : "Ask Vivi..."} 
                        className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:border-viniela-gold focus:ring-1 focus:ring-viniela-gold transition-all placeholder-gray-400"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className="w-10 h-10 bg-viniela-gold text-white rounded-full flex items-center justify-center hover:bg-viniela-gold-dark transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105"
                    >
                        <i className="fa-solid fa-paper-plane text-sm translate-x-[-1px] translate-y-[1px]"></i>
                    </button>
                </form>
            </div>

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 hover:shadow-viniela-gold/30 border-2 border-white ${
                    isOpen ? 'bg-viniela-dark' : 'bg-viniela-gold'
                }`}
            >
                {isOpen ? (
                     <i className="fa-solid fa-chevron-down fa-xl text-white"></i>
                ) : (
                     <i className="fa-solid fa-comments fa-2x text-white"></i>
                )}
            </button>
            
            <style>{`
                .markdown-content strong { font-weight: 600; }
                .markdown-content li { display: list-item; list-style-type: disc; margin-left: 1.2rem; margin-top: 0.25rem; }
                .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ChatWidget;
