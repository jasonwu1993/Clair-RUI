import React, { useState, useEffect, useRef } from 'react';
import { File, List, Send, Loader2, HardDriveUpload, CheckCircle2, AlertCircle, X, Bot, User } from 'lucide-react';

// --- Main Application Component ---
export default function App() {
  // State for managing the entire application
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! Upload some documents and I'll answer questions based on their content." }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  // State for file management
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // State for documents available on the server
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isFetchingDocs, setIsFetchingDocs] = useState(true);

  // New state for API errors
  const [apiError, setApiError] = useState('');

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- API Configuration ---
  const API_BASE_URL = "https://rag-render.onrender.com";

  // --- Effects ---

  // Scroll to the bottom of the chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch the list of available documents from the server on load
  useEffect(() => {
    fetchAvailableDocs();
  }, []);


  // --- Core Functions ---

  const fetchAvailableDocs = async () => {
    setIsFetchingDocs(true);
    setApiError(''); // Clear previous errors
    try {
      const response = await fetch(`${API_BASE_URL}/list_files`);
      if (!response.ok) {
        // This will be caught by the catch block
        throw new Error(`Network response was not ok (${response.status})`);
      }
      const data = await response.json();
      setAvailableDocs(data.files || []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      // Set a user-friendly error message
      setApiError(`Failed to connect to the backend. This is likely a CORS issue or the server is down. Please ensure the server at ${API_BASE_URL} is running and allows requests from this origin.`);
    } finally {
      setIsFetchingDocs(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputQuery.trim() || isSending) return;

    const newQuery = inputQuery.trim();
    setMessages(prev => [...prev, { role: 'user', content: newQuery }]);
    setInputQuery('');
    setIsSending(true);
    setApiError(''); // Clear previous errors

    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: newQuery, filters: selectedDocs })
      });
       if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer || "Sorry, I couldn't get a response." }]);
    } catch (error) {
      console.error("Error asking question:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "An error occurred while trying to get an answer. Please check the server and console for details." }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async () => {
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setApiError(''); // Clear previous errors
    const initialProgress = filesToUpload.reduce((acc, file) => {
        acc[file.name] = { status: 'uploading', progress: 0 };
        return acc;
    }, {});
    setUploadProgress(initialProgress);

    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'success' } }));
        } else {
          const errorData = await response.json().catch(() => ({error: 'Upload failed with non-JSON response'}));
          throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'error', message: error.message } }));
        setApiError(`Failed to upload ${file.name}. Please check server logs.`);
      }
    }
    
    setIsUploading(false);
    setFilesToUpload([]); // Clear the upload list
    await fetchAvailableDocs(); // Refresh the list of documents
  };
  
  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files);
    setFilesToUpload(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newFiles = Array.from(e.dataTransfer.files);
    if (newFiles.length > 0) {
        setFilesToUpload(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFileToUpload = (fileName) => {
    setFilesToUpload(prev => prev.filter(f => f.name !== fileName));
  };

  const toggleDocSelection = (docName) => {
    setSelectedDocs(prev => 
        prev.includes(docName) 
        ? prev.filter(name => name !== docName)
        : [...prev, docName]
    );
  };


  // --- Sub-components ---

  const Sidebar = () => (
    <aside className="w-full lg:w-1/3 xl:w-1/4 bg-slate-50 border-r border-slate-200 p-6 flex flex-col space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">AI Assistant</h1>
      
      {/* File Upload Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-3">Upload Documents</h2>
        <div 
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-white hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
        >
            <HardDriveUpload className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">
                Drag & drop files here, or <span className="font-semibold text-blue-600">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Supports PDF, MD</p>
            <input 
                type="file" 
                ref={fileInputRef}
                multiple 
                accept=".pdf,.md"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>

        {filesToUpload.length > 0 && (
          <div className="mt-4 space-y-2">
            {filesToUpload.map(file => (
              <div key={file.name} className="flex items-center justify-between bg-slate-100 p-2 rounded-md text-sm">
                <span className="truncate text-slate-700">{file.name}</span>
                <button onClick={() => removeFileToUpload(file.name)} className="text-slate-500 hover:text-red-600">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={handleFileUpload}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {isUploading ? <Loader2 className="animate-spin" /> : 'Upload ' + filesToUpload.length + ' File(s)'}
            </button>
          </div>
        )}
        
        {Object.keys(uploadProgress).length > 0 && !isUploading && (
            <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold">Upload Status:</h3>
                {Object.entries(uploadProgress).map(([name, {status, message}]) => (
                    <div key={name} className={`flex items-center gap-2 text-sm p-2 rounded-md ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        <span className="truncate">{name} - {status}</span>
                        {message && <span className="text-xs">{message}</span>}
                    </div>
                ))}
                 <button onClick={() => setUploadProgress({})} className="text-xs text-slate-500 hover:underline mt-2">Clear status</button>
            </div>
        )}
      </div>

      {/* Document Selection Section */}
      <div className="flex-grow flex flex-col min-h-0">
        <h2 className="text-lg font-semibold text-slate-700 mb-3">Select Context</h2>
        
        {apiError && (
            <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm" role="alert">
                <p className="font-bold flex items-center gap-2"><AlertCircle size={16}/>Connection Error</p>
                <p className="mt-1">{apiError}</p>
            </div>
        )}

        <div className="flex-grow bg-white border border-slate-200 rounded-lg p-3 overflow-y-auto">
          {isFetchingDocs ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          ) : availableDocs.length > 0 ? (
            <ul className="space-y-2">
              {availableDocs.map(doc => (
                <li key={doc}>
                  <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedDocs.includes(doc) ? 'bg-blue-100 border-blue-300' : 'bg-slate-50 hover:bg-slate-100'}`}>
                    <input 
                      type="checkbox"
                      checked={selectedDocs.includes(doc)}
                      onChange={() => toggleDocSelection(doc)}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <File className="h-5 w-5 text-slate-600" />
                    <span className="flex-grow text-sm font-medium text-slate-800 truncate">{doc}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-sm text-slate-500 h-full flex items-center justify-center px-4">
              { !apiError && "No documents found. Upload some to get started." }
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  const ChatArea = () => (
    <main className="flex-1 flex flex-col bg-white">
      {/* Chat Messages */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'ai' && (
                <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <Bot className="text-slate-600" />
                </div>
              )}
              <div className={`max-w-lg p-4 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
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
               <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <Bot className="text-slate-600" />
                </div>
              <div className="max-w-lg p-4 rounded-xl bg-slate-100 text-slate-800">
                <Loader2 className="animate-spin" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
      
      {/* Chat Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a question based on the selected documents..."
              className="w-full h-12 p-3 pr-20 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !inputQuery.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              <Send />
            </button>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col lg:flex-row font-sans">
      <Sidebar />
      <ChatArea />
    </div>
  );
}
