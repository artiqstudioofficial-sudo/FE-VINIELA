import { ContactMessage } from '../types';

const CONTACT_MESSAGES_STORAGE_KEY = 'vinielaContactMessages';

export const getContactMessages = (): ContactMessage[] => {
    try {
        const messagesJson = localStorage.getItem(CONTACT_MESSAGES_STORAGE_KEY);
        const messages = messagesJson ? JSON.parse(messagesJson) : [];
        // Sort by date descending (newest first)
        return messages.sort((a: ContactMessage, b: ContactMessage) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error('Failed to parse contact messages from localStorage', error);
        return [];
    }
};

export const saveContactMessages = (messages: ContactMessage[]) => {
    try {
        localStorage.setItem(CONTACT_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error('Failed to save contact messages to localStorage', error);
    }
};

export const saveContactMessage = (messageData: Omit<ContactMessage, 'id' | 'date'>): ContactMessage => {
    const messages = getContactMessages();
    const newMessage: ContactMessage = {
        ...messageData,
        id: new Date().getTime().toString(),
        date: new Date().toISOString(),
    };
    // Add the new message to the beginning of the array
    const updatedMessages = [newMessage, ...messages];
    saveContactMessages(updatedMessages);
    return newMessage;
};

export const deleteContactMessage = (messageId: string) => {
    const messages = getContactMessages();
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    saveContactMessages(updatedMessages);
};