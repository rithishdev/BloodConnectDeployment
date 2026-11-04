const express = require('express');
const router = express.Router();
const hospCtrl = require('../controllers/hospitalController');
const { verifyToken, authorizeRoles, optionalAuth } = require('../middleware/auth');

// Public endpoints
router.get('/', hospCtrl.getHospitals);
router.get('/:id', hospCtrl.getHospitalById);

// Admin / Staff operations (Protected by JWT)
router.post('/', verifyToken, authorizeRoles('admin'), hospCtrl.createHospital);
router.put('/:id', verifyToken, authorizeRoles('admin'), hospCtrl.updateHospital);
router.delete('/:id', verifyToken, authorizeRoles('admin'), hospCtrl.deleteHospital);
router.patch('/:id/inventory', verifyToken, authorizeRoles('admin'), hospCtrl.updateInventory);
router.patch('/:id/requirements', verifyToken, authorizeRoles('admin'), hospCtrl.updateRequirements);

module.exports = router;
