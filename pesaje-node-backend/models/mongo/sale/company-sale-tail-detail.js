const { Schema, model } = require('mongoose');

const CompanySaleTailDetailSchema = Schema({
  batch: {
    type: String,
    required: true
  },
  performancePercentageTailPounts: {
    type: Number,
    required: true,
    min: 0
  },
  settleDate: {
    type: Date,
    required: true,
  },
  predominantSize: {
    type: String,
    required: true,
  },
  receivedPoundsReported: {
    type: Number,
    required: true,
  },
  totalTailPoundsProcessed: {
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
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

CompanySaleTailDetailSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('CompanySaleTailDetail', CompanySaleTailDetailSchema);