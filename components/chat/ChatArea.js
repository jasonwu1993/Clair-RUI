// ChatArea component - extracted from original index-original-backup.js
import React from 'react';
import { Bot, User, Loader2, Send } from '../ui/MockIcons.js';
import { renderTextWithLinks } from '../../utils/fileUtils.js';
import TypingIndicator from './TypingIndicator.js';

const ChatArea = ({ messages, isSending, inputQuery, onInputChange, onSendMessage, chatEndRef, selectedDocsCount, onFeedback }) => (
    <main className="flex-1 flex flex-col bg-white">
        <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'ai' && (
                            <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden shadow-md">
                                <img 
                                    src="/Images/Clair_headshot11.png" 
                                    alt="Clair" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback to icon if image fails to load
                                        e.target.style.display = 'none';
                                        e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"><span class="text-white text-sm font-bold">C</span></div>';
                                    }}
                                />
                            </div>
                        )}
                        <div className={`max-w-lg p-4 rounded-xl ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : msg.isError 
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-slate-100 text-slate-800'
                        }`}>
                            <div className="whitespace-pre-wrap">
                                {renderTextWithLinks(msg.content)}
                            </div>
                            {msg.metadata && (
                                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
                                    <div className="flex items-center justify-between">
                                        <span>Documents: {msg.metadata.documentsUsed}</span>
                                    </div>
                                    {msg.metadata.status && msg.metadata.status !== 'success' && (
                                        <div className="mt-1">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                msg.metadata.status === 'timeout' ? 'bg-orange-100 text-orange-800' :
                                                msg.metadata.status === 'error' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {msg.metadata.status}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {msg.role === 'ai' && !msg.isError && !msg.feedbackGiven && !msg.isGreeting && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Was this helpful?</span>
                                    <button 
                                        onClick={() => onFeedback(index, 'helpful')}
                                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                    >
                                        👍 Yes
                                    </button>
                                    <button 
                                        onClick={() => onFeedback(index, 'not_helpful')}
                                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                    >
                                        👎 No
                                    </button>
                                </div>
                            )}
                            {msg.feedbackGiven && (
                                <div className="mt-2 text-xs text-slate-500">
                                    Thank you for your feedback! ({msg.feedbackGiven})
                                </div>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                                <User className="text-slate-600" />
                            </div>
                        )}
                    </div>
                ))}
                {isSending && (
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden shadow-md">
                            <img 
                                src="/Images/Clair_headshot11.png" 
                                alt="Clair" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to icon if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"><span class="text-white text-sm font-bold">C</span></div>';
                                }}
                            />
                        </div>
                        <div className="max-w-lg p-4 rounded-xl bg-slate-100 text-slate-800">
                            <TypingIndicator text="Clair is analyzing your question..." />
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
        </div>
        <div className="bg-white border-t border-slate-200 p-4">
            <div className="max-w-4xl mx-auto">
                {selectedDocsCount > 0 && (
                    <div className="mb-2 text-xs text-slate-500">
                        Searching in {selectedDocsCount} selected document{selectedDocsCount !== 1 ? 's' : ''}
                    </div>
                )}
                <div className="relative">
                    <textarea 
                        value={inputQuery} 
                        onChange={onInputChange} 
                        onKeyDown={(e) => { 
                            if (e.key === 'Enter' && !e.shiftKey) { 
                                e.preventDefault(); 
                                onSendMessage(); 
                            } 
                        }} 
                        placeholder="Ask Clair about life insurance, financial planning, coverage analysis..."
                        className="w-full min-h-[48px] max-h-32 p-3 pr-12 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={1}
                        disabled={isSending}
                    />
                    <button 
                        onClick={onSendMessage} 
                        disabled={isSending || !inputQuery.trim()} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-2 rounded-full hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    </main>
);

export default ChatArea;