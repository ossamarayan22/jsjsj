const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const paypal = require('paypal-rest-sdk');

// إعداد PayPal
paypal.configure({
    'mode': 'sandbox', // أو 'live' في حالة الإنتاج
    'client_id': 'YOUR_PAYPAL_CLIENT_ID',
    'client_secret': 'YOUR_PAYPAL_CLIENT_SECRET'
});

// عرض عربة التسوق
router.get('/', async (req, res) => {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
    res.render('cart', { cart });
});

// إضافة منتج إلى عربة التسوق
router.post('/add/:productId', async (req, res) => {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
        cart = new Cart({ userId: req.user._id, products: [] });
    }

    const product = cart.products.find(p => p.productId == req.params.productId);
    if (product) {
        product.quantity += 1;
    } else {
        cart.products.push({ productId: req.params.productId, quantity: 1 });
    }

    await cart.save();
    res.redirect('/cart');
});

// حذف منتج من عربة التسوق
router.post('/remove/:productId', async (req, res) => {
    let cart = await Cart.findOne({ userId: req.user._id });
    cart.products = cart.products.filter(p => p.productId != req.params.productId);
    await cart.save();
    res.redirect('/cart');
});

// إنشاء الدفع عبر PayPal
router.post('/pay', async (req, res) => {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
    
    if (!cart || cart.products.length === 0) {
        return res.redirect('/cart'); // إعادة التوجيه إذا كانت العربة فارغة
    }

    const total = cart.products.reduce((sum, product) => sum + product.productId.price * product.quantity, 0);

    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/cart/success",
            "cancel_url": "http://localhost:3000/cart/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": cart.products.map(p => ({
                    "name": p.productId.name,
                    "sku": p.productId._id.toString(),
                    "price": p.productId.price.toString(),
                    "currency": "USD",
                    "quantity": p.quantity
                }))
            },
            "amount": {
                "currency": "USD",
                "total": total.toFixed(2).toString()  // المجموع الكلي بالعملات
            },
            "description": "شراء منتجات من المتجر."
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            console.error(error);
            res.redirect('/cart');
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    return res.redirect(payment.links[i].href);
                }
            }
        }
    });
});

// صفحة النجاح بعد الدفع
router.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "10.00"  // المبلغ الإجمالي الثابت
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.error(error.response);
            res.send('Error');
        } else {
            console.log(JSON.stringify(payment));
            res.send('Success');
        }
    });
});

// صفحة الإلغاء
router.get('/cancel', (req, res) => {
    res.send('Cancelled');
});

module.exports = router;
