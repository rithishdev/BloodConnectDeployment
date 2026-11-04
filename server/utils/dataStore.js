const mongoose = require('mongoose');
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');
const Donation = require('../models/Donation');
const BloodUsage = require('../models/BloodUsage');
const User = require('../models/User');
const { initialDonors, initialRequests, initialHospitals, initialDonations, initialUsages } = require('./seedData');
const { calculateDistance, isBloodCompatible, COMPATIBLE_DONORS_FOR_RECIPIENT } = require('./distance');
const { evaluateEligibility } = require('./eligibility');

// In-Memory store as robust fallback
let memoryDonors = initialDonors.map((d, i) => ({
  ...d,
  _id: `mem_donor_${i + 1}`,
  createdAt: new Date(),
  updatedAt: new Date()
}));

let memoryRequests = initialRequests.map((r, i) => ({
  ...r,
  _id: `mem_req_${i + 1}`,
  createdAt: r.createdAt || new Date(),
  updatedAt: new Date()
}));

let memoryHospitals = initialHospitals.map((h, i) => ({
  ...h,
  _id: `mem_hosp_${i + 1}`,
  createdAt: new Date(),
  updatedAt: new Date()
}));

let memoryDonations = initialDonations.map((dn, i) => ({
  ...dn,
  _id: `mem_donation_${i + 1}`,
  createdAt: new Date(),
  updatedAt: new Date()
}));

const isDbReady = () => mongoose.connection.readyState === 1;

// Seed database if MongoDB is connected and empty
async function seedMongoIfEmpty() {
  if (!isDbReady()) return;
  try {
    const donorCount = await Donor.countDocuments();
    if (donorCount === 0) {
      console.log('🌱 Seeding initial donors into MongoDB...');
      await Donor.insertMany(initialDonors);
    }

    const reqCount = await BloodRequest.countDocuments();
    if (reqCount === 0) {
      console.log('🌱 Seeding initial blood requests into MongoDB...');
      await BloodRequest.insertMany(initialRequests);
    }

    const hospCount = await Hospital.countDocuments();
    if (hospCount === 0) {
      console.log('🌱 Seeding initial hospitals into MongoDB...');
      await Hospital.insertMany(initialHospitals);
    }

    const donationCount = await Donation.countDocuments();
    if (donationCount === 0) {
      console.log('🌱 Seeding initial donations & usage logs into MongoDB...');
      await Donation.insertMany(initialDonations);
    }

    const usageCount = await BloodUsage.countDocuments();
    if (usageCount === 0) {
      console.log('🌱 Seeding initial blood usage transactions into MongoDB...');
      await BloodUsage.insertMany(initialUsages);
    }

    // Also check default admin account
    const { ensureAdminUser } = require('../controllers/authController');
    await ensureAdminUser();
  } catch (err) {
    console.error('Error during MongoDB auto-seed:', err.message);
  }
}

// ================= DONOR SERVICES ================= //
async function getAllDonors(filters = {}) {
  const { bloodGroup, city, isAvailable, search, lat, lng, maxDistanceKm, compatibleFor, userId } = filters;

  let donors = [];

  if (isDbReady()) {
    const query = {};
    if (bloodGroup && bloodGroup.trim() && bloodGroup.toUpperCase() !== 'ALL') {
      query.bloodGroup = bloodGroup.trim().toUpperCase();
    }
    if (city && city.trim() && city.toUpperCase() !== 'ALL') {
      query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }
    if (isAvailable !== undefined && isAvailable !== '') {
      query.isAvailable = isAvailable === 'true' || isAvailable === true;
    }
    if (userId) {
      query.userId = userId;
    }

    donors = await Donor.find(query).lean();
  } else {
    donors = [...memoryDonors];
    if (bloodGroup && bloodGroup.trim() && bloodGroup.toUpperCase() !== 'ALL') {
      const targetGroup = bloodGroup.trim().toUpperCase();
      donors = donors.filter(d => (d.bloodGroup || '').toUpperCase() === targetGroup);
    }
    if (city && city.trim() && city.toUpperCase() !== 'ALL') {
      const targetCity = city.trim().toLowerCase();
      donors = donors.filter(d => (d.city || '').toLowerCase() === targetCity);
    }
    if (isAvailable !== undefined && isAvailable !== '') {
      const boolAvail = isAvailable === 'true' || isAvailable === true;
      donors = donors.filter(d => d.isAvailable === boolAvail);
    }
    if (userId) {
      donors = donors.filter(d => String(d.userId) === String(userId));
    }
  }

  // In-memory keyword search across name, city, notes
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    donors = donors.filter(d => {
      const matchName = d.name && d.name.toLowerCase().includes(term);
      const matchCity = d.city && d.city.toLowerCase().includes(term);
      const matchBlood = d.bloodGroup && d.bloodGroup.toLowerCase().includes(term);
      const matchNotes = d.notes && d.notes.toLowerCase().includes(term);
      return matchName || matchCity || matchBlood || matchNotes;
    });
  }

  // Filter by compatibility if requested
  if (compatibleFor) {
    const allowed = COMPATIBLE_DONORS_FOR_RECIPIENT[compatibleFor.toUpperCase()] || [];
    donors = donors.filter(d => allowed.includes(d.bloodGroup));
  }

  // Calculate distance if coordinates are provided
  if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    const userLat = Number(lat);
    const userLng = Number(lng);

    donors = donors.map(d => {
      const dLat = d.location?.lat;
      const dLng = d.location?.lng;
      const distance = (dLat && dLng) ? calculateDistance(userLat, userLng, dLat, dLng) : null;
      return { ...d, distanceKm: distance };
    });

    if (maxDistanceKm && !isNaN(Number(maxDistanceKm))) {
      const maxKm = Number(maxDistanceKm);
      donors = donors.filter(d => d.distanceKm === null || d.distanceKm <= maxKm);
    }

    donors.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  } else {
    donors.sort((a, b) => (b.isAvailable === a.isAvailable ? 0 : b.isAvailable ? 1 : -1));
  }

  return donors;
}

