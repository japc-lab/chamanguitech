const { Router } = require('express');
const { check } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const { createLocalSale, getLocalSaleBySaleId, updateLocalSale } = require('../controllers/local-sale.controller');

const router = Router();

router.post(
    '/',
    [
        validateJWT,
        check('purchase', 'Purchase ID is required').isMongoId(),
        check('saleDate', 'Sale date is required').isISO8601(),
        check('wholeTotalPounds', 'wholeTotalPounds is required and must be numeric').isNumeric(),
        check('moneyIncomeForRejectedHeads', 'moneyIncomeForRejectedHeads must be numeric').optional().isNumeric(),
        check('wholeRejectedPounds', 'wholeRejectedPounds is required and must be numeric').isNumeric(),
        check('trashPounds', 'trashPounds is required and must be numeric').isNumeric(),
        check('totalProcessedPounds', 'totalProcessedPounds is required and must be numeric').isNumeric(),
        check('grandTotal', 'Price grand total is required').isNumeric(),
        check('seller', 'Seller is required').notEmpty(),
        check('localSaleDetails', 'Local sale details are required').isArray({ min: 1 }),
        check('localSaleDetails.*.style', 'Style is required').notEmpty(),
        check('localSaleDetails.*.grandTotal', 'grandTotal is required and must be numeric').isNumeric(),
        check('localSaleDetails.*.receivedGrandTotal', 'receivedGrandTotal is required and must be numeric').isNumeric(),
        check('localSaleDetails.*.poundsGrandTotal', 'poundsGrandTotal is required and must be numeric').isNumeric(),
        check('localSaleDetails.*.retentionPercentage', 'retentionPercentage must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.retentionAmount', 'retentionAmount must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.netGrandTotal', 'netGrandTotal is required and must be numeric').isNumeric(),
        check('localSaleDetails.*.otherPenalties', 'otherPenalties must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items', 'Detail must include items').isArray({ min: 1 }),
        check('localSaleDetails.*.items.*.size', 'Item size is required').notEmpty(),
        check('localSaleDetails.*.items.*.pounds', 'Item pounds is required and must be numeric').isNumeric(),
        check('localSaleDetails.*.items.*.price', 'Item price is required and must be numeric').isNumeric(),
        check('localSaleDetails.*.items.*.total', 'Item total is required and must be numeric').isNumeric(),
        check('localSaleDetails.*.items.*.merchantName', 'Item merchantName is required').notEmpty(),
        check('localSaleDetails.*.items.*.merchantId', 'Item merchantId is required').notEmpty(),
        check('localSaleDetails.*.items.*.paymentStatus', 'Item paymentStatus is required').isIn(['NO_PAYMENT', 'PENDING', 'PAID']),
        check('localSaleDetails.*.items.*.hasInvoice', 'Item hasInvoice is required').isIn(['yes', 'no', 'not-applicable']),
        check('localSaleDetails.*.items.*.paymentOne', 'Item paymentOne must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items.*.paymentTwo', 'Item paymentTwo must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items.*.totalPaid', 'Item totalPaid must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items.*.paymentMethod', 'Item paymentMethod is required when paymentStatus is PAID')
            .if((value, { req, path }) => {
                const pathParts = path.split('.');
                const detailIndex = pathParts[1];
                const itemIndex = pathParts[3];
                return req.body.localSaleDetails?.[detailIndex]?.items?.[itemIndex]?.paymentStatus === 'PAID';
            })
            .isMongoId(),
        check('localSaleDetails.*.items.*.invoiceNumber', 'Item invoiceNumber is required when hasInvoice is yes')
            .if((value, { req, path }) => {
                const pathParts = path.split('.');
                const detailIndex = pathParts[1];
                const itemIndex = pathParts[3];
                return req.body.localSaleDetails?.[detailIndex]?.items?.[itemIndex]?.hasInvoice === 'yes';
            })
            .notEmpty(),
        check('localSaleDetails.*.items.*.totalReceived', 'Item totalReceived must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail', 'Local company detail is optional').optional().notEmpty(),
        check('localCompanySaleDetail.company', 'Company is required').optional().isMongoId(),
        check('localCompanySaleDetail.receiptDate', 'Receipt date is required').optional().isISO8601(),
        check('localCompanySaleDetail.personInCharge', 'Person in charge is required').optional().notEmpty(),
        check('localCompanySaleDetail.batch', 'Batch is required').optional().notEmpty(),
        check('localCompanySaleDetail.guideWeight', 'Guide weight is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.guideNumber', 'Guide number is required').optional().notEmpty(),
        check('localCompanySaleDetail.weightDifference', 'Weight difference is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.processedWeight', 'Processed weight is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.poundsGrandTotal', 'Pounds grand total is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.grandTotal', 'Grand total is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.retentionPercentage', 'Retention percentage must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.retentionAmount', 'Retention amount must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.netGrandTotal', 'Net grand total is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.otherPenalties', 'Other penalties must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.items', 'Local company detail must include items').optional().isArray({ min: 1 }),
        check('localCompanySaleDetail.items.*.size', 'Item size is required').optional().notEmpty(),
        check('localCompanySaleDetail.items.*.class', 'Item class is required').optional().notEmpty(),
        check('localCompanySaleDetail.items.*.pounds', 'Item pounds is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.items.*.price', 'Item price is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.items.*.total', 'Item total is required and must be numeric').optional().isNumeric(),
        check('weightSheetNumber', 'weightSheetNumber is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isString(),
        check('hasInvoice', 'hasInvoice is required and must be one of: yes, no, not-applicable')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isIn(['yes', 'no', 'not-applicable']),
        check('invoiceNumber')
            .if((value, { req }) => req.body.status !== 'DRAFT' && req.body.hasInvoice === 'yes')
            .isString()
            .withMessage('Invoice number must be a string'),
        check('invoiceName')
            .if((value, { req }) => req.body.status !== 'DRAFT' && req.body.hasInvoice === 'yes')
            .isString()
            .withMessage('Invoice name must be a string'),
        validateFields
    ],
    createLocalSale
);

router.get(
    '/by-sale/:saleId',
    [
        validateJWT,
        check('saleId', 'Sale ID must be a valid Mongo ID').isMongoId(),
        validateFields
    ],
    getLocalSaleBySaleId
);

router.put(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid Local Sale ID').isMongoId(),
        check('saleDate', 'Sale date must be a valid ISO 8601 date').optional().isISO8601(),
        check('wholeTotalPounds', 'wholeTotalPounds must be numeric').optional().isNumeric(),
        check('moneyIncomeForRejectedHeads', 'moneyIncomeForRejectedHeads must be numeric').optional().isNumeric(),
        check('wholeRejectedPounds', 'wholeRejectedPounds must be numeric').optional().isNumeric(),
        check('trashPounds', 'trashPounds must be numeric').optional().isNumeric(),
        check('totalProcessedPounds', 'totalProcessedPounds must be numeric').optional().isNumeric(),
        check('grandTotal', 'grandTotal must be numeric').optional().isNumeric(),
        check('seller', 'Seller is required').optional().notEmpty(),
        check('localSaleDetails', 'Local sale details are optional').optional().isArray({ min: 1 }),
        check('localSaleDetails.*.style', 'Style is required').optional().notEmpty(),
        check('localSaleDetails.*.grandTotal', 'grandTotal is required and must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.receivedGrandTotal', 'receivedGrandTotal is required and must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.poundsGrandTotal', 'poundsGrandTotal is required and must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.retentionPercentage', 'retentionPercentage must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.retentionAmount', 'retentionAmount must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.netGrandTotal', 'netGrandTotal is required and must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.otherPenalties', 'otherPenalties must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items', 'Detail must include items').optional().isArray({ min: 1 }),
        check('localSaleDetails.*.items.*.size', 'Item size is required').optional().notEmpty(),
        check('localSaleDetails.*.items.*.pounds', 'Item pounds is required and must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items.*.price', 'Item price is required and must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items.*.total', 'Item total is required and must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items.*.merchantName', 'Item merchantName is required').optional().notEmpty(),
        check('localSaleDetails.*.items.*.merchantId', 'Item merchantId is required').optional().notEmpty(),
        check('localSaleDetails.*.items.*.paymentStatus', 'Item paymentStatus is required').optional().isIn(['NO_PAYMENT', 'PENDING', 'PAID']),
        check('localSaleDetails.*.items.*.hasInvoice', 'Item hasInvoice is required').optional().isIn(['yes', 'no', 'not-applicable']),
        check('localSaleDetails.*.items.*.paymentOne', 'Item paymentOne must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items.*.paymentTwo', 'Item paymentTwo must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items.*.totalPaid', 'Item totalPaid must be numeric').optional().isNumeric(),
        check('localSaleDetails.*.items.*.paymentMethod', 'Item paymentMethod is required when paymentStatus is PAID')
            .if((value, { req, path }) => {
                const pathParts = path.split('.');
                const detailIndex = pathParts[1];
                const itemIndex = pathParts[3];
                return req.body.localSaleDetails?.[detailIndex]?.items?.[itemIndex]?.paymentStatus === 'PAID';
            })
            .optional().isMongoId(),
        check('localSaleDetails.*.items.*.invoiceNumber', 'Item invoiceNumber is required when hasInvoice is yes')
            .if((value, { req, path }) => {
                const pathParts = path.split('.');
                const detailIndex = pathParts[1];
                const itemIndex = pathParts[3];
                return req.body.localSaleDetails?.[detailIndex]?.items?.[itemIndex]?.hasInvoice === 'yes';
            })
            .optional().notEmpty(),
        check('localSaleDetails.*.items.*.totalReceived', 'Item totalReceived must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail', 'Local company detail is optional').optional().notEmpty(),
        check('localCompanySaleDetail.company', 'Company is required').optional().isMongoId(),
        check('localCompanySaleDetail.receiptDate', 'Receipt date is required').optional().isISO8601(),
        check('localCompanySaleDetail.personInCharge', 'Person in charge is required').optional().notEmpty(),
        check('localCompanySaleDetail.batch', 'Batch is required').optional().notEmpty(),
        check('localCompanySaleDetail.guideWeight', 'Guide weight is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.guideNumber', 'Guide number is required').optional().notEmpty(),
        check('localCompanySaleDetail.weightDifference', 'Weight difference is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.processedWeight', 'Processed weight is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.poundsGrandTotal', 'Pounds grand total is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.grandTotal', 'Grand total is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.retentionPercentage', 'Retention percentage must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.retentionAmount', 'Retention amount must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.netGrandTotal', 'Net grand total is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.otherPenalties', 'Other penalties must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.items', 'Local company detail must include items').optional().isArray({ min: 1 }),
        check('localCompanySaleDetail.items.*.size', 'Item size is required').optional().notEmpty(),
        check('localCompanySaleDetail.items.*.class', 'Item class is required').optional().notEmpty(),
        check('localCompanySaleDetail.items.*.pounds', 'Item pounds is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.items.*.price', 'Item price is required and must be numeric').optional().isNumeric(),
        check('localCompanySaleDetail.items.*.total', 'Item total is required and must be numeric').optional().isNumeric(),
        check('weightSheetNumber').optional().isString().withMessage('Weight sheet number must be a string'),
        check('hasInvoice')
            .optional()
            .isIn(['yes', 'no', 'not-applicable']),
        check('invoiceNumber')
            .if((value, { req }) => req.body.status !== 'DRAFT' && req.body.hasInvoice === 'yes')
            .isString().withMessage('Invoice number must be a string'),
        check('invoiceName')
            .if((value, { req }) => req.body.status !== 'DRAFT' && req.body.hasInvoice === 'yes')
            .isString()
            .withMessage('Invoice name must be a string'),
        validateFields
    ],
    updateLocalSale
);

module.exports = router;
