import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SellDog.css';

const SellDog = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    breed: '',
    age: '',
    gender: '',
    dogType: 'Home Dog',
    healthStatus: 'Healthy',
    vaccinated: 'Yes',
    size: '',
    color: '',
    behavior: 'Friendly',
    description: '',
    price: '',
    city: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dogId, setDogId] = useState('');
  const [errors, setErrors] = useState({});

  const breeds = [
    'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog',
    'Bulldog', 'Beagle', 'Poodle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer',
    'Dachshund', 'Siberian Husky', 'Great Dane', 'Doberman Pinscher', 'Australian Shepherd',
    'Cavalier King Charles Spaniel', 'Shih Tzu', 'Boston Terrier', 'Pembroke Welsh Corgi',
    'Pomeranian', 'Havanese', 'Shetland Sheepdog', 'Brittany', 'English Springer Spaniel',
    'Maltese', 'Basset Hound', 'Weimaraner', 'Collie', 'Vizsla', 'Chihuahua', 'Street Dog', 'Other'
  ];

  const ages = [
    '1 month', '2 months', '3 months', '4 months', '5 months', '6 months',
    '7 months', '8 months', '9 months', '10 months', '11 months',
    '1 year', '2 years', '3 years', '4 years', '5 years', '6 years', '7 years', '8+ years'
  ];

  const cities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
    'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara'
  ];

  useEffect(() => {
    generateDogId();
  }, [formData.breed, formData.city, formData.size, formData.gender]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const generateDogId = () => {
    if (formData.breed && formData.city) {
      const breedCode = formData.breed.split(' ')[0].substring(0, 3).toUpperCase();
      const now = new Date();
      const year = now.getFullYear().toString().substring(2);
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      setDogId(`DOG-${breedCode}-${year}${month}-${sequence}`);
    } else {
      setDogId('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.breed) newErrors.breed = 'Breed is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.size) newErrors.size = 'Size is required';
    if (!formData.color) newErrors.color = 'Color is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!image) newErrors.image = 'Dog image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size should be less than 5MB' }));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please upload an image file' }));
        return;
      }
      
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to list a dog');
        navigate('/login');
        return;
      }

      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      
      submitData.append('image', image);

      const response = await axios.post('http://localhost:5000/api/dogs/sell', submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      if (response.data.success) {
        alert(`Dog listed successfully! Dog ID: ${response.data.dogId}`);
        
        setFormData({
          breed: '',
          age: '',
          gender: '',
          dogType: 'Home Dog',
          healthStatus: 'Healthy',
          vaccinated: 'Yes',
          size: '',
          color: '',
          behavior: 'Friendly',
          description: '',
          price: '',
          city: ''
        });
        setImage(null);
        setImagePreview(null);
        setDogId('');
        setErrors({});
        
        setTimeout(() => navigate('/dashboard_seller'), 2000);
      }
      
    } catch (error) {
      console.error('Error listing dog:', error);
      let errorMessage = 'Failed to list dog. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-dog-container">
      <div className="sell-dog-header">
        <h1>🏠 List a Dog for Adoption</h1>
        <p>Help find a loving home for a furry friend</p>
      </div>

      <form onSubmit={handleSubmit} className="sell-dog-form">
        {/* Dog ID Preview */}
        <div className="dog-id-section">
          <label>Dog ID Preview</label>
          <div className="dog-id-display">
            {dogId ? (
              <span className="dog-id-preview">{dogId}</span>
            ) : (
              <span className="dog-id-placeholder">
                Fill in breed and city to see ID preview
              </span>
            )}
          </div>
          <p className="dog-id-note">
            Note: Final unique ID will be generated automatically when you submit the form
          </p>
        </div>

        <div className="form-grid">
          {/* Basic Information */}
          <div className="form-section">
            <h3>🐕 Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Breed *</label>
                <select
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  className={errors.breed ? 'error' : ''}
                  required
                >
                  <option value="">Select Breed</option>
                  {breeds.map(breed => (
                    <option key={breed} value={breed}>{breed}</option>
                  ))}
                </select>
                {errors.breed && <span className="error-message">{errors.breed}</span>}
              </div>

              <div className="form-group">
                <label>Age *</label>
                <select
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className={errors.age ? 'error' : ''}
                  required
                >
                  <option value="">Select Age</option>
                  {ages.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
                {errors.age && <span className="error-message">{errors.age}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={errors.gender ? 'error' : ''}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <span className="error-message">{errors.gender}</span>}
              </div>

              <div className="form-group">
                <label>Dog Type *</label>
                <select
                  name="dogType"
                  value={formData.dogType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Home Dog">Home Dog</option>
                  <option value="Street Dog">Street Dog</option>
                </select>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div className="form-section">
            <h3>🏥 Health Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Health Status *</label>
                <select
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Needs Care">Needs Care</option>
                  <option value="Sick">Sick</option>
                  <option value="Under Treatment">Under Treatment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Vaccinated *</label>
                <select
                  name="vaccinated"
                  value={formData.vaccinated}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Partially">Partially</option>
                </select>
              </div>
            </div>
          </div>

          {/* Physical Characteristics */}
          <div className="form-section">
            <h3>📏 Physical Characteristics</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Size *</label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className={errors.size ? 'error' : ''}
                  required
                >
                  <option value="">Select Size</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="Extra Large">Extra Large</option>
                </select>
                {errors.size && <span className="error-message">{errors.size}</span>}
              </div>

              <div className="form-group">
                <label>Color *</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Brown, Black, White, Golden"
                  className={errors.color ? 'error' : ''}
                  required
                />
                {errors.color && <span className="error-message">{errors.color}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Behavior/Temperament *</label>
              <select
                name="behavior"
                value={formData.behavior}
                onChange={handleInputChange}
                required
              >
                <option value="Friendly">Friendly</option>
                <option value="Playful">Playful</option>
                <option value="Calm">Calm</option>
                <option value="Energetic">Energetic</option>
                <option value="Protective">Protective</option>
                <option value="Shy">Shy</option>
                <option value="Independent">Independent</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Location & Additional Info */}
          <div className="form-section">
            <h3>📍 Location & Additional Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={errors.city ? 'error' : ''}
                  required
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>

              <div className="form-group">
                <label>Adoption Fee (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0 for free adoption"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell potential adopters about the dog's personality, habits, special needs, etc."
                rows="4"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-section">
            <h3>📷 Dog Photo</h3>
            
            <div className="image-upload-section">
              <div className="image-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="dog-image"
                  required
                />
                <label htmlFor="dog-image" className="image-upload-label">
                  {image ? 'Change Image' : 'Upload Dog Photo'}
                </label>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Dog preview" />
                    <span>{image.name}</span>
                  </div>
                )}
              </div>
              {errors.image && <span className="error-message">{errors.image}</span>}
              <p className="upload-hint">Upload a clear photo of the dog (Max 5MB)</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/dashboard_seller')}
            className="cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Listing Dog...
              </>
            ) : (
              'List Dog for Adoption'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellDog;