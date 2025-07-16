const { Router } = require('express');
const { query } = require('express-validator');

const { seedAllData } = require('../controllers/seed.controller');
const { validateFields } = require('../middlewares/validate-fields');


const router = Router();

router.get(
    '/all',
    [
        query('keepTxData')
            .optional()
            .custom(value => {
                if (value !== 'true' && value !== 'false') {
                    throw new Error('keepTxData must be either true or false');
                }
                return true;
            }),
        validateFields, // Ensure this is included to process validation
    ],
    seedAllData
);

module.exports = router;


