const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// عرض جميع المنتجات
router.get('/', async (req, res) => {
    const products = await Product.find();
    res.render('products', { products });
});

// عرض تفاصيل المنتج
router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    res.render('product-detail', { product });
});

module.exports = router;
