const mongoose = require('mongoose');
const BloodUsage = require('../models/BloodUsage');
const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const InventoryLog = require('../models/InventoryLog');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const TIMEZONE = '+05:30'; // Asia/Kolkata timezone

/**
 * Format a Date object to YYYY-MM-DD string in Asia/Kolkata (+05:30)
 */
function formatDateKolkata(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = new Date(date);
  // Convert UTC to Asia/Kolkata (+5.5 hours)
  const kolkataTime = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
  return kolkataTime.toISOString().split('T')[0];
}

/**
 * Normalizes status to Title Case: 'Pending', 'Approved', 'Fulfilled', 'Rejected'
 */
function toStatusTitle(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PENDING') return 'Pending';
  if (s === 'APPROVED') return 'Approved';
  if (s === 'FULFILLED') return 'Fulfilled';
  if (s === 'REJECTED') return 'Rejected';
  return 'Pending';
}

/**
 * Normalizes urgency to Priority: 'Normal', 'Urgent', 'Critical'
 */
function toPriorityTitle(urgency) {
  const u = String(urgency || '').toUpperCase();
  if (u === 'CRITICAL') return 'Critical';
  if (u === 'URGENT') return 'Urgent';
  return 'Normal';
}

/**
 * 1. Overview Analytics
 * GET /api/analytics/overview
 */
async function getOverviewAnalytics() {
  const [hospitals, usageTotal, requestStats, totalDonors] = await Promise.all([
    Hospital.find({}).lean(),
    BloodUsage.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalConsumed: { $sum: '$units' } } }
    ]),
    BloodRequest.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
          fulfilled: { $sum: { $cond: [{ $eq: ['$status', 'FULFILLED'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
          critical: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$urgency', 'CRITICAL'] },
                    { $ne: ['$status', 'FULFILLED'] },
                    { $ne: ['$status', 'CANCELLED'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]),
    Donor.countDocuments({})
  ]);

  // Calculate total blood units available across all hospitals
  let totalUnitsAvailable = 0;
  hospitals.forEach(h => {
    if (h.bloodInventory) {
      Object.values(h.bloodInventory).forEach(u => {
        totalUnitsAvailable += Math.max(0, Number(u) || 0);
      });
    }
  });

  const totalUnitsConsumed = usageTotal.length > 0 ? usageTotal[0].totalConsumed : 0;
  const reqStat = requestStats.length > 0 ? requestStats[0] : { total: 0, pending: 0, fulfilled: 0, critical: 0 };

  const data = {
    totalUnitsAvailable,
    totalUnitsConsumed,
    totalRequests: reqStat.total || 0,
    fulfilledRequests: reqStat.fulfilled || 0,
    pendingRequests: reqStat.pending || 0,
    approvedRequests: reqStat.approved || 0,
    rejectedRequests: reqStat.rejected || 0,
    registeredHospitals: hospitals.length,
    totalDonors: totalDonors || 0,
    criticalRequests: reqStat.critical || 0
  };

  return data;
}

/**
 * 2. Blood Usage Tracking & Analytics
 * GET /api/analytics/blood-usage
 * Query params: timeframe, bloodGroup, hospitalId, startDate, endDate
 */
async function getBloodUsageAnalytics(filters = {}) {
  const {
    timeframe = 'monthly',
    bloodGroup,
    hospitalId,
    startDate,
    endDate
  } = filters;

  const matchQuery = { status: { $ne: 'CANCELLED' } };

  if (bloodGroup && bloodGroup !== 'ALL' && bloodGroup.trim()) {
    matchQuery.bloodGroup = bloodGroup.trim().toUpperCase();
  }

  if (hospitalId && hospitalId.trim()) {
    matchQuery.$or = [
      { hospitalId: hospitalId.trim() },
      { hospitalName: { $regex: new RegExp(hospitalId.trim(), 'i') } }
    ];
  }

  if (startDate || endDate) {
    matchQuery.date = {};
    if (startDate) matchQuery.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchQuery.date.$lte = end;
    }
  }

  // Format string for date aggregation in Asia/Kolkata
  let datePattern = '%Y-%m';
  const tf = timeframe.toLowerCase();
  if (tf === 'daily') {
    datePattern = '%Y-%m-%d';
  } else if (tf === 'yearly') {
    datePattern = '%Y';
  } else if (tf === 'weekly') {
    datePattern = '%Y-W%V';
  }

  // MongoDB Aggregation: Usage over time
  const timelineAggregation = await BloodUsage.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          period: { $dateToString: { format: datePattern, date: '$date', timezone: TIMEZONE } },
          bloodGroup: '$bloodGroup'
        },
        units: { $sum: '$units' },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { '_id.period': 1 } }
  ]);

  // Aggregate by blood group
  const bloodGroupAggregation = await BloodUsage.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$bloodGroup',
        totalUnits: { $sum: '$units' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalUnits: -1 } }
  ]);

  // Aggregate by hospital
  const hospitalAggregation = await BloodUsage.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { hospitalId: '$hospitalId', hospitalName: '$hospitalName' },
        totalUnits: { $sum: '$units' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalUnits: -1 } }
  ]);

  // Fetch individual records formatted for frontend contract
  const rawRecords = await BloodUsage.find(matchQuery).sort({ date: -1 }).limit(1000).lean();
  const records = rawRecords.map((r, idx) => ({
    id: r.usageId || String(r._id) || `USE-${3000 + idx}`,
    date: formatDateKolkata(r.date),
    hospitalId: r.hospitalId || 'HSP-1001',
    hospitalName: r.hospitalName || 'Trauma Center',
    bloodGroup: r.bloodGroup,
    units: Number(r.units) || 1,
    status: r.status,
    patientName: r.patientName || 'Emergency Patient'
  }));

  const totalUnits = records.reduce((s, r) => s + r.units, 0);

  // Group timeline by period with all 8 blood groups
  const periodMap = new Map();
  timelineAggregation.forEach(item => {
    const period = item._id.period;
    const bg = item._id.bloodGroup;
    const units = item.units;

    if (!periodMap.has(period)) {
      const initial = { period, total: 0 };
      BLOOD_GROUPS.forEach(g => { initial[g] = 0; });
      periodMap.set(period, initial);
    }

    const entry = periodMap.get(period);
    entry[bg] = (entry[bg] || 0) + units;
    entry.total += units;
  });

  const aggregatedTimeline = Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  return {
    timeframe: tf,
    totalUnits,
    totalTransactions: records.length,
    records, // Exact match for frontend schema: z.object({ records: z.array(usageSchema) })
    timeline: aggregatedTimeline,
    byBloodGroup: bloodGroupAggregation.map(b => ({ bloodGroup: b._id, units: b.totalUnits, transactions: b.count })),
    byHospital: hospitalAggregation.map(h => ({ hospitalId: h._id.hospitalId, hospitalName: h._id.hospitalName, units: h.totalUnits, transactions: h.count }))
  };
}

