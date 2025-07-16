const { User, Role, Broker, PaymentInfo, Person, RolePermission, Option, Client, ShrimpFarm, Period, SizePrice, Company, Size, Purchase, PaymentMethod, PurchasePaymentMethod, Logistics, LogisticsCategory, LogisticsItem, Sale, CompanySale, CompanySaleItem, CompanySalePaymentMethod, LocalSale, LocalSaleDetail, LocalSaleDetailItem, TotalReport } = require('../models');
const MongooseGenericAdapter = require('./mongoose-generic-adapter');

// If you have another adapter (e.g., PostgreSQL):
// const PostgresGenericAdapter = require('./pg-generic-adapter'); // Example

// Dynamically select the database
const dbType = process.env.DB_TYPE || 'mongo';

let userAdapter, personAdapter, brokerAdapter, paymentInfoAdapter, roleAdapter, companyAdapter, sizeAdapter, rolePermissionAdapter, optionAdapter, clientAdapter, shrimpFarmAdapter, periodAdapter, sizePriceAdapter, purchaseAdapter, paymentMethodAdapter, purchasePaymentMethodAdapter, logisticsAdapter, logisticsCategoryAdapter, logisticsItemAdapter, saleAdapter, companySaleAdapter, companySaleItemAdapter, companySalePaymentMethodAdapter, localSaleAdapter, localSaleDetailAdapter, localSaleDetailItemAdapter, totalReportAdapter;

if (dbType === 'mongo') {
    userAdapter = new MongooseGenericAdapter(User, ['person', 'roles']); // Populate person & roles
    personAdapter = new MongooseGenericAdapter(Person);
    brokerAdapter = new MongooseGenericAdapter(Broker, ['person']); // If Broker has a relation with Person
    paymentInfoAdapter = new MongooseGenericAdapter(PaymentInfo, ['person']); // If PaymentInfo has Person relation
    roleAdapter = new MongooseGenericAdapter(Role);
    companyAdapter = new MongooseGenericAdapter(Company);
    sizeAdapter = new MongooseGenericAdapter(Size);
    rolePermissionAdapter = new MongooseGenericAdapter(RolePermission);
    optionAdapter = new MongooseGenericAdapter(Option);
    clientAdapter = new MongooseGenericAdapter(Client, ['person', 'buyersItBelongs', 'createdBy']);
    shrimpFarmAdapter = new MongooseGenericAdapter(ShrimpFarm, ['client']);
    periodAdapter = new MongooseGenericAdapter(Period, ['company']);
    sizePriceAdapter = new MongooseGenericAdapter(SizePrice);
    purchaseAdapter = new MongooseGenericAdapter(Purchase);
    paymentMethodAdapter = new MongooseGenericAdapter(PaymentMethod);
    purchasePaymentMethodAdapter = new MongooseGenericAdapter(PurchasePaymentMethod);
    logisticsAdapter = new MongooseGenericAdapter(Logistics);
    logisticsCategoryAdapter = new MongooseGenericAdapter(LogisticsCategory);
    logisticsItemAdapter = new MongooseGenericAdapter(LogisticsItem);
    saleAdapter = new MongooseGenericAdapter(Sale);
    companySaleAdapter = new MongooseGenericAdapter(CompanySale);
    companySaleItemAdapter = new MongooseGenericAdapter(CompanySaleItem);
    companySalePaymentMethodAdapter = new MongooseGenericAdapter(CompanySalePaymentMethod);
    localSaleAdapter = new MongooseGenericAdapter(LocalSale);
    localSaleDetailAdapter = new MongooseGenericAdapter(LocalSaleDetail);
    localSaleDetailItemAdapter = new MongooseGenericAdapter(LocalSaleDetailItem);
    totalReportAdapter = new MongooseGenericAdapter(TotalReport);
}
// else if (dbType === 'postgres') {
//     userAdapter = new PostgresGenericAdapter('User'); // Example usage for Sequelize
//     personAdapter = new PostgresGenericAdapter('Person');
// } else {
//     throw new Error(`Unsupported DB_TYPE: ${dbType}`);
// }

module.exports = { userAdapter, personAdapter, brokerAdapter, paymentInfoAdapter, roleAdapter, companyAdapter, sizeAdapter, rolePermissionAdapter, optionAdapter, clientAdapter, shrimpFarmAdapter, periodAdapter, sizePriceAdapter, purchaseAdapter, paymentMethodAdapter, purchasePaymentMethodAdapter, logisticsAdapter, logisticsCategoryAdapter, logisticsItemAdapter, saleAdapter, companySaleAdapter, companySaleItemAdapter, companySalePaymentMethodAdapter, localSaleAdapter, localSaleDetailAdapter, localSaleDetailItemAdapter, totalReportAdapter };
