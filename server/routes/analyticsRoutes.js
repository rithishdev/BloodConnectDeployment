const express = require('express');
const router = express.Router();
const analyticsCtrl = require('../controllers/analyticsController');
const { verifyToken, authorizeRoles, optionalAuth } = require('../middleware/auth');

// Public / Overview Analytics
router.get('/overview', optionalAuth, analyticsCtrl.getOverview);

// Blood Usage Analytics
router.get('/blood-usage', optionalAuth, analyticsCtrl.getBloodUsage);

// Blood Request Analytics
router.get('/blood-requests', optionalAuth, analyticsCtrl.getBloodRequests);

// Hospital-wise Usage Analytics
router.get('/hospital-usage', optionalAuth, analyticsCtrl.getHospitalUsage);

// Issue blood & record usage (Admin or hospital authorized)
router.post('/issue-blood', verifyToken, authorizeRoles('admin'), analyticsCtrl.issueBlood);

// Add blood to hospital inventory
router.post('/add-stock', verifyToken, authorizeRoles('admin'), analyticsCtrl.addStock);

// General platform analytics (Legacy / compatibility)
router.get('/', optionalAuth, analyticsCtrl.getAnalytics);
router.get('/detailed', optionalAuth, analyticsCtrl.getDetailedAnalytics);

// Maintenance & Health
router.post('/seed', optionalAuth, analyticsCtrl.seedDatabase);
router.get('/health', analyticsCtrl.getHealth);

module.exports = router;
