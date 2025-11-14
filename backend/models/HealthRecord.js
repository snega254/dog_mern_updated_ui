const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  recordId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  dogId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Dog' 
  },
  dogName: { 
    type: String, 
    required: true 
  },
  breed: String,
  age: String,
  weight: Number,
  vaccinations: [{
    name: String,
    date: Date,
    nextDue: Date,
    status: String
  }],
  medicalConditions: [{
    condition: String,
    diagnosedDate: Date,
    treatment: String,
    status: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date
  }],
  vetVisits: [{
    date: Date,
    reason: String,
    diagnosis: String,
    treatment: String,
    vetName: String
  }],
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);