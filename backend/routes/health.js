const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const { v4: uuidv4 } = require('uuid');

// Generate record ID
const generateRecordId = async () => {
  const count = await HealthRecord.countDocuments();
  return `HEALTH-${String(count + 1).padStart(5, '0')}`;
};

// Get user's health records
router.get('/', async (req, res) => {
  try {
    const records = await HealthRecord.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      records
    });
  } catch (err) {
    console.error('Error fetching health records:', err);
    res.status(500).json({ message: 'Failed to fetch health records', error: err.message });
  }
});

// Create new health record
router.post('/', async (req, res) => {
  try {
    const { 
      dogName, breed, age, weight, 
      vaccinations, medicalConditions, medications, 
      vetVisits, allergies, emergencyContact 
    } = req.body;
    
    const recordId = await generateRecordId();

    const record = new HealthRecord({
      recordId,
      userId: req.user.id,
      dogName,
      breed,
      age,
      weight: weight ? parseFloat(weight) : null,
      vaccinations: vaccinations || [],
      medicalConditions: medicalConditions || [],
      medications: medications || [],
      vetVisits: vetVisits || [],
      allergies: allergies || [],
      emergencyContact: emergencyContact || {}
    });

    await record.save();

    res.json({
      success: true,
      message: 'Health record created successfully',
      record
    });
  } catch (err) {
    console.error('Error creating health record:', err);
    res.status(500).json({ message: 'Failed to create health record', error: err.message });
  }
});

// Update health record
router.put('/:id', async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }
    
    if (record.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own health records' });
    }
    
    const updatedRecord = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Health record updated successfully',
      record: updatedRecord
    });
  } catch (err) {
    console.error('Error updating health record:', err);
    res.status(500).json({ message: 'Failed to update health record', error: err.message });
  }
});

// Add vaccination
router.post('/:id/vaccinations', async (req, res) => {
  try {
    const { name, date, nextDue, status } = req.body;
    
    const record = await HealthRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }
    
    if (record.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own health records' });
    }
    
    record.vaccinations.push({
      name,
      date: new Date(date),
      nextDue: nextDue ? new Date(nextDue) : null,
      status: status || 'Completed'
    });
    
    await record.save();
    
    res.json({
      success: true,
      message: 'Vaccination added successfully',
      vaccinations: record.vaccinations
    });
  } catch (err) {
    console.error('Error adding vaccination:', err);
    res.status(500).json({ message: 'Failed to add vaccination', error: err.message });
  }
});

// Add vet visit
router.post('/:id/vet-visits', async (req, res) => {
  try {
    const { date, reason, diagnosis, treatment, vetName } = req.body;
    
    const record = await HealthRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }
    
    if (record.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own health records' });
    }
    
    record.vetVisits.push({
      date: new Date(date),
      reason,
      diagnosis,
      treatment,
      vetName
    });
    
    await record.save();
    
    res.json({
      success: true,
      message: 'Vet visit added successfully',
      vetVisits: record.vetVisits
    });
  } catch (err) {
    console.error('Error adding vet visit:', err);
    res.status(500).json({ message: 'Failed to add vet visit', error: err.message });
  }
});

// Get upcoming vaccinations
router.get('/upcoming-vaccinations', async (req, res) => {
  try {
    const records = await HealthRecord.find({ userId: req.user.id });
    
    const upcomingVaccinations = [];
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    records.forEach(record => {
      record.vaccinations.forEach(vaccination => {
        if (vaccination.nextDue && vaccination.nextDue <= nextMonth && vaccination.nextDue >= now) {
          upcomingVaccinations.push({
            recordId: record.recordId,
            dogName: record.dogName,
            vaccination: vaccination
          });
        }
      });
    });
    
    res.json({
      success: true,
      upcomingVaccinations: upcomingVaccinations.sort((a, b) => a.vaccination.nextDue - b.vaccination.nextDue)
    });
  } catch (err) {
    console.error('Error fetching upcoming vaccinations:', err);
    res.status(500).json({ message: 'Failed to fetch upcoming vaccinations', error: err.message });
  }
});

module.exports = router;