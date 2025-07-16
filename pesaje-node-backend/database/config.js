const mongoose = require('mongoose');
// const { Sequelize } = require('sequelize');

// let sequelize; // Sequelize instance for SQL databases

const dbConnection = async () => {
    try {
        const dbType = process.env.DB_TYPE || 'mongo';

        if (dbType === 'mongo') {
            // Connect to MongoDB
            await mongoose.connect(process.env.DB_CNN);

            console.log('MongoDB connected');

            // Ensure indexes are created (Only for MongoDB)
            const { Period, ShrimpFarm, Purchase } = require('../models');
            await Period.syncIndexes();
            await ShrimpFarm.syncIndexes();
            await Purchase.syncIndexes();
        }
        // else if (dbType === 'sql') {
        //     // Connect to SQL Database (PostgreSQL, MySQL, etc.)
        //     sequelize = new Sequelize(process.env.DB_CNN, {
        //         dialect: process.env.DB_DIALECT || 'postgres', // Change based on DB (e.g., 'mysql')
        //         logging: false // Disable SQL query logging
        //     });

        //     await sequelize.authenticate();
        //     console.log(`SQL Database (${process.env.DB_DIALECT || 'postgres'}) connected`);
        // } 
        else {
            throw new Error(`Unsupported DB_TYPE: ${dbType}`);
        }

    } catch (error) {
        console.error('Database connection error:', error);
        throw new Error('Error initializing the database');
    }
};

module.exports = {
    dbConnection,
    // sequelize // Export Sequelize instance for SQL DBs
};
