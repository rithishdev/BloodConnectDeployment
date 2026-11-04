const dataStore = require('../utils/dataStore');

// GET /api/requests
const getRequests = async (req, res) => {
  try {
    const requests = await dataStore.getAllRequests(req.query);
    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/requests/my-requests (Authenticated patient/user)
const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const requests = await dataStore.getAllRequests();
    const userRequests = requests.filter(r =>
      (r.userId && String(r.userId) === String(userId)) ||
      (r.requesterEmail && r.requesterEmail.toLowerCase() === userEmail.toLowerCase())
    );

    res.json({
      success: true,
      count: userRequests.length,
      data: userRequests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/requests/:id
const getRequestById = async (req, res) => {
  try {
    const bloodReq = await dataStore.getRequestById(req.params.id);
    if (!bloodReq) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }
    res.json({ success: true, data: bloodReq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/requests
const createRequest = async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      unitsRequired,
      hospitalName,
      requesterName,
      requesterPhone,
      city,
      age,
      gender,
      doctorName,
      requiredDate,
      urgency,
      notes,
      hospitalAddress
    } = req.body;

    if (!patientName || !bloodGroup || !hospitalName || !requesterName || !requesterPhone || !city) {
      return res.status(400).json({
        success: false,
        message: 'Patient name, blood group, hospital, requester name, contact number, and city are required.'
      });
    }

    const payload = {
      ...req.body,
      userId: req.user ? req.user.id : null,
      requesterEmail: req.body.requesterEmail || (req.user ? req.user.email : '')
    };

    const bloodReq = await dataStore.createBloodRequest(payload);

    // Socket.io Real-time Emergency Broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-request-created', {
        id: bloodReq._id,
        patientName: bloodReq.patientName,
        bloodGroup: bloodReq.bloodGroup,
        unitsRequired: bloodReq.unitsRequired,
        hospitalName: bloodReq.hospitalName,
        city: bloodReq.city,
        urgency: bloodReq.urgency,
        status: bloodReq.status,
        createdAt: bloodReq.createdAt,
        matchedCount: bloodReq.matchedDonors?.length || 0
      });
    }

    res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully and queued for review/dispatch!',
      data: bloodReq
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/requests/:id
const updateRequest = async (req, res) => {
  try {
    const updated = await dataStore.updateBloodRequest(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }
    res.json({ success: true, message: 'Blood request updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/requests/:id/status
const updateRequestStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updated = await dataStore.updateRequestStatus(req.params.id, status, reason);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    const io = req.app && typeof req.app.get === 'function' ? req.app.get('io') : null;
    if (io) {
      io.emit('request-status-updated', {
        id: updated._id,
        patientName: updated.patientName,
        status: updated.status,
        updatedAt: updated.updatedAt
      });
    }

    res.json({
      success: true,
      message: `Request status updated to ${updated.status}`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/requests/:id/approve (Admin)
const approveRequest = async (req, res) => {
  req.body = { ...req.body, status: 'APPROVED' };
  return updateRequestStatus(req, res);
};

// POST /api/requests/:id/reject (Admin)
const rejectRequest = async (req, res) => {
  const { reason } = req.body;
  req.body = { ...req.body, status: 'REJECTED', reason };
  return updateRequestStatus(req, res);
};

// POST / PATCH /api/requests/:id/fulfill
const fulfillRequest = async (req, res) => {
  req.body = { ...req.body, status: 'FULFILLED' };
  return updateRequestStatus(req, res);
};

// GET /api/requests/:id/match-donors
const getMatchedDonors = async (req, res) => {
  try {
    const bloodReq = await dataStore.getRequestById(req.params.id);
    if (!bloodReq) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    const matches = await dataStore.findMatchedDonorsForRequest(bloodReq);
    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/requests/:id/notify-donors
const notifyDonors = async (req, res) => {
  try {
    const { donorIds } = req.body;
    const bloodReq = await dataStore.getRequestById(req.params.id);
    if (!bloodReq) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('donors-dispatched', {
        requestId: bloodReq._id,
        patientName: bloodReq.patientName,
        bloodGroup: bloodReq.bloodGroup,
        unitsRequired: bloodReq.unitsRequired,
        hospitalName: bloodReq.hospitalName,
        dispatchedCount: donorIds ? donorIds.length : (bloodReq.matchedDonors?.length || 0)
      });
    }

    res.json({
      success: true,
      message: `Emergency proximity alert successfully broadcasted to ${donorIds ? donorIds.length : 'nearby'} donors!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/requests/:id
const deleteRequest = async (req, res) => {
  try {
    const deleted = await dataStore.deleteBloodRequest(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }
    res.json({ success: true, message: 'Blood request record removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRequests,
  getMyRequests,
  getRequestById,
  createRequest,
  updateRequest,
  updateRequestStatus,
  approveRequest,
  rejectRequest,
  fulfillRequest,
  getMatchedDonors,
  notifyDonors,
  deleteRequest
};
