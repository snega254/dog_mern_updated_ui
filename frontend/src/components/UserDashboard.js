import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div>
      <header>
        <h1>User Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <div className="card-container">
        <div className="card" onClick={() => navigate('/adoption')}>
          <img src="/logo/l1.jpg" alt="Adoption" />
          <h3>Dog Adoption</h3>
        </div>

        <div className="card" onClick={() => navigate('/accessories')}>
         <img src="/logo/l2.jpg" alt="Accessories" />
         <h3>Accessories</h3>
        </div>

        <div className="card" onClick={() => alert('Go to Doctor Booking')}>
          <img src="/logo/l3.jpg" alt="Doctor" />
          <h3>Doctor Booking</h3>
        </div>

        <div className="card" onClick={() => navigate('/dogchat')}>
          <img src="/logo/l4.png" alt="Chat AI" />
          <h3>Chat with AI</h3>
        </div>

        <div className="card coming-soon">
          <img src="/logo/l5.jpg" alt="Posts" />
          <h3>Dog Posts (Coming Soon)</h3>
        </div>

        <div className="card coming-soon">
          <img src="/logo/l6.jpg" alt="Health" />
          <h3>Health Prediction (Coming Soon)</h3>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
