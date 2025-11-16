const { Schema, model } = require('mongoose');

const LocalSaleStatusEnum = require('../../../enums/local-sale-status.enum');

const LocalSaleSchema = Schema({
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
    required: function () { return this.status !== 'DRAFT'; }
  },
  status: {
    type: String,
    enum: LocalSaleStatusEnum,
    required: true,
  },
  wholeRejectedPounds: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; }
  },
  trashPounds: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; }
  },
  totalProcessedPounds: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
  },
  wholeTotalPounds: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; }
  },
  moneyIncomeForRejectedHeads: {
    type: Number,
  },
  grandTotal: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  seller: {
    type: String,
    required: function () { return this.status !== 'DRAFT'; },
  },
  localCompanySaleDetail: {
    type: Schema.Types.ObjectId,
    ref: 'LocalCompanySaleDetail',
  },
  hasInvoice: {
    type: String,
    required: function () { return this.status !== 'DRAFT'; },
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