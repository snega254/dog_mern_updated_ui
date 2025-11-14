const express = require('express');
const router = express.Router();
const DoctorBooking = require('../models/DoctorBooking');
const { v4: uuidv4 } = require('uuid');

// Available time slots
const availableTimeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

// Available doctors
const availableDoctors = [
  { id: 1, name: 'Dr. Sharma', specialization: 'General Veterinary', experience: '10 years', rating: 4.8 },
  { id: 2, name: 'Dr. Patel', specialization: 'Surgery', experience: '8 years', rating: 4.9 },
  { id: 3, name: 'Dr. Kumar', specialization: 'Dermatology', experience: '12 years', rating: 4.7 },
  { id: 4, name: 'Dr. Gupta', specialization: 'Dentistry', experience: '6 years', rating: 4.6 }
];

// Generate booking ID
const generateBookingId = async () => {
  const count = await DoctorBooking.countDocuments();
  return `BOOK-${String(count + 1).padStart(5, '0')}`;
};

// Get available time slots for a date
router.get('/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Get existing bookings for the date
    const existingBookings = await DoctorBooking.find({ 
      appointmentDate: new Date(date),
      status: 'scheduled'
    });

    const bookedSlots = existingBookings.map(booking => booking.appointmentTime);
    const availableSlots = availableTimeSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      availableSlots,
      doctors: availableDoctors
    });
  } catch (err) {
    console.error('Error fetching available slots:', err);
    res.status(500).json({ message: 'Failed to fetch available slots', error: err.message });
  }
});

// Book appointment
router.post('/book', async (req, res) => {
  try {
    const { doctorName, specialization, petName, petType, symptoms, appointmentDate, appointmentTime } = req.body;
    
    // Check if slot is still available
    const existingBooking = await DoctorBooking.findOne({
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: 'scheduled'
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is no longer available' });
    }

    const bookingId = await generateBookingId();

    const booking = new DoctorBooking({
      bookingId,
      userId: req.user.id,
      doctorName,
      specialization,
      petName,
      petType: petType || 'Dog',
      symptoms,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      fee: 500 // Standard consultation fee
    });

    await booking.save();

    // Emit real-time notification
    req.io.emit('newDoctorBooking', {
      bookingId: booking.bookingId,
      doctorName: booking.doctorName,
      appointmentDate: booking.appointmentDate
    });

    res.json({
      success: true,
      message: 'Appointment booked successfully',
      bookingId: booking.bookingId,
      booking
    });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ message: 'Failed to book appointment', error: err.message });
  }
});

// Get user's appointments
router.get('/my-appointments', async (req, res) => {
  try {
    const appointments = await DoctorBooking.find({ userId: req.user.id })
      .sort({ appointmentDate: 1, appointmentTime: 1 });
    
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ message: 'Failed to fetch appointments', error: err.message });
  }
});

// Cancel appointment
router.put('/:id/cancel', async (req, res) => {
  try {
    const booking = await DoctorBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own appointments' });
    }
    
    if (booking.status !== 'scheduled') {
      return res.status(400).json({ message: 'Cannot cancel completed or already cancelled appointment' });
    }

    // Check if appointment is within 24 hours
    const appointmentDateTime = new Date(booking.appointmentDate);
    const now = new Date();
    const timeDiff = appointmentDateTime - now;
    
    if (timeDiff < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: 'Cannot cancel appointment within 24 hours' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ message: 'Failed to cancel appointment', error: err.message });
  }
});

// Get all doctors
router.get('/doctors', async (req, res) => {
  try {
    res.json({
      success: true,
      doctors: availableDoctors
    });
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ message: 'Failed to fetch doctors', error: err.message });
  }
});

module.exports = router;