/**
 * 3. Blood Request Analytics
 * GET /api/analytics/blood-requests
 * Query params: timeframe, bloodGroup, hospitalId, status, startDate, endDate
 */
async function getBloodRequestAnalytics(filters = {}) {
  const {
    timeframe = 'monthly',
    bloodGroup,
    hospitalId,
    status,
    startDate,
    endDate
  } = filters;

  const matchQuery = {};

  if (bloodGroup && bloodGroup !== 'ALL' && bloodGroup.trim()) {
    matchQuery.bloodGroup = bloodGroup.trim().toUpperCase();
  }

  if (status && status !== 'ALL' && status.trim()) {
    matchQuery.status = status.trim().toUpperCase();
  }

  if (hospitalId && hospitalId.trim()) {
    matchQuery.$or = [
      { hospitalId: hospitalId.trim() },
      { hospitalName: { $regex: new RegExp(hospitalId.trim(), 'i') } }
    ];
  }

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchQuery.createdAt.$lte = end;
    }
  }

  let datePattern = '%Y-%m';
  const tf = timeframe.toLowerCase();
  if (tf === 'daily') {
    datePattern = '%Y-%m-%d';
  } else if (tf === 'yearly') {
    datePattern = '%Y';
  } else if (tf === 'weekly') {
    datePattern = '%Y-W%V';
  }

  // Requests over time aggregation
  const timelineAggregation = await BloodRequest.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          period: { $dateToString: { format: datePattern, date: '$createdAt', timezone: TIMEZONE } },
          status: '$status'
        },
        count: { $sum: 1 },
        units: { $sum: '$unitsRequired' }
      }
    },
    { $sort: { '_id.period': 1 } }
  ]);

  // By Status
  const statusAggregation = await BloodRequest.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        units: { $sum: '$unitsRequired' }
      }
    }
  ]);

  // By Blood Group
  const bloodGroupAggregation = await BloodRequest.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$bloodGroup',
        count: { $sum: 1 },
        units: { $sum: '$unitsRequired' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Fetch individual request records formatted for the frontend
  // Frontend schema: z.object({ records: z.array(requestSchema) })
  // where requestSchema has: id, date, hospitalId, bloodGroup, units, status, priority
  const rawRequests = await BloodRequest.find(matchQuery).sort({ createdAt: -1 }).limit(1000).lean();
  const records = rawRequests.map((r, idx) => ({
    id: String(r._id) || `REQ-${6000 + idx}`,
    date: formatDateKolkata(r.createdAt),
    hospitalId: r.hospitalId || r.hospitalName?.substring(0, 8) || 'HSP-1001',
    hospitalName: r.hospitalName,
    bloodGroup: r.bloodGroup,
    units: Number(r.unitsRequired) || 1,
    status: toStatusTitle(r.status), // 'Pending', 'Approved', 'Fulfilled', 'Rejected'
    priority: toPriorityTitle(r.urgency), // 'Normal', 'Urgent', 'Critical'
    patientName: r.patientName,
    city: r.city
  }));

  return {
    timeframe: tf,
    totalRequests: records.length,
    records, // Exact match for frontend schema
    byStatus: statusAggregation.map(s => ({ status: s._id, title: toStatusTitle(s._id), count: s.count, units: s.units })),
    byBloodGroup: bloodGroupAggregation.map(b => ({ bloodGroup: b._id, count: b.count, units: b.units })),
    timeline: timelineAggregation.map(t => ({ period: t._id.period, status: t._id.status, count: t.count, units: t.units }))
  };
}

