const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

// تسجيل الدخول
router.get('/login', (req, res) => {
    res.render('sign-in');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/user/login',
    failureFlash: true
}));

// إنشاء حساب جديد
router.get('/signup', (req, res) => {
    res.render('sign-up');
});

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const newUser = new User({ username, password });
    await newUser.save();
    res.redirect('/user/login');
});

// تسجيل الخروج
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;
