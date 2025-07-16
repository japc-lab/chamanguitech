

const { Router } = require('express');
const { check } = require('express-validator');
const router = Router();

const { getRoles } = require('../controllers/role.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');


router.get('/', validateJWT, getRoles);

module.exports = router;