const { response } = require('express');
const { getAll } = require('../services/role.service');

const getRoles = async (req, res = response) => {
    try {
        const roles = await getAll();
        res.status(200).json({
            ok: true,
            roles,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};

module.exports = {
    getRoles
}