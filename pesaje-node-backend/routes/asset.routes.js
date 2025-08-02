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
        check('name', 'Asset name is required').notEmpty().trim(),
        check('quantity', 'Asset quantity is required').isNumeric().withMessage('Quantity must be a number'),
        check('quantity').custom(value => {
            if (value < 0) {
                throw new Error('Quantity must be a non-negative number');
            }
            return true;
        }),
        validateFields
    ],
    createAsset
);

router.put(
    '/:id',
    [
        validateJWT,
        check('name').optional().notEmpty().trim().withMessage('Asset name cannot be empty'),
        check('quantity').optional().isNumeric().withMessage('Quantity must be a number'),
        check('quantity').optional().custom(value => {
            if (value < 0) {
                throw new Error('Quantity must be a non-negative number');
            }
            return true;
        }),
        validateFields
    ],
    updateAsset
);

router.delete('/:id', validateJWT, removeAsset);

module.exports = router; 