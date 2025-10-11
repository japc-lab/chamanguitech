const path = require('path');
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { dbConnection } = require('./database/config');

// Crear el servidor de express
const app = express();

// Base de datos
dbConnection();

var corsOptions = {
    origin: [
        'http://localhost:4200',
    ],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// CORS
app.use(cors(corsOptions));

// Lectura y parseo del body
app.use(express.json());

// Rutas
app.use('/api/seed', require('./routes/seed.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/payment-info', require('./routes/payment-info.routes'));
app.use('/api/role', require('./routes/role.routes'));
app.use('/api/company', require('./routes/company.routes'));
app.use('/api/size', require('./routes/size.routes'));
app.use('/api/broker', require('./routes/broker.routes'));
app.use('/api/client', require('./routes/client.routes'));
app.use('/api/shrimp-farm', require('./routes/shrimp-farm.routes'));
app.use('/api/period', require('./routes/period-size-price.routes'));
app.use('/api/purchase', require('./routes/purchase.routes'));
app.use('/api/payment-method', require('./routes/payment-method.routes'));
app.use('/api/purchase-payment-method', require('./routes/purchase-payment-method.routes'));
app.use('/api/logistics-category', require('./routes/logistics-category.routes'));
app.use('/api/logistics', require('./routes/logistics.routes'));
app.use('/api/sale', require('./routes/sale.routes'));
app.use('/api/company-sale', require('./routes/company-sale.routes'));
app.use('/api/company-sale-payment-method', require('./routes/company-sale-payment-method.routes'));
app.use('/api/local-sale', require('./routes/local-sale.routes'));
app.use('/api/local-company-sale-detail-payment', require('./routes/local-company-sale-detail-payment.routes'));
app.use('/api/report', require('./routes/report.routes'));
app.use('/api/asset', require('./routes/asset.routes'));
app.use('/api/merchant', require('./routes/merchant.routes'));
app.use('/api/fisherman', require('./routes/fisherman.routes'));

// Serve static files from the Angular build output directory
app.use(express.static(path.join(__dirname, 'public/chamanguitech')));

// SPA fallback: serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/chamanguitech', 'index.html'));
});


// Escuchar peticiones
app.listen(process.env.PORT, () => {
    console.log(`Server up on port ${process.env.PORT}`);
});