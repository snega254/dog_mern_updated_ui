import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Adoption = () => {
  const [dogs, setDogs] = useState([]);
  const [search, setSearch] = useState('');
  const [breedFilter, setBreedFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDogs = async () => {
      const token = localStorage.getItem('token');
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/dogs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDogs(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dogs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchDogs();
  }, []);

  // Get unique breeds for the dropdown
  const breeds = ['All', ...new Set(dogs.map(d => d.breed))];

  // Filter dogs by text search and dropdown breed
  const filteredDogs = dogs.filter(dog => {
    const matchesSearch = dog.breed?.toLowerCase().includes(search.toLowerCase());
    const matchesBreed = breedFilter === 'All' || dog.breed === breedFilter;
    return matchesSearch && matchesBreed;
  });

  const handleViewDetails = (dogId) => {
    navigate(`/dog-details/${dogId}`);
  };

  if (loading) return (
    <div className="adoption-container">
      <div className="loading-spinner"></div>
      <p>Loading our furry friends...</p>
    </div>
  );
  
  if (error) return (
    <div className="adoption-container">
      <div className="error-message">{error}</div>
    </div>
  );

  return (
    <div className="adoption-container">
      <header className="adoption-header">
        <h1>Find Your Perfect Companion</h1>
        <p>Browse our adorable dogs waiting for their forever homes</p>
      </header>

      {/* Filters Section */}
      <section className="filters-section">
        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by breed..."
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <svg className="filter-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
          </svg>
          <select
            value={breedFilter}
            onChange={(e) => setBreedFilter(e.target.value)}
            className="filter-select"
          >
            {breeds.map((b, i) => (
              <option key={i} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Results Count */}
      <div className="results-count">
        {filteredDogs.length} {filteredDogs.length === 1 ? 'dog' : 'dogs'} found
      </div>

      {/* Dog List */}
      <section className="dog-grid">
        {filteredDogs.length > 0 ? (
          filteredDogs.map(dog => (
            <div className="dog-card" key={dog._id}>
              <div className="dog-image-container">
                <img
                  src={dog.image ? dog.image : 'http://localhost:5000/uploads/placeholder-image.jpg'}
                  alt={dog.breed}
                  className="dog-image"
                  onError={(e) => { e.target.src = 'http://localhost:5000/uploads/placeholder-image.jpg'; }}
                />
                <div className="dog-overlay">
                  <button
                    onClick={() => handleViewDetails(dog._id)}
                    className="view-details-btn"
                  >
                    Meet {dog.dogId}
                  </button>
                </div>
              </div>
              
              <div className="dog-info">
                <h3 className="dog-name">{dog.dogId}</h3>
                <p className="dog-breed">{dog.breed}</p>
                
                <div className="dog-details">
                  <span className="dog-age">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    {dog.age} years
                  </span>
                  <span className="dog-gender">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d={dog.gender === 'Male' 
                        ? "M9.5 11c1.93 0 3.5-1.57 3.5-3.5S11.43 4 9.5 4 6 5.57 6 7.5 7.57 11 9.5 11zm0-5c.83 0 1.5.67 1.5 1.5S10.33 9 9.5 9 8 8.33 8 7.5 8.67 6 9.5 6zM4 18c.22-.72 3.31-2 6-2 0-.7.13-1.37.35-1.99C7.62 13.91 2 15.27 2 18v2h9.54c-.52-.58-.93-1.25-1.19-2H4zm16 0h-4.35c-.26.75-.67 1.42-1.19 2H22v-2c0-1.66-3.14-3-7-3-.71 0-1.39.08-2.03.22.14.38.23.79.29 1.21.47-.11.97-.17 1.5-.19.36-.82 1.29-1.43 2.4-1.43 1.51 0 2.74 1.13 2.74 2.52V18z" 
                        : "M12 4c1.93 0 3.5-1.57 3.5-3.5S13.93-3 12-3 8.5-1.57 8.5.5 10.07 4 12 4zm0-2c.83 0 1.5.67 1.5 1.5S12.83 5 12 5s-1.5-.67-1.5-1.5S11.17 2 12 2zm0 7c-1.93 0-3.5 1.57-3.5 3.5S10.07 16 12 16s3.5-1.57 3.5-3.5S13.93 9 12 9zm0-2c.83 0 1.5.67 1.5 1.5S12.83 10 12 10s-1.5-.67-1.5-1.5S11.17 8 12 8zm8 8h-4.35c-.26.75-.67 1.42-1.19 2H22v-2c0-1.66-3.14-3-7-3-.71 0-1.39.08-2.03.22.14.38.23.79.29 1.21.47-.11.97-.17 1.5-.19.36-.82 1.29-1.43 2.4-1.43 1.51 0 2.74 1.13 2.74 2.52V16z"}/>
                    </svg>
                    {dog.gender}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="#ccc" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <h3>No dogs found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </section>

      <style jsx>{`
        .adoption-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
        }
        
        .adoption-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .adoption-header h1 {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .adoption-header p {
          font-size: 1.1rem;
          color: #7f8c8d;
          margin: 0;
        }
        
        .filters-section {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .search-container, .filter-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .search-icon, .filter-icon {
          position: absolute;
          left: 12px;
          color: #95a5a6;
          z-index: 1;
        }
        
        .search-input, .filter-select {
          padding: 12px 15px 12px 40px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          width: 250px;
          background-color: #fff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        
        .search-input:focus, .filter-select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
        }
        
        .results-count {
          text-align: center;
          margin-bottom: 25px;
          color: #7f8c8d;
          font-style: italic;
        }
        
        .dog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }
        
        .dog-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .dog-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        
        .dog-image-container {
          position: relative;
          height: 220px;
          overflow: hidden;
        }
        
        .dog-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .dog-card:hover .dog-image {
          transform: scale(1.05);
        }
        
        .dog-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .dog-card:hover .dog-overlay {
          opacity: 1;
        }
        
        .view-details-btn {
          background: #ff6f61;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .view-details-btn:hover {
          background: #e85c50;
        }
        
        .dog-info {
          padding: 20px;
        }
        
        .dog-name {
          font-size: 1.3rem;
          margin: 0 0 5px 0;
          color: #2c3e50;
        }
        
        .dog-breed {
          color: #7f8c8d;
          margin: 0 0 15px 0;
          font-size: 0.95rem;
        }
        
        .dog-details {
          display: flex;
          justify-content: space-between;
        }
        
        .dog-age, .dog-gender {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.9rem;
          color: #34495e;
        }
        
        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px 0;
          color: #95a5a6;
        }
        
        .no-results h3 {
          margin: 15px 0 10px 0;
          font-size: 1.5rem;
        }
        
        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        .error-message {
          background: #ffecec;
          color: #e74c3c;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .filters-section {
            flex-direction: column;
            align-items: center;
          }
          
          .search-input, .filter-select {
            width: 100%;
          }
          
          .dog-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default Adoption;