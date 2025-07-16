const { Schema, model } = require('mongoose');

const TotalReportSchema = Schema({
    // Purchase info
    purchaseId: {
        type: Schema.Types.ObjectId,
        ref: 'Purchase',
        required: true
    },
    controlNumber: { type: String, required: true, unique: true },
    responsibleBuyer: { type: String, required: true },
    brokerName: { type: String, required: true },
    purchaseDate: { type: String, required: true },
    clientName: { type: String, required: true },
    averageGramPurchase: { type: Number, required: true },
    pricePurchase: { type: Number, required: true },
    poundsPurchase: { type: Number, required: true },
    totalToPayPurchase: { type: Number, required: true },

    // Sale info
    averageBatchGramsSale: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    wholePoundsReceived: { type: Number, required: true },
    diffPounds: { type: Number, required: true },
    totalToReceiveSale: { type: Number, required: true },
    balanceNet: { type: Number, required: true },

    // Logistics & retention
    logisticsTotalToPay: { type: Number, required: true },
    retention: { type: Number, required: true },
    retentionFactorInput: { type: Number, required: true },

    // Subtotal Gross Profit
    subtotalGrossProfit: { type: Number, required: true },

    // Pay Broker & Qualifier
    totalToPayBroker: { type: Number, required: true },
    payBrokerFactorInput: { type: Number, required: true },
    totalToPayQualifier: { type: Number, required: true },
    payQualifierFactorInput: { type: Number, required: true },

    // Taxes
    taxes: { type: Number, required: true },
    taxesFactorInput: { type: Number, required: true },

    // Total Gross Profit
    totalGrossProfit: { type: Number, required: true },

    // Distribution
    responsibleBuyerProfit: { type: Number, required: true },
    buyerProfitFactorInput: { type: Number, required: true },
    secretaryProfit: { type: Number, required: true },
    secretaryProfitFactorInput: { type: Number, required: true },
    ceoProfit: { type: Number, required: true },
    ceoProfitFactorInput: { type: Number, required: true },
    techLegalProfit: { type: Number, required: true },
    techLegalProfitFactorInput: { type: Number, required: true },
    investCapitalProfit: { type: Number, required: true },
    investCapitalProfitFactorInput: { type: Number, required: true },
    profit: { type: Number, required: true },
    profitFactorInput: { type: Number, required: true },

    // Final Total Factors
    totalFactors: { type: Number, required: true },

    // Soft delete support
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});

TotalReportSchema.method('toJSON', function () {
    const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
    object.id = _id;
    return object;
});

module.exports = model('TotalReport', TotalReportSchema);