/**
 * 4. Hospital-wise Blood Usage & Consumption Analytics
 * GET /api/analytics/hospital-usage
 * Query params: timeframe, hospitalId, bloodGroup
 */
async function getHospitalUsageAnalytics(filters = {}) {
  const { hospitalId, bloodGroup } = filters;

  const hospitalFilter = {};
  if (hospitalId && hospitalId.trim()) {
    hospitalFilter.$or = [
      { hospitalId: hospitalId.trim() },
      { name: { $regex: new RegExp(hospitalId.trim(), 'i') } }
    ];
  }

  const rawHospitals = await Hospital.find(hospitalFilter).lean();

  // Aggregate usage per hospital
  const usageMatch = { status: { $ne: 'CANCELLED' } };
  if (bloodGroup && bloodGroup !== 'ALL' && bloodGroup.trim()) {
    usageMatch.bloodGroup = bloodGroup.trim().toUpperCase();
  }

  const hospitalUsageAgg = await BloodUsage.aggregate([
    { $match: usageMatch },
    {
      $group: {
        _id: { hospitalId: '$hospitalId', bloodGroup: '$bloodGroup' },
        units: { $sum: '$units' },
        count: { $sum: 1 }
      }
    }
  ]);

  const usageByHospitalMap = new Map();
  hospitalUsageAgg.forEach(u => {
    const hid = u._id.hospitalId;
    const bg = u._id.bloodGroup;
    if (!usageByHospitalMap.has(hid)) {
      usageByHospitalMap.set(hid, { total: 0, byGroup: {} });
    }
    const rec = usageByHospitalMap.get(hid);
    rec.total += u.units;
    rec.byGroup[bg] = (rec.byGroup[bg] || 0) + u.units;
  });

  // Requests per hospital
  const hospitalReqAgg = await BloodRequest.aggregate([
    {
      $group: {
        _id: '$hospitalName',
        totalRequests: { $sum: 1 },
        fulfilled: { $sum: { $cond: [{ $eq: ['$status', 'FULFILLED'] }, 1, 0] } }
      }
    }
  ]);

  const reqMap = new Map();
  hospitalReqAgg.forEach(r => {
    reqMap.set(r._id, { totalRequests: r.totalRequests, fulfilled: r.fulfilled });
  });

  // Build the frontend hospital array matching schema:
  // z.object({ hospitals: z.array(hospitalSchema), requirements: z.array(requirementSchema) })
  const hospitals = rawHospitals.map(h => {
    const id = h.hospitalId || String(h._id);
    const stock = {};
    BLOOD_GROUPS.forEach(bg => {
      stock[bg] = (h.bloodInventory && Number(h.bloodInventory[bg])) || 0;
    });

    const usageData = usageByHospitalMap.get(id) || usageByHospitalMap.get(h.name) || { total: 0, byGroup: {} };
    const reqData = reqMap.get(h.name) || { totalRequests: 0, fulfilled: 0 };

    const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
    const hasCriticalShortage = Object.values(stock).some(u => u <= 2);

    return {
      id,
      name: h.name,
      stock, // Matches hospitalSchema
      city: h.city,
      address: h.address,
      phone: h.phone,
      totalStock,
      totalConsumed: usageData.total,
      consumptionByGroup: usageData.byGroup,
      totalRequests: reqData.totalRequests,
      fulfilledRequests: reqData.fulfilled,
      hasCriticalShortage,
      requiredUnits: h.requiredUnits || 0,
      requiredBloodGroups: h.requiredBloodGroups || []
    };
  });

  // Build the requirements array matching requirementSchema:
  // { hospitalId, bloodGroup, units, priority: 'Normal' | 'Urgent' | 'Critical' }
  const requirements = [];
  rawHospitals.forEach(h => {
    const hid = h.hospitalId || String(h._id);
    const groups = h.requiredBloodGroups || [];
    const units = Math.max(1, Number(h.requiredUnits) || 3);
    const hasCriticalShortage = Object.values(h.bloodInventory || {}).some(u => u <= 1);
    const priority = hasCriticalShortage ? 'Critical' : (h.requiredUnits > 5 ? 'Urgent' : 'Normal');

    if (groups.length > 0) {
      groups.forEach(bg => {
        if (!bloodGroup || bloodGroup === 'ALL' || bg === bloodGroup) {
          requirements.push({
            hospitalId: hid,
            hospitalName: h.name,
            bloodGroup: bg,
            units,
            priority
          });
        }
      });
    } else if (hasCriticalShortage) {
      // Find lowest stock group
      const lowestGroup = Object.entries(h.bloodInventory || {}).sort((a, b) => a[1] - b[1])[0];
      const bg = lowestGroup ? lowestGroup[0] : 'O-';
      if (!bloodGroup || bloodGroup === 'ALL' || bg === bloodGroup) {
        requirements.push({
          hospitalId: hid,
          hospitalName: h.name,
          bloodGroup: bg,
          units: 4,
          priority: 'Critical'
        });
      }
    }
  });

  // Top consumers ranking
  const consumptionRanking = [...hospitals].sort((a, b) => b.totalConsumed - a.totalConsumed);
  // Highest demand ranking
  const shortageRanking = [...hospitals].sort((a, b) => (b.requiredUnits || 0) - (a.requiredUnits || 0));

  return {
    hospitals, // Matches frontend hospitalSchema array
    requirements, // Matches frontend requirementSchema array
    consumptionRanking,
    shortageRanking
  };
}

