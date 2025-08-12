const express = require('express');
const { check } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const { getAllAssets, getAssetById, createAsset, updateAsset, removeAsset } = require('../controllers/asset.controller');

const router = express.Router();

router.get('/', validateJWT, getAllAssets);
router.get('/:id', validateJWT, getAssetById);

router.post(
    '/',
    [
        validateJWT,
        // Required fields
        check('name', 'Asset name is required').notEmpty().trim(),
        check('purchaseDate', 'Purchase date is required').notEmpty().isISO8601().toDate(),
        check('cost', 'Cost is required and must be a positive number').isFloat({ min: 0 }),
        check('desiredLife', 'Desired life is required and must be a positive number').isInt({ min: 0 }),
        check('paymentStatus', 'Payment status is required').isIn(['paid', 'pending']),
        check('paidAmount', 'Paid amount is required and must be a positive number').isFloat({ min: 0 }),
        check('pendingAmount', 'Pending amount is required and must be a positive number').isFloat({ min: 0 }),
        check('responsible', 'Responsible is required').notEmpty().trim(),

        // Optional fields
        check('location').optional().notEmpty().trim(),
        check('currentSituation').optional().isIn(['good', 'bad', 'neutral']).trim().withMessage('Current situation must be either "good", "bad" or "neutral"'),
        check('disposalDate').optional().isISO8601().toDate(),
        check('daysOfUse').optional().isInt({ min: 0 }),

        validateFields
    ],
    createAsset
);

router.put(
    '/:id',
    [
        validateJWT,
        // Optional fields for updates
        check('name').optional().notEmpty().trim().withMessage('Asset name cannot be empty'),
        check('purchaseDate').optional().isISO8601().toDate().withMessage('Purchase date must be a valid date'),
        check('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
        check('desiredLife').optional().isInt({ min: 0 }).withMessage('Desired life must be a positive integer'),
        check('paymentStatus').optional().isIn(['paid', 'pending']).withMessage('Payment status must be either "paid" or "pending"'),
        check('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a positive number'),
        check('pendingAmount').optional().isFloat({ min: 0 }).withMessage('Pending amount must be a positive number'),
        check('responsible').optional().notEmpty().trim().withMessage('Responsible cannot be empty'),
        check('location').optional().notEmpty().trim().withMessage('Location cannot be empty'),
        check('currentSituation').optional().isIn(['good', 'bad', 'neutral']).trim().withMessage('Current situation must be either "good", "bad" or "neutral"'),
        check('disposalDate').optional().isISO8601().toDate().withMessage('Disposal date must be a valid date'),
        check('daysOfUse').optional().isInt({ min: 0 }).withMessage('Days of use must be a positive integer'),

        validateFields
    ],
    updateAsset
);

router.delete('/:id', validateJWT, removeAsset);

module.exports = router; 