// Chat and API operations hook - extracted from original index-original-backup.js
import { useCallback, useEffect } from 'react';
import apiClient from '../services/apiClient.js';

export const useChat = (state) => {
    const { 
        messages,
        setMessages,
        setIsSending,
        selectedDocs,
        addProgressLog
    } = state;

    // Load Clair's greeting message when chat initializes
    useEffect(() => {
        const loadGreeting = async () => {
            try {
                // Only show greeting if no messages exist yet
                if (messages.length === 0) {
                    const greetingResponse = await apiClient.getGreeting();
                    const greetingMessage = {
                        role: 'ai',
                        content: greetingResponse.greeting,
                        isGreeting: true,
                        metadata: {
                            timestamp: greetingResponse.timestamp,
                            model: 'Clair System',
                            status: 'greeting'
                        }
                    };
                    setMessages([greetingMessage]);
                }
            } catch (error) {
                console.warn('Could not load greeting:', error);
                // Fallback to default greeting if API fails
                if (messages.length === 0) {
                    const fallbackGreeting = {
                        role: 'ai',
                        content: "Hello! I'm Clair, your AI assistant. I can help with a wide range of topics including financial planning, document analysis, general questions, and more. How may I assist you today?",
                        isGreeting: true,
                        metadata: {
                            timestamp: new Date().toISOString(),
                            model: 'Clair System',
                            status: 'greeting'
                        }
                    };
                    setMessages([fallbackGreeting]);
                }
            }
        };

        loadGreeting();
    }, []); // Only run once on mount

    // Enhanced message sending with progress tracking
    const sendMessage = useCallback(async (query) => {
        if (!query.trim()) return;
        
        setIsSending(true);
        
        // Add user message immediately
        const userMessage = { role: 'user', content: query.trim() };
        setMessages(prev => [...prev, userMessage]);
        
        try {
            addProgressLog('INFO', 'Processing question...', `Query: "${query.trim().substring(0, 100)}${query.trim().length > 100 ? '...' : ''}"`);
            console.log('🤖 Sending question:', query.trim());
            
            const startTime = Date.now();
            const response = await apiClient.askQuestion(query.trim(), selectedDocs);
            const responseTime = Date.now() - startTime;
            
            addProgressLog('SUCCESS', `Question processed in ${responseTime}ms`, 
                `Documents used: ${selectedDocs.length}, Model: ${(response && response.model) || 'gpt-4o'}`);
            
            let aiResponse;
            if (response && response.answer) {
                aiResponse = response.answer;
            } else if (response && typeof response === 'string') {
                aiResponse = response;
            } else {
                aiResponse = "I received your question but got an unexpected response format. Please try again.";
            }
            
            console.log('🤖 AI Response received:', aiResponse);
            
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: aiResponse,
                metadata: {
                    timestamp: new Date().toISOString(),
                    documentsUsed: selectedDocs.length,
                    model: (response && response.model) || 'gpt-4o',
                    status: (response && response.status) || 'success',
                    contextUsed: (response && response.context_used) || false,
                    documentsSearched: (response && response.documents_searched) || 0
                }
            }]);
            
        } catch (error) {
            let errorMessage = "I'm having trouble connecting. Please try again.";
            
            if (error.message.includes('timed out')) {
                errorMessage = "The request timed out. Please try a simpler question or check your connection.";
                addProgressLog('WARN', 'Question processing timed out', error.message);
            } else if (error.message.includes('HTTP 503')) {
                errorMessage = "I'm experiencing technical difficulties. Please try again in a moment.";
                addProgressLog('ERROR', 'Service temporarily unavailable', 'HTTP 503 error');
            } else if (error.message.includes('HTTP 408')) {
                errorMessage = "Request timeout. Please try again with a shorter question.";
                addProgressLog('WARN', 'Request timeout', 'HTTP 408 error');
            } else if (error.message.includes('HTTP 500')) {
                errorMessage = "Server error. The development team has been notified. Please try again later.";
                addProgressLog('ERROR', 'Internal server error', 'HTTP 500 error');
            } else {
                addProgressLog('ERROR', 'Question processing failed', error.message);
            }
            
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: errorMessage,
                isError: true 
            }]);
            console.error('Enhanced message error:', error);
        } finally {
            setIsSending(false);
        }
    }, [setIsSending, setMessages, selectedDocs, addProgressLog]);

    // Enhanced feedback handling
    const handleFeedback = useCallback(async (messageIndex, feedbackType) => {
        const message = messages[messageIndex];
        if (!message || message.role !== 'ai') return;

        const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
        if (!userMessage || userMessage.role !== 'user') return;

        try {
            await apiClient.submitFeedback({
                query: userMessage.content,
                response: message.content,
                feedback_type: feedbackType,
                documents_used: (message.metadata && message.metadata.documentsUsed) || 0,
                model: (message.metadata && message.metadata.model) || 'gpt-4o',
                context_used: (message.metadata && message.metadata.contextUsed) || false
            });

            addProgressLog('INFO', `Feedback submitted: ${feedbackType}`, 'User feedback recorded');

            setMessages(prev => prev.map((msg, idx) => 
                idx === messageIndex 
                    ? { ...msg, feedbackGiven: feedbackType }
                    : msg
            ));
        } catch (error) {
            addProgressLog('WARN', 'Failed to send feedback', error.message);
            console.error('Failed to send feedback:', error);
        }
    }, [messages, setMessages, addProgressLog]);

    return {
        sendMessage,
        handleFeedback
    };
};