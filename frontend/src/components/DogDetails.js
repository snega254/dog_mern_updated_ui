import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DogDetails.css';

const DogDetails = () => {
  const { dogId } = useParams();
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [adoptionMessage, setAdoptionMessage] = useState('');
  const [adopting, setAdopting] = useState(false);

  useEffect(() => {
    fetchDogDetails();
  }, [dogId]);

  const fetchDogDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/dogs/${dogId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDog(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dog details:', err);
      setError('Failed to load dog details. Please try again.');
      setLoading(false);
    }
  };

  const handleAdopt = async () => {
    if (!adoptionMessage.trim()) {
      alert('Please add a message for the seller');
      return;
    }

    setAdopting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/orders', 
        { 
          dogId: dog._id, 
          message: adoptionMessage 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Adoption request sent successfully! The seller will contact you soon.');
      setShowAdoptModal(false);
      navigate('/adoption');
    } catch (err) {
      console.error('Error sending adoption request:', err);
      alert(err.response?.data?.message || 'Failed to send adoption request. Please try again.');
    } finally {
      setAdopting(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading dog details...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <div className="error-message">{error}</div>
      <button onClick={() => navigate('/adoption')} className="back-btn">
        Back to Adoption
      </button>
    </div>
  );

  if (!dog) return (
    <div className="error-container">
      <div className="error-message">Dog not found</div>
      <button onClick={() => navigate('/adoption')} className="back-btn">
        Back to Adoption
      </button>
    </div>
  );

  return (
    <div className="dog-details-container">
      <button onClick={() => navigate('/adoption')} className="back-btn">
        ← Back to Dogs
      </button>

      <div className="dog-details-content">
        {/* Dog Images */}
        <div className="dog-images">
          <img
            src={dog.image || 'http://localhost:5000/uploads/placeholder-dog.jpg'}
            alt={dog.breed}
            className="main-dog-image"
            onError={(e) => {
              e.target.src = 'http://localhost:5000/uploads/placeholder-dog.jpg';
            }}
          />
          {dog.isAdopted && (
            <div className="adopted-overlay">
              <div className="adopted-text">Already Adopted</div>
            </div>
          )}
        </div>

        {/* Dog Information */}
        <div className="dog-info">
          <div className="dog-header">
            <h1>{dog.dogId}</h1>
            <div className="dog-breed">{dog.breed}</div>
            <div className="status-container">
              {dog.isAdopted && (
                <div className="status-badge adopted">Adopted</div>
              )}
              {!dog.isAdopted && dog.price > 0 && (
                <div className="price-tag">₹{dog.price}</div>
              )}
            </div>
          </div>

          <div className="dog-description">
            <p>{dog.description || 'A lovely dog looking for a forever home.'}</p>
          </div>

          {/* Key Details */}
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Age</span>
              <span className="detail-value">{dog.age}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Gender</span>
              <span className="detail-value">{dog.gender}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Size</span>
              <span className="detail-value">{dog.size}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Color</span>
              <span className="detail-value">{dog.color || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Type</span>
              <span className="detail-value">{dog.dogType || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Vaccinated</span>
              <span className="detail-value">{dog.vaccinated || 'Not specified'}</span>
            </div>
          </div>

          {/* Health & Behavior */}
          <div className="info-sections">
            <div className="info-section">
              <h3>Health Status</h3>
              <div className="health-status">
                <span className={`status-indicator ${dog.healthStatus?.toLowerCase() || 'healthy'}`}>
                  {dog.healthStatus || 'Healthy'}
                </span>
              </div>
            </div>

            <div className="info-section">
              <h3>Behavior</h3>
              <p>{dog.behavior || 'Friendly and well-behaved'}</p>
            </div>

            <div className="info-section">
              <h3>Location</h3>
              <div className="location-info">
                <span className="location-icon">📍</span>
                <span>{dog.location?.city || 'Unknown Location'}</span>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          {dog.seller && (
            <div className="seller-info">
              <h3>Seller Information</h3>
              <div className="seller-details">
                <div className="seller-name">{dog.seller.name}</div>
                <div className="seller-contact">
                  <span>📧 {dog.seller.email}</span>
                  {dog.seller.contact && <span>📞 {dog.seller.contact}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Adoption Button */}
          {!dog.isAdopted && (
            <div className="adoption-actions">
              <button
                onClick={() => setShowAdoptModal(true)}
                className="adopt-btn primary-btn"
              >
                🏠 Adopt
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Adoption Modal */}
      {showAdoptModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Adopt {dog.dogId}</h2>
            <p>Send a message to the seller about why you'd like to adopt this dog:</p>
            
            <textarea
              value={adoptionMessage}
              onChange={(e) => setAdoptionMessage(e.target.value)}
              placeholder="Tell the seller about your home, experience with dogs, and why you'd be a good fit..."
              rows="6"
              className="message-textarea"
            />

            <div className="modal-actions">
              <button
                onClick={() => setShowAdoptModal(false)}
                className="cancel-btn"
                disabled={adopting}
              >
                Cancel
              </button>
              <button
                onClick={handleAdopt}
                className="confirm-btn"
                disabled={adopting || !adoptionMessage.trim()}
              >
                {adopting ? 'Sending Request...' : 'Send Adoption Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DogDetails;