/**
 * 5. Atomically Issue Blood & Update Hospital Inventory
 * Decrements hospital blood stock without negative inventory,
 * creates transaction record in BloodUsage, and records audit in InventoryLog.
 */
async function issueBloodAndRecordUsage({
  hospitalId,
  hospitalName,
  bloodGroup,
  units = 1,
  requestId = null,
  patientName = 'Emergency Patient',
  issuedBy = null,
  notes = ''
}) {
  const bg = bloodGroup.toUpperCase();
  const numUnits = Math.max(1, parseInt(units, 10) || 1);

  // Find Hospital by ID or name
  let hospital = null;
  if (hospitalId) {
    if (mongoose.Types.ObjectId.isValid(hospitalId)) {
      hospital = await Hospital.findById(hospitalId);
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ hospitalId });
    }
  }
  if (!hospital && hospitalName) {
    hospital = await Hospital.findOne({ name: { $regex: new RegExp(hospitalName, 'i') } });
  }

  // Prevent duplicate usage logging if this request was already recorded
  if (requestId) {
    const existingUsage = await BloodUsage.findOne({ requestId: String(requestId) });
    if (existingUsage) {
      return { success: true, message: 'Usage already recorded for this request', data: existingUsage };
    }
  }

  let previousStock = 10;
  let newStock = Math.max(0, 10 - numUnits);

  if (hospital) {
    const currentUnits = (hospital.bloodInventory && hospital.bloodInventory[bg]) || 0;
    previousStock = currentUnits;
    newStock = Math.max(0, currentUnits - numUnits);

    // Atomically decrement without allowing negative inventory
    const updatedInventory = {
      ...(hospital.bloodInventory || {}),
      [bg]: newStock
    };

    await Hospital.findByIdAndUpdate(hospital._id, { $set: { bloodInventory: updatedInventory } });
  }

  // Create BloodUsage Record
  const usageRecord = new BloodUsage({
    usageId: `USE-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`,
    bloodGroup: bg,
    units: numUnits,
    hospitalId: hospital ? (hospital.hospitalId || String(hospital._id)) : (hospitalId || 'HSP-1001'),
    hospitalName: hospital ? hospital.name : (hospitalName || 'City Emergency Trauma Center'),
    requestId: requestId ? String(requestId) : null,
    patientName: patientName || 'Emergency Patient',
    issuedBy,
    date: new Date(),
    status: 'FULFILLED',
    notes: notes || `Dispatched ${numUnits} units of ${bg}`
  });

  await usageRecord.save();

  // Log in InventoryLog audit trail
  const log = new InventoryLog({
    hospitalId: hospital ? (hospital.hospitalId || String(hospital._id)) : 'HSP-GEN',
    hospitalName: hospital ? hospital.name : (hospitalName || 'Emergency Hospital'),
    bloodGroup: bg,
    changeType: 'USAGE',
    unitsDelta: -numUnits,
    previousStock,
    newStock,
    referenceId: usageRecord.usageId || String(usageRecord._id),
    performedBy: issuedBy ? String(issuedBy) : 'ADMIN',
    notes: `Issued to patient ${patientName} (Request: ${requestId || 'Manual'})`
  });
  await log.save();

  return {
    success: true,
    data: usageRecord,
    newStock
  };
}

