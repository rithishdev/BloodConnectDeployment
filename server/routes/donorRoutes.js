const express = require('express');
const router = express.Router();
const donorCtrl = require('../controllers/donorController');
const { verifyToken, authorizeRoles, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, donorCtrl.getDonors);
router.post('/', donorCtrl.createDonor);
router.get('/:id', donorCtrl.getDonorById);
router.get('/:id/matching-requirements', donorCtrl.getMatchingRequirements);
router.get('/:id/donations', donorCtrl.getDonorDonationHistory);
router.put('/:id', verifyToken, donorCtrl.updateDonor);
router.patch('/:id/availability', verifyToken, donorCtrl.toggleAvailability);
router.patch('/:id/medical-status', optionalAuth, donorCtrl.updateMedicalStatus);
router.delete('/:id', verifyToken, authorizeRoles('admin'), donorCtrl.deleteDonor);

module.exports = router;