async function getDonorById(id) {
  if (isDbReady()) {
    return await Donor.findById(id).lean();
  }
  return memoryDonors.find(d => String(d._id) === String(id)) || null;
}

async function getDonorByUserId(userId) {
  if (isDbReady()) {
    return await Donor.findOne({ userId }).lean();
  }
  return memoryDonors.find(d => String(d.userId) === String(userId)) || null;
}

async function createDonor(data) {
  const eligibility = evaluateEligibility({
    weightKg: data.weightKg,
    hasDonatedBefore: data.hasDonatedBefore,
    lastDonationDate: data.lastDonationDate || data.lastDonatedDate,
    minimumWeightThreshold: data.minimumWeightThreshold || 50,
    requiredDonationIntervalDays: data.requiredDonationIntervalDays || 120,
    currentMedicalStatus: data.medicalScreeningStatus
  });

  const payload = {
    userId: data.userId || null,
    name: data.name,
    age: Number(data.age) || 25,
    gender: data.gender || 'Male',
    bloodGroup: data.bloodGroup.toUpperCase(),
    phone: data.phone,
    email: data.email || '',
    city: data.city,
    state: data.state || '',
    address: data.address || '',
    location: {
      lat: Number(data.lat) || (data.location && data.location.lat) || 40.7128,
      lng: Number(data.lng) || (data.location && data.location.lng) || -74.0060
    },
    weightKg: eligibility.weightKg,
    hasDonatedBefore: eligibility.hasDonatedBefore,
    lastDonationDate: eligibility.lastDonationDate,
    lastDonatedDate: eligibility.lastDonationDate,
    minimumWeightThreshold: eligibility.minimumWeightThreshold,
    requiredDonationIntervalDays: eligibility.requiredDonationIntervalDays,
    nextEligibleDonationDate: eligibility.nextEligibleDonationDate,
    preliminaryEligibilityStatus: eligibility.preliminaryEligibilityStatus,
    medicalScreeningStatus: eligibility.medicalScreeningStatus,
    isAvailable: eligibility.isAvailable,
    availabilityStatus: eligibility.availabilityStatus,
    totalDonations: Number(data.totalDonations) || 0,
    emergencyRadiusKm: Number(data.emergencyRadiusKm) || 25,
    notes: data.notes || ''
  };

  if (isDbReady()) {
    const newDonor = new Donor(payload);
    return await newDonor.save();
  } else {
    const newDonor = {
      ...payload,
      _id: `mem_donor_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryDonors.unshift(newDonor);
    return newDonor;
  }
}

async function updateDonor(id, data) {
  if (isDbReady()) {
    return await Donor.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }
  const idx = memoryDonors.findIndex(d => String(d._id) === String(id));
  if (idx === -1) return null;
  memoryDonors[idx] = {
    ...memoryDonors[idx],
    ...data,
    updatedAt: new Date()
  };
  return memoryDonors[idx];
}

async function toggleDonorAvailability(id) {
  const donor = await getDonorById(id);
  if (!donor) return null;

  const nextAvailable = !donor.isAvailable;
  const nextStatus = nextAvailable ? 'Available' : 'Busy';

  return await updateDonor(id, {
    isAvailable: nextAvailable,
    availabilityStatus: nextStatus
  });
}

async function deleteDonor(id) {
  if (isDbReady()) {
    const res = await Donor.findByIdAndDelete(id);
    return Boolean(res);
  }
  const initialLen = memoryDonors.length;
  memoryDonors = memoryDonors.filter(d => String(d._id) !== String(id));
  return memoryDonors.length < initialLen;
}

// ================= BLOOD REQUEST SERVICES ================= //
async function getAllRequests(filters = {}) {
  const { urgency, status, bloodGroup, city, search, userId } = filters;

  let requests = [];

  if (isDbReady()) {
    const query = {};
    if (urgency && urgency !== 'ALL') {
      query.urgency = urgency.toUpperCase();
    }
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }
    if (bloodGroup && bloodGroup !== 'ALL') {
      query.bloodGroup = bloodGroup.toUpperCase();
    }
    if (city && city.trim()) {
      query.city = { $regex: new RegExp(city.trim(), 'i') };
    }
    if (userId) {
      query.userId = userId;
    }

    requests = await BloodRequest.find(query).sort({ createdAt: -1 }).lean();
  } else {
    requests = [...memoryRequests];
    if (urgency && urgency !== 'ALL') {
      requests = requests.filter(r => r.urgency === urgency.toUpperCase());
    }
    if (status && status !== 'ALL') {
      requests = requests.filter(r => r.status === status.toUpperCase());
    }
    if (bloodGroup && bloodGroup !== 'ALL') {
      requests = requests.filter(r => r.bloodGroup === bloodGroup.toUpperCase());
    }
    if (city && city.trim()) {
      requests = requests.filter(r => r.city.toLowerCase().includes(city.trim().toLowerCase()));
    }
    if (userId) {
      requests = requests.filter(r => String(r.userId) === String(userId));
    }
  }

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    requests = requests.filter(r => {
      const matchPatient = r.patientName && r.patientName.toLowerCase().includes(term);
      const matchHospital = r.hospitalName && r.hospitalName.toLowerCase().includes(term);
      const matchBlood = r.bloodGroup && r.bloodGroup.toLowerCase().includes(term);
      const matchCity = r.city && r.city.toLowerCase().includes(term);
      return matchPatient || matchHospital || matchBlood || matchCity;
    });
  }

  const urgencyWeight = { CRITICAL: 3, URGENT: 2, STANDARD: 1, NORMAL: 1 };
  requests.sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;

    const uDiff = (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
    if (uDiff !== 0) return uDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return requests;
}

async function getRequestById(id) {
  if (isDbReady()) {
    return await BloodRequest.findById(id).lean();
  }
  return memoryRequests.find(r => String(r._id) === String(id)) || null;
}

async function findMatchedDonorsForRequest(reqData) {
  const compatibleBloodGroups = COMPATIBLE_DONORS_FOR_RECIPIENT[reqData.bloodGroup.toUpperCase()] || [reqData.bloodGroup];
  const allDonors = await getAllDonors({ isAvailable: true });

  const matched = [];
  const reqLat = reqData.location?.lat || 40.7128;
  const reqLng = reqData.location?.lng || -74.0060;

  for (const d of allDonors) {
    if (compatibleBloodGroups.includes(d.bloodGroup)) {
      const dLat = d.location?.lat;
      const dLng = d.location?.lng;
      const distance = (dLat && dLng) ? calculateDistance(reqLat, reqLng, dLat, dLng) : null;

      matched.push({
        donorId: d._id,
        name: d.name,
        phone: d.phone,
        bloodGroup: d.bloodGroup,
        city: d.city,
        address: d.address,
        isAvailable: d.isAvailable,
        distanceKm: distance !== null ? distance : 10.0,
        status: 'NOTIFIED'
      });
    }
  }

  matched.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  return matched;
}

async function createBloodRequest(data) {
  const payload = {
    userId: data.userId || null,
    patientName: data.patientName,
    age: Number(data.age) || null,
    gender: data.gender || '',
    bloodGroup: data.bloodGroup.toUpperCase(),
    unitsRequired: Number(data.unitsRequired) || 1,
    hospitalName: data.hospitalName,
    hospitalAddress: data.hospitalAddress || '',
    city: data.city,
    location: {
      lat: Number(data.lat) || (data.location && data.location.lat) || 40.7420,
      lng: Number(data.lng) || (data.location && data.location.lng) || -73.9740
    },
    urgency: data.urgency ? data.urgency.toUpperCase() : 'URGENT',
    status: 'PENDING',
    requesterName: data.requesterName,
    requesterPhone: data.requesterPhone,
    requesterEmail: data.requesterEmail || '',
    doctorName: data.doctorName || '',
    requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
    notes: data.notes || '',
    matchedDonors: [],
    createdAt: new Date(),
    fulfilledAt: null,
    responseTimeMinutes: null
  };

  const matches = await findMatchedDonorsForRequest(payload);
  payload.matchedDonors = matches.slice(0, 10);

  if (isDbReady()) {
    const newReq = new BloodRequest(payload);
    return await newReq.save();
  } else {
    const newReq = {
      ...payload,
      _id: `mem_req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      updatedAt: new Date()
    };
    memoryRequests.unshift(newReq);
    return newReq;
  }
}

async function updateBloodRequest(id, data) {
  if (isDbReady()) {
    return await BloodRequest.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }
  const idx = memoryRequests.findIndex(r => String(r._id) === String(id));
  if (idx === -1) return null;
  memoryRequests[idx] = {
    ...memoryRequests[idx],
    ...data,
    updatedAt: new Date()
  };
  return memoryRequests[idx];
}

async function updateRequestStatus(id, newStatus, reason = '') {
  const current = await getRequestById(id);
  if (!current) return null;

  const upperStatus = newStatus.toUpperCase();
  const update = { status: upperStatus };

  if (upperStatus === 'APPROVED') {
    update.approvedAt = new Date();
  } else if (upperStatus === 'REJECTED') {
    update.rejectedAt = new Date();
    update.rejectionReason = reason || 'Request rejected by medical administrator.';
  } else if (upperStatus === 'FULFILLED') {
    const now = new Date();
    update.fulfilledAt = now;
    const created = new Date(current.createdAt);
    const diffMinutes = Math.max(1, Math.round((now - created) / (1000 * 60)));
    update.responseTimeMinutes = diffMinutes;

    // Log Blood Usage transaction and deduct inventory if hospital is found
    try {
      await recordBloodUsage({
        requestId: current._id,
        patientName: current.patientName,
        bloodGroup: current.bloodGroup,
        units: current.unitsRequired || 1,
        hospitalName: current.hospitalName
      });
    } catch (e) {
      console.warn('Notice: Blood usage logging:', e.message);
    }
  }

  return await updateBloodRequest(id, update);
}

async function deleteBloodRequest(id) {
  if (isDbReady()) {
    const res = await BloodRequest.findByIdAndDelete(id);
    return Boolean(res);
  }
  const initialLen = memoryRequests.length;
  memoryRequests = memoryRequests.filter(r => String(r._id) !== String(id));
  return memoryRequests.length < initialLen;
}

// ================= HOSPITAL SERVICES ================= //
async function getAllHospitals(filters = {}) {
  const { search, city, requiredBloodGroup } = filters;
  let hospitals = [];

  if (isDbReady()) {
    const query = {};
    if (city && city.trim()) {
      query.city = { $regex: new RegExp(city.trim(), 'i') };
    }
    if (requiredBloodGroup && requiredBloodGroup !== 'ALL') {
      query.requiredBloodGroups = requiredBloodGroup.toUpperCase();
    }

    hospitals = await Hospital.find(query).lean();
  } else {
    hospitals = [...memoryHospitals];
    if (city && city.trim()) {
      hospitals = hospitals.filter(h => h.city.toLowerCase().includes(city.trim().toLowerCase()));
    }
    if (requiredBloodGroup && requiredBloodGroup !== 'ALL') {
      hospitals = hospitals.filter(h =>
        h.requiredBloodGroups && h.requiredBloodGroups.includes(requiredBloodGroup.toUpperCase())
      );
    }
  }

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    hospitals = hospitals.filter(h => {
      const matchName = h.name && h.name.toLowerCase().includes(term);
      const matchId = h.hospitalId && h.hospitalId.toLowerCase().includes(term);
      const matchAddress = h.address && h.address.toLowerCase().includes(term);
      const matchCity = h.city && h.city.toLowerCase().includes(term);
      return matchName || matchId || matchAddress || matchCity;
    });
  }

  return hospitals;
}

async function getHospitalById(id) {
  if (isDbReady()) {
    return await Hospital.findById(id).lean();
  }
  return memoryHospitals.find(h => String(h._id) === String(id)) || null;
}

