import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HealthRecords.css';

const HealthRecords = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [showVetVisitModal, setShowVetVisitModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records');
  const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);

  const [newRecord, setNewRecord] = useState({
    dogName: '',
    breed: '',
    age: '',
    weight: '',
    allergies: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [newVaccination, setNewVaccination] = useState({
    name: '',
    date: '',
    nextDue: '',
    status: 'Completed'
  });

  const [newVetVisit, setNewVetVisit] = useState({
    date: '',
    reason: '',
    diagnosis: '',
    treatment: '',
    vetName: ''
  });

  useEffect(() => {
    fetchHealthRecords();
    fetchUpcomingVaccinations();
  }, []);

  const fetchHealthRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(response.data.records);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching health records:', error);
      setLoading(false);
    }
  };

  const fetchUpcomingVaccinations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/health/upcoming-vaccinations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpcomingVaccinations(response.data.upcomingVaccinations);
    } catch (error) {
      console.error('Error fetching upcoming vaccinations:', error);
    }
  };

  const handleCreateRecord = async () => {
    if (!newRecord.dogName.trim()) {
      alert('Please enter your dog\'s name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/health', newRecord, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Health record created successfully!');
      setShowCreateModal(false);
      resetNewRecordForm();
      fetchHealthRecords();
    } catch (error) {
      console.error('Error creating health record:', error);
      alert('Failed to create health record. Please try again.');
    }
  };

  const handleAddVaccination = async () => {
    if (!newVaccination.name || !newVaccination.date) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/health/${selectedRecord._id}/vaccinations`,
        newVaccination,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Vaccination added successfully!');
      setShowVaccinationModal(false);
      resetVaccinationForm();
      fetchHealthRecords();
      fetchUpcomingVaccinations();
    } catch (error) {
      console.error('Error adding vaccination:', error);
      alert('Failed to add vaccination. Please try again.');
    }
  };

  const handleAddVetVisit = async () => {
    if (!newVetVisit.date || !newVetVisit.reason) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/health/${selectedRecord._id}/vet-visits`,
        newVetVisit,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Vet visit added successfully!');
      setShowVetVisitModal(false);
      resetVetVisitForm();
      fetchHealthRecords();
    } catch (error) {
      console.error('Error adding vet visit:', error);
      alert('Failed to add vet visit. Please try again.');
    }
  };

  const resetNewRecordForm = () => {
    setNewRecord({
      dogName: '',
      breed: '',
      age: '',
      weight: '',
      allergies: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
  };

  const resetVaccinationForm = () => {
    setNewVaccination({
      name: '',
      date: '',
      nextDue: '',
      status: 'Completed'
    });
  };

  const resetVetVisitForm = () => {
    setNewVetVisit({
      date: '',
      reason: '',
      diagnosis: '',
      treatment: '',
      vetName: ''
    });
  };

  const getVaccinationStatus = (nextDue) => {
    if (!nextDue) return 'unknown';
    
    const nextDueDate = new Date(nextDue);
    const today = new Date();
    const timeDiff = nextDueDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 30) return 'due-soon';
    return 'up-to-date';
  };

  const getVaccinationStatusBadge = (status) => {
    const config = {
      'up-to-date': { class: 'up-to-date', label: 'Up to Date' },
      'due-soon': { class: 'due-soon', label: 'Due Soon' },
      'overdue': { class: 'overdue', label: 'Overdue' },
      'unknown': { class: 'unknown', label: 'Unknown' }
    };

    const { class: className, label } = config[status] || config.unknown;
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading health records...</p>
      </div>
    );
  }

  return (
    <div className="health-records-container">
      <header className="health-header">
        <div className="header-content">
          <h1>🏥 Health Records</h1>
          <p>Manage your dog's medical history and health information</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/dashboard_user')} className="back-btn">
            Back to Dashboard
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="create-record-btn"
          >
            + New Health Record
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="health-tabs">
        <button
          className={`tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          📋 Health Records
        </button>
        <button
          className={`tab ${activeTab === 'vaccinations' ? 'active' : ''}`}
          onClick={() => setActiveTab('vaccinations')}
        >
          💉 Vaccinations
        </button>
        <button
          className={`tab ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          ⏰ Reminders
        </button>
      </div>

      {/* Health Records Tab */}
      {activeTab === 'records' && (
        <div className="records-section">
          {records.length === 0 ? (
            <div className="no-records">
              <div className="no-records-icon">🏥</div>
              <h3>No health records yet</h3>
              <p>Create your first health record to track your dog's medical history</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="create-first-record-btn"
              >
                Create Health Record
              </button>
            </div>
          ) : (
            <div className="records-grid">
              {records.map(record => (
                <div key={record._id} className="record-card">
                  <div className="record-header">
                    <h3>{record.dogName}</h3>
                    <div className="record-actions">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowVaccinationModal(true);
                        }}
                        className="btn-add-vaccination"
                        title="Add Vaccination"
                      >
                        💉
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowVetVisitModal(true);
                        }}
                        className="btn-add-vet-visit"
                        title="Add Vet Visit"
                      >
                        🏥
                      </button>
                    </div>
                  </div>

                  <div className="record-details">
                    <div className="detail-row">
                      <span className="label">Breed:</span>
                      <span className="value">{record.breed || 'Not specified'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Age:</span>
                      <span className="value">{record.age || 'Not specified'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Weight:</span>
                      <span className="value">
                        {record.weight ? `${record.weight} kg` : 'Not specified'}
                      </span>
                    </div>
                    {record.allergies && record.allergies.length > 0 && (
                      <div className="detail-row">
                        <span className="label">Allergies:</span>
                        <span className="value">{record.allergies.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Vaccination Summary */}
                  {record.vaccinations && record.vaccinations.length > 0 && (
                    <div className="vaccination-summary">
                      <h4>Recent Vaccinations</h4>
                      <div className="vaccination-list">
                        {record.vaccinations.slice(0, 3).map((vacc, index) => (
                          <div key={index} className="vaccination-item">
                            <span className="vacc-name">{vacc.name}</span>
                            <span className="vacc-date">
                              {new Date(vacc.date).toLocaleDateString()}
                            </span>
                            {vacc.nextDue && (
                              <span className={`vacc-status ${getVaccinationStatus(vacc.nextDue)}`}>
                                {getVaccinationStatusBadge(getVaccinationStatus(vacc.nextDue))}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vet Visits Summary */}
                  {record.vetVisits && record.vetVisits.length > 0 && (
                    <div className="vet-visits-summary">
                      <h4>Recent Vet Visits</h4>
                      <div className="vet-visits-list">
                        {record.vetVisits.slice(0, 2).map((visit, index) => (
                          <div key={index} className="vet-visit-item">
                            <span className="visit-date">
                              {new Date(visit.date).toLocaleDateString()}
                            </span>
                            <span className="visit-reason">{visit.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vaccinations Tab */}
      {activeTab === 'vaccinations' && (
        <div className="vaccinations-section">
          <h2>Vaccination Tracker</h2>
          {records.length === 0 ? (
            <div className="no-data">
              <p>Create a health record first to track vaccinations</p>
            </div>
          ) : (
            <div className="vaccinations-list">
              {records.map(record => (
                <div key={record._id} className="record-vaccinations">
                  <h3>{record.dogName}'s Vaccinations</h3>
                  {record.vaccinations && record.vaccinations.length > 0 ? (
                    <div className="vaccination-table">
                      <div className="table-header">
                        <span>Vaccine</span>
                        <span>Date</span>
                        <span>Next Due</span>
                        <span>Status</span>
                      </div>
                      {record.vaccinations.map((vacc, index) => (
                        <div key={index} className="table-row">
                          <span className="vacc-name">{vacc.name}</span>
                          <span className="vacc-date">
                            {new Date(vacc.date).toLocaleDateString()}
                          </span>
                          <span className="next-due">
                            {vacc.nextDue ? new Date(vacc.nextDue).toLocaleDateString() : 'N/A'}
                          </span>
                          <span className="status">
                            {getVaccinationStatusBadge(getVaccinationStatus(vacc.nextDue))}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-vaccinations">No vaccinations recorded yet</p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setShowVaccinationModal(true);
                    }}
                    className="btn-add-vaccination"
                  >
                    + Add Vaccination
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reminders Tab */}
      {activeTab === 'reminders' && (
        <div className="reminders-section">
          <h2>Upcoming Vaccinations</h2>
          {upcomingVaccinations.length === 0 ? (
            <div className="no-reminders">
              <div className="no-reminders-icon">✅</div>
              <h3>All vaccinations are up to date!</h3>
              <p>No upcoming vaccination reminders</p>
            </div>
          ) : (
            <div className="reminders-list">
              {upcomingVaccinations.map((item, index) => (
                <div key={index} className="reminder-card">
                  <div className="reminder-header">
                    <h4>{item.dogName}</h4>
                    <span className="reminder-type">Vaccination Due</span>
                  </div>
                  <div className="reminder-details">
                    <div className="detail">
                      <span className="label">Vaccine:</span>
                      <span className="value">{item.vaccination.name}</span>
                    </div>
                    <div className="detail">
                      <span className="label">Due Date:</span>
                      <span className="value due-date">
                        {new Date(item.vaccination.nextDue).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail">
                      <span className="label">Days Left:</span>
                      <span className="value days-left">
                        {Math.ceil((new Date(item.vaccination.nextDue) - new Date()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                  <div className="reminder-actions">
                    <button className="btn-snooze">Snooze</button>
                    <button className="btn-complete">Mark Complete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Record Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content health-modal">
            <div className="modal-header">
              <h2>Create Health Record</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="close-modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Dog Name *</label>
                <input
                  type="text"
                  value={newRecord.dogName}
                  onChange={(e) => setNewRecord({...newRecord, dogName: e.target.value})}
                  placeholder="Enter your dog's name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Breed</label>
                  <input
                    type="text"
                    value={newRecord.breed}
                    onChange={(e) => setNewRecord({...newRecord, breed: e.target.value})}
                    placeholder="e.g., Labrador Retriever"
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="text"
                    value={newRecord.age}
                    onChange={(e) => setNewRecord({...newRecord, age: e.target.value})}
                    placeholder="e.g., 2 years"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  value={newRecord.weight}
                  onChange={(e) => setNewRecord({...newRecord, weight: e.target.value})}
                  placeholder="e.g., 25"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Allergies (comma separated)</label>
                <input
                  type="text"
                  value={newRecord.allergies}
                  onChange={(e) => setNewRecord({...newRecord, allergies: e.target.value})}
                  placeholder="e.g., Chicken, Pollen, Flea medication"
                />
              </div>

              <div className="emergency-contact">
                <h4>Emergency Contact</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={newRecord.emergencyContact.name}
                      onChange={(e) => setNewRecord({
                        ...newRecord,
                        emergencyContact: {...newRecord.emergencyContact, name: e.target.value}
                      })}
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={newRecord.emergencyContact.phone}
                      onChange={(e) => setNewRecord({
                        ...newRecord,
                        emergencyContact: {...newRecord.emergencyContact, phone: e.target.value}
                      })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Relationship</label>
                  <input
                    type="text"
                    value={newRecord.emergencyContact.relationship}
                    onChange={(e) => setNewRecord({
                      ...newRecord,
                      emergencyContact: {...newRecord.emergencyContact, relationship: e.target.value}
                    })}
                    placeholder="e.g., Owner, Veterinarian"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRecord}
                disabled={!newRecord.dogName.trim()}
                className="btn-create"
              >
                Create Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vaccination Modal */}
      {showVaccinationModal && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-content health-modal">
            <div className="modal-header">
              <h2>Add Vaccination for {selectedRecord.dogName}</h2>
              <button
                onClick={() => setShowVaccinationModal(false)}
                className="close-modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Vaccine Name *</label>
                <input
                  type="text"
                  value={newVaccination.name}
                  onChange={(e) => setNewVaccination({...newVaccination, name: e.target.value})}
                  placeholder="e.g., Rabies, DHPP, Bordetella"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vaccination Date *</label>
                  <input
                    type="date"
                    value={newVaccination.date}
                    onChange={(e) => setNewVaccination({...newVaccination, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Next Due Date</label>
                  <input
                    type="date"
                    value={newVaccination.nextDue}
                    onChange={(e) => setNewVaccination({...newVaccination, nextDue: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={newVaccination.status}
                  onChange={(e) => setNewVaccination({...newVaccination, status: e.target.value})}
                >
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowVaccinationModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVaccination}
                disabled={!newVaccination.name || !newVaccination.date}
                className="btn-create"
              >
                Add Vaccination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vet Visit Modal */}
      {showVetVisitModal && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-content health-modal">
            <div className="modal-header">
              <h2>Add Vet Visit for {selectedRecord.dogName}</h2>
              <button
                onClick={() => setShowVetVisitModal(false)}
                className="close-modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Visit Date *</label>
                  <input
                    type="date"
                    value={newVetVisit.date}
                    onChange={(e) => setNewVetVisit({...newVetVisit, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Veterinarian Name</label>
                  <input
                    type="text"
                    value={newVetVisit.vetName}
                    onChange={(e) => setNewVetVisit({...newVetVisit, vetName: e.target.value})}
                    placeholder="Dr. Name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Visit *</label>
                <input
                  type="text"
                  value={newVetVisit.reason}
                  onChange={(e) => setNewVetVisit({...newVetVisit, reason: e.target.value})}
                  placeholder="e.g., Annual checkup, Vaccination, Injury"
                  required
                />
              </div>

              <div className="form-group">
                <label>Diagnosis</label>
                <textarea
                  value={newVetVisit.diagnosis}
                  onChange={(e) => setNewVetVisit({...newVetVisit, diagnosis: e.target.value})}
                  placeholder="Veterinarian's diagnosis"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Treatment</label>
                <textarea
                  value={newVetVisit.treatment}
                  onChange={(e) => setNewVetVisit({...newVetVisit, treatment: e.target.value})}
                  placeholder="Prescribed treatment or medication"
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowVetVisitModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVetVisit}
                disabled={!newVetVisit.date || !newVetVisit.reason}
                className="btn-create"
              >
                Add Vet Visit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecords;