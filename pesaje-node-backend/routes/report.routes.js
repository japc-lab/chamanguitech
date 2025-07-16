const express = require('express');
const { check, query, param } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');

const {
    getEconomicReportByParams,
    getTotalReportByParams,
    createTotalReport,
    getRecordedTotalReportByControlNumber
} = require('../controllers/report.controller');

const router = express.Router();

// 🔹 Get all purchases with optional filters
router.get(
    '/economic/by-params',
    [
        validateJWT,
        query('includeDeleted')
            .optional()
            .custom(value => {
                if (value !== 'true' && value !== 'false') {
                    throw new Error('includeDeleted must be either true or false');
                }
                return true;
            }),
        query('clientId').optional().isMongoId().withMessage('Client ID must be a valid MongoDB ObjectId'),
        query('userId').optional().isMongoId().withMessage('User ID must be a valid MongoDB ObjectId'),
        query('periodId').optional().isMongoId().withMessage('Period ID must be a valid MongoDB ObjectId'),
        query('controlNumber')
            .optional()
            .isString()
            .withMessage('Control number must be a string'),
        validateFields,
    ],
    getEconomicReportByParams
);

router.get(
    '/total/by-params',
    [
        validateJWT,
        query('includeDeleted')
            .optional()
            .custom(value => {
                if (value !== 'true' && value !== 'false') {
                    throw new Error('includeDeleted must be either true or false');
                }
                return true;
            }),
        query('clientId').optional().isMongoId().withMessage('Client ID must be a valid MongoDB ObjectId'),
        query('userId').optional().isMongoId().withMessage('User ID must be a valid MongoDB ObjectId'),
        query('periodId').optional().isMongoId().withMessage('Period ID must be a valid MongoDB ObjectId'),
        query('controlNumber')
            .optional()
            .isString()
            .withMessage('Control number must be a string'),
        validateFields,
    ],
    getTotalReportByParams
);

router.post(
    '/total',
    [
        validateJWT,
        check('purchaseId', 'Purchase ID is required').isMongoId(),
        check('controlNumber', 'Control Number is required').notEmpty(),
        check('responsibleBuyer', 'Responsible Buyer is required').notEmpty(),
        check('brokerName', 'Broker Name is required').notEmpty(),
        check('purchaseDate', 'Purchase Date is required').isISO8601(),
        check('clientName', 'Client Name is required').notEmpty(),
        check('averageGramPurchase').isNumeric(),
        check('pricePurchase').isNumeric(),
        check('poundsPurchase').isNumeric(),
        check('totalToPayPurchase').isNumeric(),
        check('averageBatchGramsSale').isNumeric(),
        check('salePrice').isNumeric(),
        check('wholePoundsReceived').isNumeric(),
        check('diffPounds').isNumeric(),
        check('totalToReceiveSale').isNumeric(),
        check('balanceNet').isNumeric(),
        check('logisticsTotalToPay').isNumeric(),
        check('retention').isNumeric(),
        check('retentionFactorInput').isNumeric(),
        check('subtotalGrossProfit').isNumeric(),
        check('totalToPayBroker').isNumeric(),
        check('payBrokerFactorInput').isNumeric(),
        check('totalToPayQualifier').isNumeric(),
        check('payQualifierFactorInput').isNumeric(),
        check('taxes').isNumeric(),
        check('taxesFactorInput').isNumeric(),
        check('totalGrossProfit').isNumeric(),
        check('responsibleBuyerProfit').isNumeric(),
        check('buyerProfitFactorInput').isNumeric(),
        check('secretaryProfit').isNumeric(),
        check('secretaryProfitFactorInput').isNumeric(),
        check('ceoProfit').isNumeric(),
        check('ceoProfitFactorInput').isNumeric(),
        check('techLegalProfit').isNumeric(),
        check('techLegalProfitFactorInput').isNumeric(),
        check('investCapitalProfit').isNumeric(),
        check('investCapitalProfitFactorInput').isNumeric(),
        check('profit').isNumeric(),
        check('profitFactorInput').isNumeric(),
        check('totalFactors').isNumeric(),
        validateFields
    ],
    createTotalReport
);

router.get(
    '/total/recorded',
    [
        validateJWT,
        query('controlNumber', 'Control number is required').notEmpty(),
        validateFields
    ],
    getRecordedTotalReportByControlNumber
);

module.exports = router;