async function createHospital(data) {
  const payload = {
    hospitalId: data.hospitalId || `HOSP-${Math.floor(100 + Math.random() * 900)}`,
    name: data.name,
    licenseNumber: data.licenseNumber || '',
    phone: data.phone,
    emergencyHotline: data.emergencyHotline || data.phone,
    email: data.email || '',
    city: data.city,
    address: data.address,
    location: {
      lat: Number(data.lat) || 40.7420,
      lng: Number(data.lng) || -73.9740
    },
    bloodInventory: data.bloodInventory || {
      'A+': 10, 'A-': 3, 'B+': 10, 'B-': 2, 'AB+': 4, 'AB-': 1, 'O+': 12, 'O-': 2
    },
    requiredBloodGroups: data.requiredBloodGroups || [],
    requiredUnits: Number(data.requiredUnits) || 0,
    verified: true
  };

  if (isDbReady()) {
    const h = new Hospital(payload);
    return await h.save();
  } else {
    const h = {
      ...payload,
      _id: `mem_hosp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryHospitals.push(h);
    return h;
  }
}

async function updateHospital(id, data) {
  if (isDbReady()) {
    return await Hospital.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }
  const idx = memoryHospitals.findIndex(h => String(h._id) === String(id));
  if (idx === -1) return null;
  memoryHospitals[idx] = {
    ...memoryHospitals[idx],
    ...data,
    updatedAt: new Date()
  };
  return memoryHospitals[idx];
}

async function deleteHospital(id) {
  if (isDbReady()) {
    const res = await Hospital.findByIdAndDelete(id);
    return Boolean(res);
  }
  const initialLen = memoryHospitals.length;
  memoryHospitals = memoryHospitals.filter(h => String(h._id) !== String(id));
  return memoryHospitals.length < initialLen;
}

async function updateHospitalInventory(id, bloodGroup, units) {
  const hosp = await getHospitalById(id);
  if (!hosp) return null;

  const currentUnits = hosp.bloodInventory?.[bloodGroup] || 0;
  // Prevent negative blood stock
  const newUnits = Math.max(0, currentUnits + Number(units));

  const updatedInventory = {
    ...(hosp.bloodInventory || {}),
    [bloodGroup]: newUnits
  };

  if (isDbReady()) {
    return await Hospital.findByIdAndUpdate(
      id,
      { $set: { bloodInventory: updatedInventory } },
      { new: true }
    ).lean();
  } else {
    const idx = memoryHospitals.findIndex(h => String(h._id) === String(id));
    if (idx !== -1) {
      memoryHospitals[idx].bloodInventory = updatedInventory;
      return memoryHospitals[idx];
    }
    return null;
  }
}

// Record usage and decrement stock cleanly
async function recordBloodUsage({ requestId, patientName, bloodGroup, units, hospitalName }) {
  // Deduct from matching hospital inventory if available
  const hospitals = await getAllHospitals();
  const matchedHosp = hospitals.find(h =>
    hospitalName && h.name.toLowerCase().includes(hospitalName.toLowerCase())
  );

  const usageRecord = {
    usageId: `USE-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`,
    requestId: requestId ? String(requestId) : null,
    patientName: patientName || 'Patient',
    bloodGroup: bloodGroup.toUpperCase(),
    units: Number(units) || 1,
    hospitalName: hospitalName || (matchedHosp ? matchedHosp.name : 'Regional Trauma Hospital'),
    hospitalId: matchedHosp ? (matchedHosp.hospitalId || String(matchedHosp._id)) : 'HSP-1001',
    date: new Date(),
    status: 'FULFILLED'
  };

  if (isDbReady()) {
    try {
      const analyticsService = require('../services/analyticsService');
      await analyticsService.issueBloodAndRecordUsage({
        hospitalId: matchedHosp ? (matchedHosp.hospitalId || String(matchedHosp._id)) : null,
        hospitalName: hospitalName || (matchedHosp ? matchedHosp.name : null),
        bloodGroup,
        units,
        requestId,
        patientName
      });
    } catch (e) {
      console.warn('Notice: Blood usage service:', e.message);
    }
  } else {
    if (matchedHosp) {
      await updateHospitalInventory(matchedHosp._id, bloodGroup, -Number(units));
    }
    memoryDonations.unshift({
      ...usageRecord,
      _id: `mem_usage_${Date.now()}`,
      createdAt: new Date(),
      type: 'USAGE'
    });
  }
}

// ================= DONATION SERVICES ================= //
async function getDonations(filters = {}) {
  const { donorId, userId, type } = filters;
  if (isDbReady()) {
    const query = {};
    if (donorId) query.donorId = donorId;
    if (userId) query.userId = userId;
    if (type) query.type = type;
    return await Donation.find(query).sort({ date: -1 }).lean();
  }

  let list = [...memoryDonations];
  if (donorId) list = list.filter(d => String(d.donorId) === String(donorId));
  if (userId) list = list.filter(d => String(d.userId) === String(userId));
  if (type) list = list.filter(d => d.type === type);
  return list;
}

async function createDonation(data) {
  const payload = {
    donorId: data.donorId || null,
    donorName: data.donorName || '',
    userId: data.userId || null,
    hospitalId: data.hospitalId || null,
    hospitalName: data.hospitalName || '',
    requestId: data.requestId || null,
    patientName: data.patientName || '',
    bloodGroup: data.bloodGroup.toUpperCase(),
    units: Number(data.units) || 1,
    type: data.type || 'DONATION',
    date: data.date ? new Date(data.date) : new Date(),
    status: data.status || 'COMPLETED',
    notes: data.notes || ''
  };

  if (isDbReady()) {
    const d = new Donation(payload);
    const saved = await d.save();

    // Increment donor total donations and lastDonatedDate if linked
    if (payload.donorId) {
      await Donor.findByIdAndUpdate(payload.donorId, {
        $inc: { totalDonations: payload.units },
        $set: { lastDonatedDate: payload.date, availabilityStatus: 'Donated Recently' }
      });
    }

    // Increment hospital inventory if hospitalId is present
    if (payload.hospitalId && payload.type === 'DONATION') {
      await updateHospitalInventory(payload.hospitalId, payload.bloodGroup, payload.units);
    }

    return saved;
  } else {
    const saved = {
      ...payload,
      _id: `mem_donation_${Date.now()}`,
      createdAt: new Date()
    };
    memoryDonations.unshift(saved);
    return saved;
  }
}

// ================= ANALYTICS & TELEMETRY ================= //
async function getPlatformAnalytics() {
  const donors = await getAllDonors();
  const requests = await getAllRequests();
  const hospitals = await getAllHospitals();

  const totalDonors = donors.length;
  const availableDonors = donors.filter(d => d.isAvailable).length;
  const busyDonors = totalDonors - availableDonors;

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const approvedRequests = requests.filter(r => r.status === 'APPROVED').length;
  const fulfilledRequests = requests.filter(r => r.status === 'FULFILLED').length;
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED').length;
  const cancelledRequests = requests.filter(r => r.status === 'CANCELLED').length;
  const criticalRequests = requests.filter(r => r.urgency === 'CRITICAL' && r.status !== 'FULFILLED' && r.status !== 'CANCELLED').length;

  const fulfillmentRate = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0;

  // Calculate total blood units available across all hospitals
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const totalUnitsAvailable = hospitals.reduce((sum, h) => {
    if (!h.bloodInventory) return sum;
    return sum + Object.values(h.bloodInventory).reduce((sub, val) => sub + (Number(val) || 0), 0);
  }, 0);

  // Group-wise blood availability across hospitals
  const groupWiseStock = {};
  bloodGroups.forEach(bg => {
    groupWiseStock[bg] = hospitals.reduce((acc, h) => acc + (Number(h.bloodInventory?.[bg]) || 0), 0);
  });

  // Response Time Analytics
  const fulfilledWithTimes = requests.filter(r => r.status === 'FULFILLED' && r.responseTimeMinutes);
  const totalResponseMinutes = fulfilledWithTimes.reduce((acc, curr) => acc + curr.responseTimeMinutes, 0);
  const avgResponseTimeMinutes = fulfilledWithTimes.length > 0 ? Math.round(totalResponseMinutes / fulfilledWithTimes.length) : 22;

  // Urgency Breakdown
  const urgencyCounts = {
    CRITICAL: requests.filter(r => r.urgency === 'CRITICAL').length,
    URGENT: requests.filter(r => r.urgency === 'URGENT').length,
    STANDARD: requests.filter(r => r.urgency === 'STANDARD' || r.urgency === 'NORMAL').length
  };

  // Status breakdown
  const statusCounts = {
    PENDING: pendingRequests,
    APPROVED: approvedRequests,
    FULFILLED: fulfilledRequests,
    REJECTED: rejectedRequests,
    CANCELLED: cancelledRequests
  };

  // Blood Group Supply (Donors) vs Demand (Units requested)
  const bloodGroupStats = bloodGroups.map(bg => {
    const donorCount = donors.filter(d => d.bloodGroup === bg).length;
    const availableCount = donors.filter(d => d.bloodGroup === bg && d.isAvailable).length;
    const reqCount = requests.filter(r => r.bloodGroup === bg).length;
    const unitsNeeded = requests
      .filter(r => r.bloodGroup === bg && r.status !== 'FULFILLED' && r.status !== 'CANCELLED')
      .reduce((sum, r) => sum + (r.unitsRequired || 1), 0);
    const stockUnits = groupWiseStock[bg] || 0;

    return {
      bloodGroup: bg,
      donorsCount: donorCount,
      availableDonors: availableCount,
      totalRequests: reqCount,
      unitsNeeded,
      stockUnits
    };
  });

  return {
    summary: {
      totalDonors,
      availableDonors,
      busyDonors,
      totalRequests,
      pendingRequests,
      approvedRequests,
      fulfilledRequests,
      rejectedRequests,
      cancelledRequests,
      criticalRequests,
      fulfillmentRate,
      avgResponseTimeMinutes,
      totalHospitals: hospitals.length,
      totalUnitsAvailable
    },
    groupWiseStock,
    urgencyCounts,
    statusCounts,
    bloodGroupStats,
    recentCritical: requests.filter(r => r.urgency === 'CRITICAL' && r.status === 'PENDING').slice(0, 5)
  };
}

// Dedicated High-Fidelity Analytics for Admin Dashboard
async function getDetailedAnalytics(timeframe = 'monthly') {
  const base = await getPlatformAnalytics();
  const hospitals = await getAllHospitals();
  const requests = await getAllRequests();
  const donors = await getAllDonors();
  const donations = await getDonations();

  // 1. Blood Usage Graph over time (line/bar format with timeframes)
  // Group usage transactions or fulfilled requests by date label
  const usageByGroup = {
    'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
  };

  const usageTimelineMap = {};

  // Gather from donations table or fulfilled requests
  const usageEvents = donations.filter(d => d.type === 'USAGE');
  if (usageEvents.length > 0) {
    usageEvents.forEach(e => {
      const d = new Date(e.date || e.createdAt);
      let label = d.toLocaleDateString();
      if (timeframe === 'monthly') {
        label = d.toLocaleString('default', { month: 'short' });
      } else if (timeframe === 'yearly') {
        label = String(d.getFullYear());
      } else if (timeframe === 'daily') {
        label = d.toLocaleDateString('default', { month: 'numeric', day: 'numeric' });
      }

      if (!usageTimelineMap[label]) {
        usageTimelineMap[label] = { date: label, totalUnits: 0, 'O-': 0, 'O+': 0, 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0 };
      }
      usageTimelineMap[label].totalUnits += (e.units || 1);
      if (usageTimelineMap[label][e.bloodGroup] !== undefined) {
        usageTimelineMap[label][e.bloodGroup] += (e.units || 1);
      }
      if (usageByGroup[e.bloodGroup] !== undefined) {
        usageByGroup[e.bloodGroup] += (e.units || 1);
      }
    });
  }

  // Also include fulfilled requests in usage calculations
  requests.filter(r => r.status === 'FULFILLED').forEach(r => {
    const d = new Date(r.fulfilledAt || r.updatedAt || r.createdAt);
    let label = d.toLocaleDateString();
    if (timeframe === 'monthly') {
      label = d.toLocaleString('default', { month: 'short' });
    } else if (timeframe === 'yearly') {
      label = String(d.getFullYear());
    } else if (timeframe === 'daily') {
      label = d.toLocaleDateString('default', { month: 'numeric', day: 'numeric' });
    }

    if (!usageTimelineMap[label]) {
      usageTimelineMap[label] = { date: label, totalUnits: 0, 'O-': 0, 'O+': 0, 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0 };
    }
    usageTimelineMap[label].totalUnits += (r.unitsRequired || 1);
    if (usageTimelineMap[label][r.bloodGroup] !== undefined) {
      usageTimelineMap[label][r.bloodGroup] += (r.unitsRequired || 1);
    }
    if (usageByGroup[r.bloodGroup] !== undefined) {
      usageByGroup[r.bloodGroup] += (r.unitsRequired || 1);
    }
  });

  const bloodUsageTimeline = Object.values(usageTimelineMap);
  if (bloodUsageTimeline.length === 0) {
    // Generate at least current period baseline if empty
    bloodUsageTimeline.push({
      date: timeframe === 'monthly' ? 'Nov' : 'Today',
      totalUnits: 3,
      'O-': 1, 'O+': 0, 'A+': 1, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 1
    });
  }

  // 2. Hospital Requirements Graph
  const hospitalRequirements = hospitals.map(h => {
    const reqUnits = Number(h.requiredUnits) || 0;
    const reqGroups = h.requiredBloodGroups || [];
    const totalStock = Object.values(h.bloodInventory || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const criticalShortage = Object.entries(h.bloodInventory || {}).some(([bg, count]) => count < 3);

    return {
      hospitalId: h.hospitalId || h._id,
      name: h.name,
      city: h.city,
      requiredUnits: reqUnits,
      requiredBloodGroups: reqGroups.join(', ') || 'General',
      totalStock,
      hasCriticalShortage: criticalShortage
    };
  });

  // 3. Blood Request Status Comparison (Pending, Approved, Fulfilled, Rejected)
  const requestStatusComparison = [
    { name: 'Pending', count: base.statusCounts.PENDING, fill: '#f59e0b' },
    { name: 'Approved', count: base.statusCounts.APPROVED, fill: '#2563eb' },
    { name: 'Fulfilled', count: base.statusCounts.FULFILLED, fill: '#16a34a' },
    { name: 'Rejected', count: base.statusCounts.REJECTED, fill: '#dc2626' }
  ];

  // 4. Requests Group-wise breakdown
  const requestByBloodGroup = base.bloodGroupStats.map(s => ({
    bloodGroup: s.bloodGroup,
    requests: s.totalRequests,
    unitsNeeded: s.unitsNeeded,
    stock: s.stockUnits
  }));

  // 5. Donor Growth over time
  const donorGrowthMap = {};
  donors.forEach(d => {
    const dt = new Date(d.createdAt || Date.now());
    const m = dt.toLocaleString('default', { month: 'short' });
    donorGrowthMap[m] = (donorGrowthMap[m] || 0) + 1;
  });
  const donorGrowth = Object.entries(donorGrowthMap).map(([month, count]) => ({
    month,
    donors: count
  }));

  return {
    ...base,
    timeframe,
    bloodUsageTimeline,
    usageByGroup,
    hospitalRequirements,
    requestStatusComparison,
    requestByBloodGroup,
    donorGrowth
  };
}

// Reset and re-seed platform data
async function resetAndSeedDatabase() {
  if (isDbReady()) {
    await Donor.deleteMany({});
    await BloodRequest.deleteMany({});
    await Hospital.deleteMany({});
    await Donation.deleteMany({});
    await BloodUsage.deleteMany({});

    await Donor.insertMany(initialDonors);
    await BloodRequest.insertMany(initialRequests);
    await Hospital.insertMany(initialHospitals);
    await Donation.insertMany(initialDonations);
    await BloodUsage.insertMany(initialUsages);

    const { ensureAdminUser } = require('../controllers/authController');
    await ensureAdminUser();

    return { success: true, message: 'MongoDB Atlas collections reset and re-seeded with realistic data.' };
  } else {
    memoryDonors = initialDonors.map((d, i) => ({
      ...d,
      _id: `mem_donor_${i + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    memoryRequests = initialRequests.map((r, i) => ({
      ...r,
      _id: `mem_req_${i + 1}`,
      createdAt: r.createdAt || new Date(),
      updatedAt: new Date()
    }));
    memoryHospitals = initialHospitals.map((h, i) => ({
      ...h,
      _id: `mem_hosp_${i + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    memoryDonations = initialDonations.map((dn, i) => ({
      ...dn,
      _id: `mem_donation_${i + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    return { success: true, message: 'In-Memory store reset and re-seeded with realistic data.' };
  }
}

module.exports = {
  seedMongoIfEmpty,
  isDbReady,
  // Donors
  getAllDonors,
  getDonorById,
  getDonorByUserId,
  createDonor,
  updateDonor,
  deleteDonor,
  toggleDonorAvailability,
  // Requests
  getAllRequests,
  getRequestById,
  createBloodRequest,
  updateBloodRequest,
  updateRequestStatus,
  deleteBloodRequest,
  findMatchedDonorsForRequest,
  // Hospitals
  getAllHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
  updateHospitalInventory,
  recordBloodUsage,
  // Donations
  getDonations,
  createDonation,
  // Analytics
  getPlatformAnalytics,
  getDetailedAnalytics,
  resetAndSeedDatabase
};
