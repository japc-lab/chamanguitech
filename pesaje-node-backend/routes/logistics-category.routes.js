

const { Router } = require('express');
const { check } = require('express-validator');
const router = Router();

const { getLogisticsCategories } = require('../controllers/logistics-category.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');


router.get('/', validateJWT, getLogisticsCategories);

module.exports = router;