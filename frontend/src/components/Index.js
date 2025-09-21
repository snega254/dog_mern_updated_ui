import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Index = () => {
  const [welcomeText, setWelcomeText] = useState('');
  const fullText = 'Welcome to Dog World';

  // Typewriter effect for welcome message
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setWelcomeText((prev) => prev + fullText[index]);
      index++;
      if (index === fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="index-container">
      <header>
        <h1 className="welcome-text">Welcome to Dog World</h1>
      </header>
      <p className="prompt-text">Choose your path:</p>
      <div className="login-options">
        <Link to="/login_user" className="btn interactive-btn">User Login</Link>
        <Link to="/login_seller" className="btn interactive-btn">Seller Login</Link>
      </div>
    </div>
  );
};

export default Index;
