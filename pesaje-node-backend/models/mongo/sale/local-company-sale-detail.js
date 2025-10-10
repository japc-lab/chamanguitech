const { Schema, model } = require('mongoose');

const LocalCompanySaleDetailSchema = Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  receiptDate: {
    type: Date,
    required: true,
  },
  personInCharge: {
    type: String,
    required: true,
  },
  batch: {
    type: String,
    required: true,
  },
  guideWeight: {
    type: Number,
    required: true,
  },
  guideNumber: {
    type: String,
    required: true,
  },
  weightDifference: {
    type: Number,
    required: true,
  },
  processedWeight: {
    type: Number,
    required: true,
  },
  items: [{
    type: Schema.Types.ObjectId,
    ref: 'LocalCompanySaleDetailItem',
    required: true
  }],
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

LocalCompanySaleDetailSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('LocalCompanySaleDetail', LocalCompanySaleDetailSchema);