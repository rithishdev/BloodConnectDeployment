const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donor = require('../models/Donor');
const dataStore = require('../utils/dataStore');
const { JWT_SECRET } = require('../middleware/auth');

const isDbReady = () => mongoose.connection.readyState === 1;

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user, extra = {}) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      ...extra
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Seed default administrator and sample users if not present
const ensureDefaultUsers = async () => {
  if (!isDbReady()) return;
  try {
    // 1. Admin Account
    const adminExists = await User.findOne({ email: 'admin@bloodconnect.com' });
    if (!adminExists) {
      console.log('🛡️ Creating default system administrator account...');
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@bloodconnect.com',
        password: 'admin123', // Hashes via pre-save hook
        role: 'admin',
        phone: '+1 (555) 019-9000'
      });
      await admin.save();
      console.log('✅ Default Admin ready: admin@bloodconnect.com / admin123');
    }

    // 2. Donor Account
    const donorUserExists = await User.findOne({ email: 'donor@bloodconnect.com' });
    if (!donorUserExists) {
      console.log('🩸 Creating default sample donor account...');
      let donorProfile = await Donor.findOne({ email: 'donor@bloodconnect.com' });
      if (!donorProfile) {
        donorProfile = new Donor({
          name: 'Priya Subramanian',
          age: 28,
          gender: 'Female',
          bloodGroup: 'O-',
          phone: '+91 98401 23456',
          email: 'donor@bloodconnect.com',
          city: 'Chennai',
          state: 'Tamil Nadu',
          address: '33, Gandhi Mandapam Road, Adyar',
          location: { lat: 13.0012, lng: 80.2565 },
          isAvailable: true,
          availabilityStatus: 'Available',
          lastDonatedDate: new Date('2024-08-15'),
          totalDonations: 8
        });
        await donorProfile.save();
      }
      const donorUser = new User({
        name: 'Priya Subramanian',
        email: 'donor@bloodconnect.com',
        password: 'donor123',
        role: 'donor',
        phone: '+91 98401 23456',
        donorProfileId: donorProfile._id
      });
      await donorUser.save();
      donorProfile.userId = donorUser._id;
      await donorProfile.save();
      console.log('✅ Default Donor ready: donor@bloodconnect.com / donor123');
    }

    // 3. Patient Account
    const patientUserExists = await User.findOne({ email: 'patient@bloodconnect.com' });
    if (!patientUserExists) {
      console.log('🏥 Creating default sample patient account...');
      const patient = new User({
        name: 'Robert Johnson',
        email: 'patient@bloodconnect.com',
        password: 'patient123',
        role: 'patient',
        phone: '+1 (555) 345-6789'
      });
      await patient.save();
      console.log('✅ Default Patient ready: patient@bloodconnect.com / patient123');
    }
  } catch (err) {
    console.warn('Default users auto-seed check warning:', err.message);
  }
};