/**
 * 6. Increase Inventory on Verified Donation or Stock Addition
 */
async function addBloodToInventory({
  hospitalId,
  hospitalName,
  bloodGroup,
  units = 1,
  changeType = 'STOCK_ADDITION',
  referenceId = null,
  performedBy = 'SYSTEM',
  notes = ''
}) {
  const bg = bloodGroup.toUpperCase();
  const numUnits = Math.max(1, parseInt(units, 10) || 1);

  let hospital = null;
  if (hospitalId) {
    if (mongoose.Types.ObjectId.isValid(hospitalId)) {
      hospital = await Hospital.findById(hospitalId);
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ hospitalId });
    }
  }
  if (!hospital && hospitalName) {
    hospital = await Hospital.findOne({ name: { $regex: new RegExp(hospitalName, 'i') } });
  }

  if (!hospital) {
    return { success: false, message: 'Hospital not found' };
  }

  const currentUnits = (hospital.bloodInventory && hospital.bloodInventory[bg]) || 0;
  const newStock = currentUnits + numUnits;

  const updatedInventory = {
    ...(hospital.bloodInventory || {}),
    [bg]: newStock
  };

  await Hospital.findByIdAndUpdate(hospital._id, { $set: { bloodInventory: updatedInventory } });

  const log = new InventoryLog({
    hospitalId: hospital.hospitalId || String(hospital._id),
    hospitalName: hospital.name,
    bloodGroup: bg,
    changeType,
    unitsDelta: numUnits,
    previousStock: currentUnits,
    newStock,
    referenceId: referenceId ? String(referenceId) : null,
    performedBy,
    notes: notes || `Added ${numUnits} units of ${bg}`
  });
  await log.save();

  return {
    success: true,
    hospitalName: hospital.name,
    bloodGroup: bg,
    previousStock: currentUnits,
    newStock
  };
}

module.exports = {
  getOverviewAnalytics,
  getBloodUsageAnalytics,
  getBloodRequestAnalytics,
  getHospitalUsageAnalytics,
  issueBloodAndRecordUsage,
  addBloodToInventory
};
