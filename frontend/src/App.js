import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import LoginUser from './components/LoginUser';
import RegisterUser from './components/RegisterUser';
import LoginSeller from './components/LoginSeller';
import RegisterSeller from './components/RegisterSeller';
import UserDashboard from './components/UserDashboard';
import SellerDashboard from './components/SellerDashboard';
import Adoption from './components/Adoption';
import DogDetails from './components/DogDetails';
import Accessories from './components/Accessories';
import DogChat from './components/DogChat';
import SellDog from './components/SellDog';
import ManageDogOrders from './components/ManageDogOrders';
import DoctorBooking from './components/DoctorBooking';
import DogPosts from './components/DogPosts';
import HealthRecords from './components/HealthRecords';
import Index from './components/Index';
// IMPORT THE NEW SELLER COMPONENTS
import SellerProducts from './components/SellerProducts';
import SellerOrders from './components/SellerOrders';
import './App.css';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setUserType(getUserTypeFromToken());
      
      // Initialize socket connection
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      // Join user room for real-time updates
      const userData = JSON.parse(atob(token.split('.')[1]));
      newSocket.emit(userData.userType === 'user' ? 'join-user' : 'join-seller', userData.id);
    }
    setLoading(false);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Dog World...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login_user" element={<LoginUser />} />
          <Route path="/register_user" element={<RegisterUser />} />
          <Route path="/login_seller" element={<LoginSeller />} />
          <Route path="/register_seller" element={<RegisterSeller />} />

          {/* Protected User Routes */}
          <Route
            path="/dashboard_user"
            element={
              isAuthenticated && userType === 'user' ? (
                <UserDashboard />
              ) : (
                <Navigate to="/login_user" />
              )
            }
          />
          <Route
            path="/adoption"
            element={
              isAuthenticated && userType === 'user' ? (
                <Adoption />
              ) : (
                <Navigate to="/login_user" />
              )
            }
          />
          <Route
            path="/accessories"
            element={
              isAuthenticated && userType === 'user' ? (
                <Accessories />
              ) : (
                <Navigate to="/login_user" />
              )
            }
          />
          <Route
            path="/dogchat"
            element={
              isAuthenticated && userType === 'user' ? (
                <DogChat />
              ) : (
                <Navigate to="/login_user" />
              )
            }
          />
          <Route
            path="/doctor-booking"
            element={
              isAuthenticated && userType === 'user' ? (
                <DoctorBooking />
              ) : (
                <Navigate to="/login_user" />
              )
            }
          />
          <Route
            path="/dog-posts"
            element={
              isAuthenticated && userType === 'user' ? (
                <DogPosts />
              ) : (
                <Navigate to="/login_user" />
              )
            }
          />
          <Route
            path="/health-records"
            element={
              isAuthenticated && userType === 'user' ? (
                <HealthRecords />
              ) : (
                <Navigate to="/login_user" />
              )
            }
          />
          <Route
            path="/dog-details/:dogId"
            element={
              isAuthenticated && userType === 'user' ? (
                <DogDetails />
              ) : (
                <Navigate to="/login_user" />
              )
            }
          />

          {/* Protected Seller Routes */}
          <Route
            path="/dashboard_seller"
            element={
              isAuthenticated && userType === 'seller' ? (
                <SellerDashboard />
              ) : (
                <Navigate to="/login_seller" />
              )
            }
          />
          <Route
            path="/sell_dog"
            element={
              isAuthenticated && userType === 'seller' ? (
                <SellDog />
              ) : (
                <Navigate to="/login_seller" />
              )
            }
          />
          <Route
            path="/manage_dog_orders"
            element={
              isAuthenticated && userType === 'seller' ? (
                <ManageDogOrders />
              ) : (
                <Navigate to="/login_seller" />
              )
            }
          />
          
          {/* NEW SELLER PRODUCT MANAGEMENT ROUTES */}
          <Route
            path="/seller/products"
            element={
              isAuthenticated && userType === 'seller' ? (
                <SellerProducts />
              ) : (
                <Navigate to="/login_seller" />
              )
            }
          />
          <Route
            path="/seller/orders"
            element={
              isAuthenticated && userType === 'seller' ? (
                <SellerOrders />
              ) : (
                <Navigate to="/login_seller" />
              )
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;