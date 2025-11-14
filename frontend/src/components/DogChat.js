import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './DogChat.css';

const DogChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a friendly and knowledgeable dog care expert. Provide helpful, accurate, and compassionate advice about:

- Dog adoption process and considerations
- Dog training techniques and tips  
- Health and nutrition guidance
- Behavior issues and solutions
- Breed-specific information
- Puppy care and socialization
- Senior dog care
- Emergency first aid for dogs
- Grooming and hygiene
- Exercise and activity requirements

User Question: "${inputMessage}"

Please provide a detailed, helpful response. If the question is not related to dogs, politely explain that you specialize in dog-related topics.

Format your response in a clear, easy-to-read way with proper paragraphs. Be supportive and encouraging.`;

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
      
      let errorText = "I'm sorry, I'm having trouble connecting right now. ";
      
      if (error.message.includes('quota') || error.status === 429) {
        errorText += "API quota exceeded. Please check your Google AI Studio usage limits or try again later.";
      } else if (error.message.includes('API_KEY') || error.status === 400) {
        errorText += "There's an issue with the API configuration. Please check your API key.";
      } else if (error.message.includes('network')) {
        errorText += "Network connection issue. Please check your internet connection.";
      } else {
        errorText += "Please try again in a moment.";
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
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How to train a puppy?",
    "Best dog food for small breeds?",
    "How often should I walk my dog?",
    "Dog grooming tips",
    "Common health issues in dogs",
    "How to socialize a dog?"
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    // Auto-send after a short delay
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <div className="dog-chat-container">
      <div className="chat-header">
        <div className="header-content">
          <h1>🐕 Dog Care Assistant</h1>
          <p>Ask me anything about dogs, adoption, training, and health!</p>
        </div>
        <div className="chat-stats">
          <span>{messages.length} messages</span>
          <span style={{color: '#10b981'}}>✅ API Connected</span>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="quick-questions">
        <h3>Quick Questions:</h3>
        <div className="question-chips">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="question-chip"
              onClick={() => handleQuickQuestion(question)}
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

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
            placeholder="Ask about dog care, training, health, or adoption..."
            rows="1"
            className="chat-input"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default DogChat;