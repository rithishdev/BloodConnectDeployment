const dataStore = require('../utils/dataStore');

// GET /api/hospitals
const getHospitals = async (req, res) => {
  try {
    const hospitals = await dataStore.getAllHospitals(req.query);
    res.json({
      success: true,
      count: hospitals.length,
      data: hospitals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/hospitals/:id
const getHospitalById = async (req, res) => {
  try {
    const hospital = await dataStore.getHospitalById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/hospitals
const createHospital = async (req, res) => {
  try {
    const { name, phone, city, address } = req.body;
    if (!name || !phone || !city || !address) {
      return res.status(400).json({
        success: false,
        message: 'Hospital name, phone, city, and address are required'
      });
    }

    const hospital = await dataStore.createHospital(req.body);
    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully',
      data: hospital
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/hospitals/:id
const updateHospital = async (req, res) => {
  try {
    const updated = await dataStore.updateHospital(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    res.json({
      success: true,
      message: 'Hospital details updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/hospitals/:id
const deleteHospital = async (req, res) => {
  try {
    const deleted = await dataStore.deleteHospital(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    res.json({
      success: true,
      message: 'Hospital removed from directory successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/hospitals/:id/inventory
const updateInventory = async (req, res) => {
  try {
    const { bloodGroup, units } = req.body;
    if (!bloodGroup || units === undefined) {
      return res.status(400).json({
        success: false,
        message: 'bloodGroup and units adjustment are required'
      });
    }

    const updated = await dataStore.updateHospitalInventory(req.params.id, bloodGroup, units);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    res.json({
      success: true,
      message: `Inventory for ${bloodGroup} updated to ${updated.bloodInventory?.[bloodGroup]} units`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/hospitals/:id/requirements
const updateRequirements = async (req, res) => {
  try {
    const { requiredBloodGroups, requiredUnits } = req.body;
    const updateData = {};
    if (requiredBloodGroups !== undefined) updateData.requiredBloodGroups = requiredBloodGroups;
    if (requiredUnits !== undefined) updateData.requiredUnits = Number(requiredUnits) || 0;

    const updated = await dataStore.updateHospital(req.params.id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    res.json({
      success: true,
      message: 'Hospital requirements updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
  updateInventory,
  updateRequirements
};
