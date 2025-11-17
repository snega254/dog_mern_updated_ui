import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './DogChat.css';

const DogChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const messagesEndRef = useRef(null);

  // API Key
  const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyAGxKpu5XzTDOvIxJQQHm7dCz9SKU78MgU';
  
  // Debug API key
  console.log('API Key:', API_KEY ? 'Loaded' : 'Missing');
  console.log('Key length:', API_KEY?.length);

  const genAI = new GoogleGenerativeAI(API_KEY);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your Dog Care Assistant. I can help you with dog adoption, training, health, nutrition, and behavior questions. What would you like to know?",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add this function for model fallback
  const tryAlternativeModel = async (userInput) => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `Brief dog advice: ${userInput}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const botMessage = {
        id: Date.now() + 2,
        text: text,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (retryError) {
      const finalErrorMessage = {
        id: Date.now() + 2,
        text: "Service configuration issue. Please contact support.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, finalErrorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !canSend || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setCanSend(false);

    try {
      // USE CORRECT MODEL NAME - try these:
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      // OR: const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });

      const prompt = `You are a friendly dog care expert. Provide brief, helpful advice about: "${inputMessage}" - keep response under 200 characters. Be practical and encouraging.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const botMessage = {
        id: Date.now() + 1,
        text: text,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error with Gemini API:', error);
      
      let errorText = "I'm having trouble connecting right now. ";
      
      if (error.message.includes('404') || error.message.includes('not found')) {
        errorText += "Model configuration issue. Trying alternative...";
        // Try alternative model
        await tryAlternativeModel(inputMessage);
        return;
      } else {
        errorText += "Please try again later.";
      }

      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setCanSend(true), 3000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && canSend) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="dog-chat-app">
      {/* Navigation Bar */}
      <nav className="chat-navbar">
        <div className="nav-brand">
          <span className="nav-icon">🐕</span>
          <h1>Dog Care Assistant</h1>
        </div>
        <div className="nav-status">
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>{canSend ? 'Online' : 'Waiting...'}</span>
          </div>
          <span>{messages.length} messages</span>
        </div>
      </nav>

      {/* Main Chat Container */}
      <div className="dog-chat-container">
        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
            >
              <div className="message-avatar">
                {message.sender === 'bot' ? '🐕' : '👤'}
              </div>
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot">
              <div className="message-avatar">🐕</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="chat-input-container">
          <div className="input-wrapper">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canSend ? "Ask about dog care..." : "Please wait..."}
              rows="1"
              className="chat-input"
              disabled={!canSend || isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !canSend || isLoading}
              className="send-button"
            >
              {isLoading ? '⏳' : !canSend ? '⌛' : '📤'}
            </button>
          </div>
          {!canSend && (
            <div style={{textAlign: 'center', fontSize: '0.8rem', color: '#6b7280', marginTop: '8px'}}>
              Rate limit: Please wait a moment...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DogChat;