const ensureAdminUser = ensureDefaultUsers;

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'donor',
      phone,
      age,
      gender,
      bloodGroup,
      city,
      address,
      lastDonatedDate,
      availabilityStatus
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (role === 'patient') {
      return res.status(400).json({
        success: false,
        message: 'Patient registration is not required. Patients can request blood directly through the Request Blood form.'
      });
    }

    let tenDigitsPhone = '';
    if (phone) {
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
      tenDigitsPhone = tenDigits;
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate user
    if (isDbReady()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.'
        });
      }
    }

    // Create User
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: role === 'patient' ? 'patient' : role === 'admin' ? 'admin' : 'donor',
      phone: tenDigitsPhone || (phone ? phone.trim() : '')
    });

    await user.save();

    let donorProfile = null;

    // If registering as donor, create linked Donor profile
    if (user.role === 'donor') {
      const donorData = {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: tenDigitsPhone || (phone ? phone.trim() : 'N/A'),
        age: age ? Number(age) : 25,
        gender: gender || 'Male',
        weightKg: Number(req.body.weightKg) || 55,
        hasDonatedBefore: req.body.hasDonatedBefore === true || req.body.hasDonatedBefore === 'true',
        lastDonationDate: req.body.lastDonationDate ? new Date(req.body.lastDonationDate) : (lastDonatedDate ? new Date(lastDonatedDate) : null),
        bloodGroup: (bloodGroup || 'O+').toUpperCase(),
        city: city ? city.trim() : 'Metro City',
        address: address ? address.trim() : '',
        lastDonatedDate: lastDonatedDate ? new Date(lastDonatedDate) : null,
        isAvailable: availabilityStatus !== 'Busy',
        availabilityStatus: availabilityStatus || 'Available'
      };

      donorProfile = await dataStore.createDonor(donorData);
      user.donorProfileId = donorProfile._id;
      await user.save();
    }

    const token = generateToken(user, {
      donorId: donorProfile?._id,
      bloodGroup: donorProfile?.bloodGroup
    });

    res.status(201).json({
      success: true,
      message: `${user.role.toUpperCase()} registered successfully!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        donorProfile
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.'
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this is a sample user login attempt and seed defaults if needed
    if (['admin@bloodconnect.com', 'donor@bloodconnect.com', 'patient@bloodconnect.com'].includes(normalizedEmail)) {
      if (isDbReady()) await ensureDefaultUsers();
    }

    if (!isDbReady()) {
      if (normalizedEmail === 'admin@bloodconnect.com' && password === 'admin123') {
        const mockAdmin = {
          _id: 'mem_admin_1',
          name: 'System Administrator',
          email: 'admin@bloodconnect.com',
          role: 'admin',
          phone: '+91 98401 23456'
        };
        const token = generateToken(mockAdmin);
        return res.json({
          success: true,
          message: 'Admin authorization successful',
          token,
          user: mockAdmin
        });
      }
      if (normalizedEmail === 'donor@bloodconnect.com' && password === 'donor123') {
        const mockDonorUser = {
          _id: 'mem_donor_user_1',
          name: 'Priya Subramanian',
          email: 'donor@bloodconnect.com',
          role: 'donor',
          phone: '+91 98401 23456'
        };
        const token = generateToken(mockDonorUser, { bloodGroup: 'O-' });
        return res.json({
          success: true,
          message: 'Donor login successful',
          token,
          user: mockDonorUser
        });
      }
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Role check if specific role login was requested
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account is registered as "${user.role}", not "${role}". Please select the correct login portal.`
      });
    }

    // Fetch linked donor profile if donor
    let donorProfile = null;
    if (user.role === 'donor') {
      donorProfile = await Donor.findOne({ userId: user._id }) || await Donor.findOne({ email: user.email });
    }

    const token = generateToken(user, {
      donorId: donorProfile?._id,
      bloodGroup: donorProfile?.bloodGroup
    });

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        donorProfile
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed.'
    });
  }
};

// POST /api/auth/admin-login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isDbReady()) await ensureAdminUser();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Administrator email and password are required.'
      });
    }

    if (!isDbReady()) {
      if (email.toLowerCase().trim() === 'admin@bloodconnect.com' && password === 'admin123') {
        const mockAdmin = {
          _id: 'mem_admin_1',
          name: 'System Administrator',
          email: 'admin@bloodconnect.com',
          role: 'admin',
          phone: '+91 98401 23456'
        };
        const token = generateToken(mockAdmin);
        return res.json({
          success: true,
          message: 'Admin authorization successful',
          token,
          user: mockAdmin
        });
      }
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Admin authorization successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'admin',
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Admin login failed.'
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let donorProfile = null;
    if (user.role === 'donor') {
      donorProfile = await Donor.findOne({ userId: user._id }) || await Donor.findOne({ email: user.email });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        donorProfile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name,
      phone,
      age,
      gender,
      bloodGroup,
      city,
      address,
      lastDonatedDate,
      availabilityStatus,
      isAvailable
    } = req.body;

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    await user.save();

    let donorProfile = null;
    if (user.role === 'donor') {
      let donor = await Donor.findOne({ userId: user._id }) || await Donor.findOne({ email: user.email });
      if (donor) {
        if (name) donor.name = name.trim();
        if (phone) donor.phone = phone.trim();
        if (age) donor.age = Number(age);
        if (gender) donor.gender = gender;
        if (bloodGroup) donor.bloodGroup = bloodGroup.toUpperCase();
        if (city) donor.city = city.trim();
        if (address) donor.address = address.trim();
        if (lastDonatedDate !== undefined) donor.lastDonatedDate = lastDonatedDate ? new Date(lastDonatedDate) : null;
        if (availabilityStatus) donor.availabilityStatus = availabilityStatus;
        if (isAvailable !== undefined) donor.isAvailable = Boolean(isAvailable);
        await donor.save();
        donorProfile = donor;
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        donorProfile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  getMe,
  updateProfile,
  ensureAdminUser,
  ensureDefaultUsers
};
