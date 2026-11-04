const mongoose = require('mongoose');
const Donor = require('../models/Donor');
const dataStore = require('../utils/dataStore');

const isDbReady = () => mongoose.connection.readyState === 1;

// GET /api/donors
const getDonors = async (req, res) => {
  try {
    const donors = await dataStore.getAllDonors(req.query);

    // If caller is NOT an authorized admin, sanitize private addresses and sensitive data
    const isAdmin = req.user && req.user.role === 'admin';
    const sanitized = donors.map(d => {
      if (isAdmin) return d;
      return {
        _id: d._id,
        name: d.name,
        gender: d.gender,
        bloodGroup: d.bloodGroup,
        city: d.city,
        state: d.state,
        weightKg: d.weightKg || 55,
        hasDonatedBefore: d.hasDonatedBefore || false,
        lastDonationDate: d.lastDonationDate || d.lastDonatedDate,
        nextEligibleDonationDate: d.nextEligibleDonationDate,
        preliminaryEligibilityStatus: d.preliminaryEligibilityStatus || 'PRELIMINARILY ELIGIBLE',
        medicalScreeningStatus: d.medicalScreeningStatus || 'AWAITING_MEDICAL_SCREENING',
        isAvailable: d.isAvailable,
        availabilityStatus: d.availabilityStatus,
        totalDonations: d.totalDonations,
        lastDonatedDate: d.lastDonatedDate,
        distanceKm: d.distanceKm
      };
    });

    res.json({
      success: true,
      count: sanitized.length,
      data: sanitized
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/donors/:id
const getDonorById = async (req, res) => {
  try {
    const donor = await dataStore.getDonorById(req.params.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }
    res.json({ success: true, data: donor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/donors/:id/matching-requirements
const getMatchingRequirements = async (req, res) => {
  try {
    const donor = await dataStore.getDonorById(req.params.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    const [allRequests, allHospitals] = await Promise.all([
      dataStore.getAllRequests(),
      dataStore.getAllHospitals()
    ]);

    // Matching requests (patients needing donor's bloodGroup)
    const matchingRequests = allRequests.filter(r =>
      r.status !== 'FULFILLED' &&
      r.status !== 'CANCELLED' &&
      r.status !== 'REJECTED' &&
      (r.bloodGroup === donor.bloodGroup || (r.bloodGroup === 'AB+' && ['A+', 'B+', 'O+', 'AB+'].includes(donor.bloodGroup)))
    );

    // Nearby hospitals requiring donor's blood group
    const matchingHospitals = allHospitals.filter(h =>
      (h.requiredBloodGroups && h.requiredBloodGroups.includes(donor.bloodGroup)) ||
      (h.bloodInventory && (h.bloodInventory[donor.bloodGroup] || 0) < 3)
    );

    res.json({
      success: true,
      donor: {
        id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        city: donor.city
      },
      matchingRequests,
      matchingHospitals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/donors/:id/donations
const getDonorDonationHistory = async (req, res) => {
  try {
    const donations = await dataStore.getDonations({ donorId: req.params.id });
    res.json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/donors
const createDonor = async (req, res) => {
  try {
    const { name, bloodGroup, phone, city, email } = req.body;
    if (!name || !bloodGroup || !phone || !city) {
      return res.status(400).json({
        success: false,
        message: 'Name, blood group, contact phone, and district are required fields.'
      });
    }

    // Validate 10-digit mobile number
    const digitsOnly = String(phone).replace(/\D/g, '');
    let tenDigits = digitsOnly;
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      tenDigits = digitsOnly.slice(2);
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      tenDigits = digitsOnly.slice(1);
    }

    if (tenDigits.length !== 10 || !/^[6-9]\d{9}$/.test(tenDigits)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
      });
    }

    // Validate email if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }
    }

    // Prevent duplicate registrations by phone or email
    const duplicateQuery = [
      { phone: phone.trim() },
      { phone: tenDigits },
      { phone: `+91 ${tenDigits}` },
      { phone: `+91${tenDigits}` }
    ];
    if (email && email.trim()) {
      duplicateQuery.push({ email: email.trim().toLowerCase() });
    }

    if (isDbReady()) {
      const existing = await Donor.findOne({ $or: duplicateQuery });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A donor with this contact phone or email is already registered in the BloodConnect network.'
        });
      }
    } else {
      const all = await dataStore.getAllDonors();
      const existing = all.find(
        (d) =>
          d.phone === phone.trim() ||
          d.phone === tenDigits ||
          d.phone === `+91 ${tenDigits}` ||
          (email && d.email && d.email.toLowerCase() === email.trim().toLowerCase())
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A donor with this contact phone or email is already registered in the BloodConnect network.'
        });
      }
    }

    const payload = {
      ...req.body,
      gender: req.body.gender || 'Male',
      phone: tenDigits,
      bloodGroup: bloodGroup.trim().toUpperCase(),
      city: city.trim(),
      email: email ? email.trim().toLowerCase() : ''
    };

    const donor = await dataStore.createDonor(payload);

    const io = req.app.get('io');
    if (io) {
      io.emit('donor-registered', {
        id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        city: donor.city,
        isAvailable: donor.isAvailable
      });
    }

    res.status(201).json({
      success: true,
      message: 'Donor successfully registered and saved to the live network database!',
      data: donor
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/donors/:id
const updateDonor = async (req, res) => {
  try {
    const updated = await dataStore.updateDonor(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }
    res.json({ success: true, message: 'Donor updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/donors/:id/availability
const toggleAvailability = async (req, res) => {
  try {
    const updated = await dataStore.toggleDonorAvailability(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('donor-availability-changed', {
        id: updated._id,
        isAvailable: updated.isAvailable,
        availabilityStatus: updated.availabilityStatus
      });
    }

    res.json({
      success: true,
      message: `Donor availability updated to ${updated.isAvailable ? 'Available' : 'Busy'}`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/donors/:id
const deleteDonor = async (req, res) => {
  try {
    const deleted = await dataStore.deleteDonor(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }
    res.json({ success: true, message: 'Donor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/donors/:id/medical-status
const updateMedicalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicalScreeningStatus, notes } = req.body;

    const allowed = ['PENDING', 'AWAITING_MEDICAL_SCREENING', 'MEDICALLY_CLEARED', 'NOT_ELIGIBLE', 'REJECTED'];
    if (!allowed.includes(medicalScreeningStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid medical screening status.' });
    }

    const donor = await dataStore.getDonorById(id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    const updates = {
      medicalScreeningStatus,
      isAvailable:
        medicalScreeningStatus === 'MEDICALLY_CLEARED' ||
        (medicalScreeningStatus === 'AWAITING_MEDICAL_SCREENING' && donor.preliminaryEligibilityStatus !== 'NOT ELIGIBLE'),
      availabilityStatus:
        medicalScreeningStatus === 'MEDICALLY_CLEARED'
          ? 'Available'
          : medicalScreeningStatus === 'NOT_ELIGIBLE' || medicalScreeningStatus === 'REJECTED'
          ? 'Inactive'
          : donor.availabilityStatus
    };

    if (medicalScreeningStatus === 'MEDICALLY_CLEARED') {
      updates.preliminaryEligibilityStatus = 'MEDICALLY CLEARED';
    } else if (medicalScreeningStatus === 'NOT_ELIGIBLE' || medicalScreeningStatus === 'REJECTED') {
      updates.preliminaryEligibilityStatus = 'NOT ELIGIBLE';
    }

    if (notes) updates.notes = notes;

    const updated = await dataStore.updateDonor(id, updates);
    res.json({ success: true, message: 'Donor medical status updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDonors,
  getDonorById,
  getMatchingRequirements,
  getDonorDonationHistory,
  createDonor,
  updateDonor,
  toggleAvailability,
  deleteDonor,
  updateMedicalStatus
};
