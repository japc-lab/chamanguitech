

const { Router } = require('express');
const { query } = require('express-validator');
const router = Router();

const { getSizes } = require('../controllers/size.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');


router.get(
    '/',
    [
        validateJWT,
        query('type').optional().isString().withMessage('Type must be a string'),
        validateFields
    ],
    getSizes
);
module.exports = router;