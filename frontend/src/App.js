import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginUser from './components/LoginUser';
import RegisterUser from './components/RegisterUser';
import LoginSeller from './components/LoginSeller';
import RegisterSeller from './components/RegisterSeller';
import UserDashboard from './components/UserDashboard';
import SellerDashboard from './components/SellerDashboard';
import Adoption from './components/Adoption';
import ManageDogOrders from './components/ManageDogOrders';
import SellDog from './components/SellDog';
import DogChat from './components/DogChat';
import Index from './components/Index'; // Import the new Index component
import DogDetails from './components/DogDetails';
import Accessories from './components/Accessories'; // Import the Accessories component

// Helper to safely decode JWT
function getUserTypeFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;

    // Normalize URL-safe Base64
    const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized));

    return payload.userType || null;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  const userType = isAuthenticated ? getUserTypeFromToken() : null;

  return (
    <Router>
      <Routes>
        {/* Public Index page */}
        <Route path="/" element={<Index />} />

        {/* Protected routes */}
        <Route
          path="/dashboard_user"
          element={
            isAuthenticated && userType === 'user'
              ? <UserDashboard />
              : <Navigate to="/login_user" />
          }
        />
        <Route
          path="/dashboard_seller"
          element={
            isAuthenticated && userType === 'seller'
              ? <SellerDashboard />
              : <Navigate to="/login_seller" />
          }
        />

        {/* Auth routes */}
        <Route path="/login_user" element={<LoginUser />} />
        <Route path="/register_user" element={<RegisterUser />} />
        <Route path="/login_seller" element={<LoginSeller />} />
        <Route path="/register_seller" element={<RegisterSeller />} />

        {/* Other routes */}
        <Route path="/adoption" element={<Adoption />} />
        <Route path="/manage_dog_orders" element={<ManageDogOrders />} />
        <Route path="/sell_dog" element={<SellDog />} />
        <Route path="/dogchat" element={<DogChat />} />
        <Route path="/dog-details/:dogId" element={<DogDetails />} />
        <Route path="/accessories" element={<Accessories />} /> {/* Add this line */}
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;