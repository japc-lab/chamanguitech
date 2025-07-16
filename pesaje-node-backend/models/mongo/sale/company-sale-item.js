const { Schema, model } = require('mongoose');

const SaleStyleEnum = require('../../../enums/sale-style.enum');

const CompanySaleItemSchema = Schema({
  style: {
    type: String,
    enum: SaleStyleEnum,
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  pounds: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  referencePrice: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
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


CompanySaleItemSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('CompanySaleItem', CompanySaleItemSchema);