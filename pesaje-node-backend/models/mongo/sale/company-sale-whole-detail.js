const { Schema, model } = require('mongoose');

const CompanySaleWholeDetailSchema = Schema({
  batch: {
    type: String,
    required: true
  },
  averagePrice: {
    type: Number,
  },
  settleDate: {
    type: Date,
    required: true,
  },
  predominantSize: {
    type: String,
    required: true,
  },
  totalWholePoundsProcessed: {
    type: Number,
    required: true,
  },
  totalTrashPounds: {
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

CompanySaleWholeDetailSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('CompanySaleWholeDetail', CompanySaleWholeDetailSchema);