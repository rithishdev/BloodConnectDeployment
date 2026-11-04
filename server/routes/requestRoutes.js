const express = require('express');
const router = express.Router();
const requestCtrl = require('../controllers/requestController');
const { verifyToken, authorizeRoles, optionalAuth } = require('../middleware/auth');

router.get('/', requestCtrl.getRequests);
router.get('/my-requests', verifyToken, requestCtrl.getMyRequests);
router.post('/', optionalAuth, requestCtrl.createRequest);
router.get('/:id', requestCtrl.getRequestById);
router.put('/:id', verifyToken, authorizeRoles('admin'), requestCtrl.updateRequest);
router.patch('/:id/status', optionalAuth, requestCtrl.updateRequestStatus);
router.post('/:id/approve', verifyToken, authorizeRoles('admin'), requestCtrl.approveRequest);
router.post('/:id/reject', verifyToken, authorizeRoles('admin'), requestCtrl.rejectRequest);
router.patch('/:id/fulfill', optionalAuth, requestCtrl.fulfillRequest);
router.post('/:id/fulfill', optionalAuth, requestCtrl.fulfillRequest);
router.get('/:id/match-donors', requestCtrl.getMatchedDonors);
router.post('/:id/notify-donors', requestCtrl.notifyDonors);
router.delete('/:id', verifyToken, authorizeRoles('admin'), requestCtrl.deleteRequest);

module.exports = router;
