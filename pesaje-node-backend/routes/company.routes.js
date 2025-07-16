

const { Router } = require('express');
const { check, param, body } = require('express-validator');
const router = Router();

const { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } = require('../controllers/company.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');


router.get('/', validateJWT, getCompanies);

router.get(
    '/:id',
    [
        validateJWT,
        param('id', 'Invalid company ID').isMongoId(),
        validateFields
    ],
    getCompanyById
);

router.post(
    '/',
    [
        validateJWT,
        check('name', 'Name is required').notEmpty(),
        check('city', 'City is required').notEmpty(),
        check('mainPersonName', 'Main person name is required').notEmpty(),
        check('mainTelephone', 'Main telephone is required').notEmpty(),
        body('code').not().exists().withMessage('Code should not be sent, it is auto-generated'),
        // Add more required fields as needed
        validateFields
    ],
    createCompany
);

router.put(
    '/:id',
    [
        validateJWT,
        param('id', 'Invalid company ID').isMongoId(),
        // All fields are optional for update, but validate if present
        check('name', 'Name cannot be empty').optional().notEmpty(),
        check('city', 'City cannot be empty').optional().notEmpty(),
        check('mainPersonName', 'Main person name cannot be empty').optional().notEmpty(),
        check('mainTelephone', 'Main telephone cannot be empty').optional().notEmpty(),
        // body('code').not().exists().withMessage('Code cannot be updated'),
        // Add more fields as needed
        validateFields
    ],
    updateCompany
);

router.delete(
    '/:id',
    [
        validateJWT,
        param('id', 'Invalid company ID').isMongoId(),
        validateFields
    ],
    deleteCompany
);


module.exports = router;