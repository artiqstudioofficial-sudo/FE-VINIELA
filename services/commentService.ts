import { Comment } from '../types';

export const COMMENTS_STORAGE_KEY = 'vinielaComments';

// Helper to get all comments from storage
const getAllComments = (): Comment[] => {
    try {
        const commentsJson = localStorage.getItem(COMMENTS_STORAGE_KEY);
        return commentsJson ? JSON.parse(commentsJson) : [];
    } catch (error) {
        console.error('Failed to parse comments from localStorage', error);
        return [];
    }
};

// Helper to save all comments to storage
const saveAllComments = (comments: Comment[]) => {
    try {
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
    } catch (error) {
        console.error('Failed to save comments to localStorage', error);
    }
};

// Get comments for a specific article
export const getComments = (articleId: string): Comment[] => {
    const allComments = getAllComments();
    return allComments
        .filter(comment => comment.articleId === articleId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Add a new comment for an article
export const addComment = (commentData: Omit<Comment, 'id' | 'date' | 'avatar'>): Comment => {
    const allComments = getAllComments();
    const newComment: Comment = {
        ...commentData,
        id: new Date().getTime().toString(),
        date: new Date().toISOString(),
        avatar: `https://i.pravatar.cc/150?u=${commentData.author.replace(/\s/g, '')}${new Date().getTime()}`
    };
    const updatedComments = [newComment, ...allComments];
    saveAllComments(updatedComments);
    return newComment;
};
