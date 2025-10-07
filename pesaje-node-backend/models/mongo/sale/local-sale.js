const { Schema, model } = require('mongoose');

const LocalSaleSchema = Schema({
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  wholeRejectedPounds: {
    type: Number,
    required: true
  },
  trashPounds: {
    type: Number,
    required: true
  },
  totalProcessedPounds: {
    type: Number,
    required: true,
  },
  wholeTotalPounds: {
    type: Number,
    required: true
  },
  moneyIncomeForRejectedHeads: {
    type: Number,
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  seller: {
    type: String,
    required: true,
  },
  details: [{
    type: Schema.Types.ObjectId,
    ref: 'LocalSaleDetail',
    required: true
  }],
  hasInvoice: {
    type: String,
    required: true,
    enum: ['yes', 'no', 'not-applicable']
  },
  invoiceNumber: {
    type: String,
    sparse: true // Allows multiple `null` values while keeping uniqueness for non-null values
  },
  invoiceName: {
    type: String,
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

LocalSaleSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('LocalSale', LocalSaleSchema);