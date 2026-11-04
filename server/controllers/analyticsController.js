const analyticsService = require('../services/analyticsService');
const dataStore = require('../utils/dataStore');
const { getDbStatus } = require('../config/db');

// GET /api/analytics (Legacy platform analytics)
const getAnalytics = async (req, res) => {
  try {
    const analytics = await dataStore.getPlatformAnalytics();
    const dbStatus = getDbStatus();
    res.json({
      success: true,
      dbStatus,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/detailed?timeframe=monthly
const getDetailedAnalytics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'monthly';
    const detailed = await dataStore.getDetailedAnalytics(timeframe);
    const dbStatus = getDbStatus();
    res.json({
      success: true,
      dbStatus,
      data: detailed
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/overview
const getOverview = async (req, res) => {
  try {
    const overview = await analyticsService.getOverviewAnalytics();
    res.json({
      success: true,
      message: 'Overview analytics calculated successfully from MongoDB Atlas',
      data: overview,
      // Direct root properties for frontend schema compatibility
      ...overview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/blood-usage
const getBloodUsage = async (req, res) => {
  try {
    const filters = {
      timeframe: req.query.timeframe || 'monthly',
      bloodGroup: req.query.bloodGroup,
      hospitalId: req.query.hospitalId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await analyticsService.getBloodUsageAnalytics(filters);
    res.json({
      success: true,
      message: 'Blood usage analytics aggregated successfully from database',
      data: result,
      records: result.records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/blood-requests
const getBloodRequests = async (req, res) => {
  try {
    const filters = {
      timeframe: req.query.timeframe || 'monthly',
      bloodGroup: req.query.bloodGroup,
      hospitalId: req.query.hospitalId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await analyticsService.getBloodRequestAnalytics(filters);
    res.json({
      success: true,
      message: 'Blood request analytics aggregated successfully from database',
      data: result,
      records: result.records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/hospital-usage
const getHospitalUsage = async (req, res) => {
  try {
    const filters = {
      timeframe: req.query.timeframe || 'monthly',
      hospitalId: req.query.hospitalId,
      bloodGroup: req.query.bloodGroup
    };

    const result = await analyticsService.getHospitalUsageAnalytics(filters);
    res.json({
      success: true,
      message: 'Hospital-wise blood usage and demand analytics calculated from database',
      data: result,
      hospitals: result.hospitals,
      requirements: result.requirements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/analytics/issue-blood (Manual or verified blood issue to patient/hospital)
const issueBlood = async (req, res) => {
  try {
    const { hospitalId, hospitalName, bloodGroup, units, requestId, patientName, notes } = req.body;
    if (!bloodGroup || !units) {
      return res.status(400).json({ success: false, message: 'Blood group and units are required' });
    }

    const issuedBy = req.user ? req.user.id : null;
    const result = await analyticsService.issueBloodAndRecordUsage({
      hospitalId,
      hospitalName,
      bloodGroup,
      units,
      requestId,
      patientName,
      issuedBy,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Blood units successfully issued and inventory updated',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/analytics/add-stock (Increase inventory on verified donation or stock addition)
const addStock = async (req, res) => {
  try {
    const { hospitalId, hospitalName, bloodGroup, units, changeType, notes } = req.body;
    if (!bloodGroup || !units) {
      return res.status(400).json({ success: false, message: 'Blood group and units are required' });
    }

    const performedBy = req.user ? (req.user.name || req.user.email) : 'ADMIN';
    const result = await analyticsService.addBloodToInventory({
      hospitalId,
      hospitalName,
      bloodGroup,
      units,
      changeType: changeType || 'STOCK_ADDITION',
      performedBy,
      notes
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Blood stock added successfully to hospital inventory',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/analytics/seed
const seedDatabase = async (req, res) => {
  try {
    const result = await dataStore.resetAndSeedDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/health
const getHealth = (req, res) => {
  res.json({
    status: 'ONLINE',
    platform: 'BloodConnect Emergency Network',
    timestamp: new Date().toISOString(),
    db: getDbStatus()
  });
};

module.exports = {
  getAnalytics,
  getDetailedAnalytics,
  getOverview,
  getBloodUsage,
  getBloodRequests,
  getHospitalUsage,
  issueBlood,
  addStock,
  seedDatabase,
  getHealth
};
