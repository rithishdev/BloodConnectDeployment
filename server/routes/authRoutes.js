const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/admin-login', authCtrl.adminLogin);
router.get('/me', verifyToken, authCtrl.getMe);
router.put('/profile', verifyToken, authCtrl.updateProfile);

module.exports = router;
