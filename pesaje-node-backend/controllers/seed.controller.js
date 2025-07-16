const { response } = require('express');
const { seedDatabase } = require('../services/seed.service');

const seedAllData = async (req, res = response) => {
    try {
        const keepTxData = req.query.keepTxData === 'true';

        const data = await seedDatabase(keepTxData);
        res.status(200).json({
            ok: true,
            message: 'All entities seeded successfully',
            data
        });
    } catch (error) {
        console.error('Error seeding data:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

module.exports = {
    seedAllData,
}
