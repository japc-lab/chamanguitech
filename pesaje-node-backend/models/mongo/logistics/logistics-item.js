const { Schema, model } = require('mongoose');
const { LogisticsFinanceCategoryEnum, LogisticsResourceCategoryEnum } = require('../../../enums/logistics.enums');

const LogisticsItemSchema = Schema({
  financeCategory: {
    type: String,
    enum: LogisticsFinanceCategoryEnum,
    required: true,
  },
  resourceCategory: {
    type: String,
    enum: LogisticsResourceCategoryEnum,
    required: true,
  },
  unit: {
    type: Number,
    required: true,
    min: 0,
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
  },
  payment: {
    type: Schema.Types.ObjectId,
    ref: 'LogisticsPayment',
    required: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);


LogisticsItemSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('LogisticsItem', LogisticsItemSchema);