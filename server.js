const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');
const paypal = require('paypal-rest-sdk');

// إعداد التطبيق
const app = express();
const PORT = process.env.PORT || 5000;

// إعدادات قاعدة البيانات
mongoose.connect('mongodb://localhost/ecommerce', { useNewUrlParser: true, useUnifiedTopology: true });

// إعداد الجلسات
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost/ecommerce' })
}));

// إعدادات جسد الطلبات (Body Parser)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// إعداد Passport.js
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// إعدادات العرض (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// إعداد المسارات
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/user');
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/user', userRoutes);

// صفحة رئيسية بسيطة
app.get('/', (req, res) => {
    res.redirect('/products');
});

// تكوين PayPal
paypal.configure({
    'mode': 'sandbox', // أو 'live' في حالة الإنتاج
    'client_id': 'YOUR_PAYPAL_CLIENT_ID',
    'client_secret': 'YOUR_PAYPAL_CLIENT_SECRET'
});

// الاستماع على المنفذ
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
