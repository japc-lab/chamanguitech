

const { Router } = require('express');
const { check } = require('express-validator');
const router = Router();

const { getPaymentMethods } = require('../controllers/payment-method.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');


router.get('/', validateJWT, getPaymentMethods);

module.exports = router;