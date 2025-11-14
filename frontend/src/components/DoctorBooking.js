import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DoctorBooking.css';

const DoctorBooking = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formData, setFormData] = useState({
    petName: '',
    petType: 'Dog',
    symptoms: ''
  });
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctors/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctors/my-appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctors/available-slots', {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: selectedDate }
      });
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !formData.petName) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const bookingData = {
        doctorName: selectedDoctor.name,
        specialization: selectedDoctor.specialization,
        petName: formData.petName,
        petType: formData.petType,
        symptoms: formData.symptoms,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot
      };

      await axios.post('http://localhost:5000/api/doctors/book', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Appointment booked successfully!');
      setShowBookingModal(false);
      resetForm();
      fetchAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/doctors/${appointmentId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Appointment cancelled successfully!');
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert(error.response?.data?.message || 'Failed to cancel appointment.');
    }
  };

  const resetForm = () => {
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedSlot('');
    setFormData({
      petName: '',
      petType: 'Dog',
      symptoms: ''
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { class: 'scheduled', label: 'Scheduled' },
      completed: { class: 'completed', label: 'Completed' },
      cancelled: { class: 'cancelled', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getNextAvailableDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Next day
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="doctor-booking-container">
      <header className="booking-header">
        <div className="header-content">
          <h1>🏥 Book Vet Appointment</h1>
          <p>Schedule appointments with expert veterinarians for your pet's health</p>
        </div>
        <button onClick={() => navigate('/dashboard_user')} className="back-btn">
          Back to Dashboard
        </button>
      </header>

      <div className="booking-content">
        {/* Available Doctors */}
        <section className="doctors-section">
          <h2>Available Veterinarians</h2>
          <div className="doctors-grid">
            {doctors.map(doctor => (
              <div key={doctor.id} className="doctor-card">
                <div className="doctor-header">
                  <h3>{doctor.name}</h3>
                  <div className="doctor-rating">
                    ⭐ {doctor.rating}
                  </div>
                </div>
                <div className="doctor-specialization">
                  {doctor.specialization}
                </div>
                <div className="doctor-experience">
                  Experience: {doctor.experience}
                </div>
                <div className="consultation-fee">
                  Consultation Fee: ₹500
                </div>
                <button
                  onClick={() => handleDoctorSelect(doctor)}
                  className="book-btn"
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* My Appointments */}
        <section className="appointments-section">
          <h2>My Appointments</h2>
          {appointments.length === 0 ? (
            <div className="no-appointments">
              <div className="no-appointments-icon">📅</div>
              <h3>No appointments scheduled</h3>
              <p>Book your first appointment with one of our expert veterinarians.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {appointments.map(appointment => (
                <div key={appointment._id} className="appointment-card">
                  <div className="appointment-header">
                    <h3>Dr. {appointment.doctorName}</h3>
                    {getStatusBadge(appointment.status)}
                  </div>
                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="label">Pet:</span>
                      <span className="value">{appointment.petName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Date:</span>
                      <span className="value">
                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Time:</span>
                      <span className="value">{appointment.appointmentTime}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Specialization:</span>
                      <span className="value">{appointment.specialization}</span>
                    </div>
                    {appointment.symptoms && (
                      <div className="detail-item">
                        <span className="label">Symptoms:</span>
                        <span className="value">{appointment.symptoms}</span>
                      </div>
                    )}
                  </div>
                  <div className="appointment-actions">
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => cancelAppointment(appointment._id)}
                        className="cancel-btn"
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="modal-overlay">
          <div className="modal-content booking-modal">
            <div className="modal-header">
              <h2>Book Appointment with Dr. {selectedDoctor.name}</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="close-modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="doctor-info">
                <h4>Specialization: {selectedDoctor.specialization}</h4>
                <p>Experience: {selectedDoctor.experience}</p>
                <p className="fee">Consultation Fee: ₹500</p>
              </div>

              <div className="booking-form">
                <div className="form-group">
                  <label>Pet Name *</label>
                  <input
                    type="text"
                    value={formData.petName}
                    onChange={(e) => setFormData({...formData, petName: e.target.value})}
                    placeholder="Enter your pet's name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Pet Type</label>
                  <select
                    value={formData.petType}
                    onChange={(e) => setFormData({...formData, petType: e.target.value})}
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Appointment Date *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getNextAvailableDate()}
                    required
                  />
                </div>

                {selectedDate && (
                  <div className="form-group">
                    <label>Available Time Slots *</label>
                    <div className="time-slots">
                      {availableSlots.length === 0 ? (
                        <p className="no-slots">No available slots for selected date</p>
                      ) : (
                        availableSlots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                          >
                            {slot}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Symptoms (Optional)</label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                    placeholder="Describe your pet's symptoms or concerns"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowBookingModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={loading || !selectedDate || !selectedSlot || !formData.petName}
                className="btn-confirm"
              >
                {loading ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorBooking;