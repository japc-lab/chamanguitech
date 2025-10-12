const { Schema, model } = require('mongoose');

const CompanySaleStatusEnum = require('../../../enums/company-sale-status.enum');

const CompanySaleSchema = Schema({
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  receptionDate: {
    type: Date,
    required: true,
  },
  settleDate: {
    type: Date,
    required: true,
  },
  predominantSize: {
    type: String,
    required: true,
  },
  wholeReceivedPounds: {
    type: Number,
    required: true,
  },
  trashPounds: {
    type: Number,
    required: true,
  },
  netReceivedPounds: {
    type: Number,
    required: true,
  },
  processedPounds: {
    type: Number,
    required: true,
  },
  performance: {
    type: Number,
    required: true,
  },
  items: [{
    type: Schema.Types.ObjectId,
    ref: 'CompanySaleItem',
    required: true
  }],
  poundsGrandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  percentageTotal: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: CompanySaleStatusEnum,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

CompanySaleSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('CompanySale', CompanySaleSchema);