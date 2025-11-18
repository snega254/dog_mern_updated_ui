import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Adoption.css';

const Adoption = () => {
  const [dogs, setDogs] = useState([]);
  const [filteredDogs, setFilteredDogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    breed: 'all',
    age: 'all',
    gender: 'all',
    size: 'all',
    location: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Available filter options
  const breedOptions = ['all', 'Labrador Retriever', 'German Shepherd', 'Beagle', 'Pug', 'Bulldog', 'Street Dog'];
  const ageOptions = ['all', '1 month', '2 months', '3 months', '6 months', '1 year', '2 years', '3 years', '4 years', '5+ years'];
  const genderOptions = ['all', 'Male', 'Female'];
  const sizeOptions = ['all', 'Small', 'Medium', 'Large'];
  const locationOptions = ['all', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'];

  useEffect(() => {
    fetchDogs();
  }, []);

  useEffect(() => {
    filterDogs();
  }, [dogs, search, filters]);

  const fetchDogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/dogs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDogs(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dogs:', err);
      setError('Failed to fetch dogs. Please try again later.');
      setLoading(false);
    }
  };

  const filterDogs = () => {
    let filtered = dogs.filter(dog => {
      const matchesSearch = dog.breed?.toLowerCase().includes(search.toLowerCase()) ||
                          dog.dogId?.toLowerCase().includes(search.toLowerCase());
      
      const matchesBreed = filters.breed === 'all' || dog.breed === filters.breed;
      const matchesAge = filters.age === 'all' || dog.age === filters.age;
      const matchesGender = filters.gender === 'all' || dog.gender === filters.gender;
      const matchesSize = filters.size === 'all' || dog.size === filters.size;
      const matchesLocation = filters.location === 'all' || 
                            (dog.location?.city && dog.location.city.toLowerCase().includes(filters.location.toLowerCase()));

      return matchesSearch && matchesBreed && matchesAge && matchesGender && matchesSize && matchesLocation;
    });

    setFilteredDogs(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleViewDetails = (dogId) => {
    navigate(`/dog-details/${dogId}`);
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({
      breed: 'all',
      age: 'all',
      gender: 'all',
      size: 'all',
      location: 'all'
    });
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading our furry friends...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <div className="error-message">{error}</div>
      <button onClick={fetchDogs} className="retry-btn">Try Again</button>
    </div>
  );

  return (
    <div className="adoption-container">
      {/* Header Section */}
      <header className="adoption-header">
        <div className="header-content">
          <h1>Find Your Perfect Companion</h1>
          <p>Browse adorable dogs waiting for their forever homes.</p>
        </div>
      </header>

      {/* Search and Filters Section */}
      <section className="filters-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by breed or dog ID..."
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Breed</label>
            <select 
              value={filters.breed} 
              onChange={(e) => handleFilterChange('breed', e.target.value)}
              className="filter-select"
            >
              {breedOptions.map(breed => (
                <option key={breed} value={breed}>
                  {breed === 'all' ? 'All Breeds' : breed}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Age</label>
            <select 
              value={filters.age} 
              onChange={(e) => handleFilterChange('age', e.target.value)}
              className="filter-select"
            >
              {ageOptions.map(age => (
                <option key={age} value={age}>
                  {age === 'all' ? 'All Ages' : age}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Gender</label>
            <select 
              value={filters.gender} 
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              className="filter-select"
            >
              {genderOptions.map(gender => (
                <option key={gender} value={gender}>
                  {gender === 'all' ? 'All Genders' : gender}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Size</label>
            <select 
              value={filters.size} 
              onChange={(e) => handleFilterChange('size', e.target.value)}
              className="filter-select"
            >
              {sizeOptions.map(size => (
                <option key={size} value={size}>
                  {size === 'all' ? 'All Sizes' : size}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <select 
              value={filters.location} 
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="filter-select"
            >
              {locationOptions.map(location => (
                <option key={location} value={location}>
                  {location === 'all' ? 'All Locations' : location}
                </option>
              ))}
            </select>
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </section>

      {/* Results Count */}
      <div className="results-info">
        <h3>
          {filteredDogs.length} {filteredDogs.length === 1 ? 'dog' : 'dogs'} found
        </h3>
      </div>

      {/* Dogs Grid */}
      <section className="dogs-grid">
        {filteredDogs.length > 0 ? (
          filteredDogs.map(dog => (
            <div key={dog._id} className="dog-card">
              <div className="dog-image-container">
                <img
                  src={dog.image || 'http://localhost:5000/uploads/placeholder-dog.jpg'}
                  alt={dog.breed}
                  className="dog-image"
                  onError={(e) => {
                    e.target.src = 'http://localhost:5000/uploads/placeholder-dog.jpg';
                  }}
                />
                {dog.isAdopted && (
                  <div className="adopted-badge">Adopted</div>
                )}
              </div>
              
              <div className="dog-info">
                <h3 className="dog-name">{dog.breed}</h3>

                
                <div className="dog-details">
                  <div className="detail-item">
                    <span className="detail-icon">🎂</span>
                    <span>{dog.age}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">{dog.gender === 'Male' ? '♂' : '♀'}</span>
                    <span>{dog.gender}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📏</span>
                    <span>{dog.size}</span>
                  </div>
                </div>

                <div className="dog-location">
                  <span className="location-icon">📍</span>
                  <span>{dog.location?.city || 'Unknown Location'}</span>
                </div>

                {dog.description && (
                  <p className="dog-description">{dog.description}</p>
                )}

                <div className="dog-actions">
                  <button
                    onClick={() => handleViewDetails(dog._id)}
                    className="primary-btn"
                    disabled={dog.isAdopted}
                  >
                    {dog.isAdopted ? 'Already Adopted' : 'View Details'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <div className="no-results-icon">😔</div>
            <h3>No dogs found</h3>
            <p>Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Adoption;