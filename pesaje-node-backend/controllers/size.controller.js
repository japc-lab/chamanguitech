const { response } = require('express');
const { getAll } = require('../services/size.service');

const getSizes = async (req, res = response) => {
    try {
        const { type } = req.query;
        const data = await getAll(type);

        res.status(200).json({
            ok: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};

module.exports = {
    getSizes
}