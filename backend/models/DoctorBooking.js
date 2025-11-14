const mongoose = require('mongoose');

const doctorBookingSchema = new mongoose.Schema({
  bookingId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctorName: { 
    type: String, 
    required: true 
  },
  specialization: { 
    type: String, 
    required: true 
  },
  petName: { 
    type: String, 
    required: true 
  },
  petType: { 
    type: String, 
    default: 'Dog' 
  },
  symptoms: String,
  appointmentDate: { 
    type: Date, 
    required: true 
  },
  appointmentTime: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  fee: { 
    type: Number, 
    default: 500 
  },
  notes: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('DoctorBooking', doctorBookingSchema);