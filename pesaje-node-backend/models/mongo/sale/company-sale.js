const { Schema, model } = require('mongoose');

const CompanySaleStatusEnum = require('../../../enums/company-sale-status.enum');

const CompanySaleSchema = Schema({
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
    required: function () { return this.status !== 'DRAFT'; }
  },
  batch: {
    type: String,
    required: function () { return this.status !== 'DRAFT'; }
  },
  provider: {
    type: String,
    required: function () { return this.status !== 'DRAFT'; }
  },
  receptionDate: {
    type: Date,
    required: function () { return this.status !== 'DRAFT'; },
  },
  settleDate: {
    type: Date,
    required: function () { return this.status !== 'DRAFT'; },
  },
  predominantSize: {
    type: String,
    required: function () { return this.status !== 'DRAFT'; },
  },
  wholeReceivedPounds: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
  },
  trashPounds: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
  },
  netReceivedPounds: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
  },
  processedPounds: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
  },
  performance: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
  },
  poundsGrandTotal: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  grandTotal: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  percentageTotal: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  status: {
    type: String,
    enum: CompanySaleStatusEnum,
    required: false,
  },
  wholeDetail: {
    type: Schema.Types.ObjectId,
    ref: 'CompanySaleWholeDetail',
  },
  tailDetail: {
    type: Schema.Types.ObjectId,
    ref: 'CompanySaleTailDetail',
  },
  summaryPoundsReceived: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  summaryPerformancePercentage: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
  },
  summaryRetentionPercentage: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  summaryAdditionalPenalty: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
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