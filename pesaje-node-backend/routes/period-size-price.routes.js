const express = require('express');
const { check, query, body, param } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const {
    getPeriodById,
    getAllPeriodsByCompany,
    createPeriod,
    updatePeriod,
    removePeriod,
    getAllDistinctPeriodNames,
    getAllPricesForCompanyByPeriodName
} = require('../controllers/period-size-price.controller');
const TimeOfDayEnum = require('../enums/time-of-day.enum');

const router = express.Router();

// 🔹 Get all distinct period names sorted
router.get(
    '/distinct-names',
    [
        validateJWT,
        validateFields
    ],
    getAllDistinctPeriodNames
);

// 🔹 Get period by id, including sizePrices
router.get(
    '/:id',
    [
        validateJWT,
        param('id').isMongoId().withMessage('Invalid Period ID format'),
        validateFields
    ],
    getPeriodById
);

// 🔹 Get periods by company
router.get(
    '/all/by-company',
    [
        validateJWT,
        query('companyId').isMongoId().withMessage('Invalid company ID format'),
        validateFields
    ],
    getAllPeriodsByCompany
);

// 🔹 Create a period with sizePrices
router.post(
    '/',
    [
        validateJWT,
        check('name', 'Name is required').notEmpty(),
        check('company', 'Company ID must be a valid MongoDB ObjectId').isMongoId(),
        check('receivedDateTime')
            .notEmpty()
            .withMessage('Received Date is required')
            .isISO8601()
            .toDate()
            .withMessage('receivedDateTime must be a valid ISO 8601 date string'),
        check('fromDate')
            .notEmpty()
            .withMessage('From Date is required')
            .isISO8601()
            .toDate()
            .withMessage('fromDate must be a valid ISO 8601 date string'),
        body('timeOfDay')
            .optional()
            .isIn(Object.values(TimeOfDayEnum))
            .withMessage(`timeOfDay must be one of: ${Object.values(TimeOfDayEnum).join(', ')} if provided`),
        check('sizePrices')
            .isArray({ min: 1 })
            .withMessage('sizePrices must be an array with at least one entry'),
        check('sizePrices.*.sizeId')
            .isMongoId()
            .withMessage('Each sizePrice sizeId must be a valid MongoDB ObjectId'),
        check('sizePrices.*.price')
            .isFloat({ min: 0 })
            .withMessage('Each sizePrice must have a numeric price greater than or equal to 0'),
        validateFields
    ],
    createPeriod
);


// 🔹 Update period (only sizePrices)
router.put(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid period ID').isMongoId(),
        body('name').not().exists().withMessage('Name cannot be updated'),
        body('company').not().exists().withMessage('Company cannot be updated'),
        body('receivedDateTime')
            .optional()
            .isISO8601()
            .toDate()
            .withMessage('receivedDateTime must be a valid ISO 8601 date string'),
        body('sizePrices')
            .isArray({ min: 1 })
            .withMessage('sizePrices must be an array with at least one entry'),
        body('sizePrices.*.sizeId')
            .isMongoId()
            .withMessage('Each sizePrice sizeId must be a valid MongoDB ObjectId'),
        body('sizePrices.*.price')
            .isNumeric()
            .withMessage('Each sizePrice must have a numeric price'),
        validateFields
    ],
    updatePeriod
);

// 🔹 Get prices by company for a given period name
router.get(
    '/prices/by-period-name',
    [
        validateJWT,
        query('periodName').notEmpty().withMessage('periodName is required'),
        validateFields
    ],
    getAllPricesForCompanyByPeriodName
);

// 🔹 Soft delete a period
router.delete(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid period ID').isMongoId(),
        validateFields,
    ],
    removePeriod
);



module.exports = router;
