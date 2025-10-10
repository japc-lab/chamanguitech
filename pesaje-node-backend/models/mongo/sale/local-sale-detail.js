const { Schema, model } = require('mongoose');

const SaleStyleEnum = require('../../../enums/sale-style.enum');

const LocalSaleDetailSchema = Schema({
  localSale: {
    type: Schema.Types.ObjectId,
    ref: 'LocalSale',
    required: true
  },
  style: {
    type: String,
    enum: SaleStyleEnum,
    required: true,
  },
  items: [{
    type: Schema.Types.ObjectId,
    ref: 'LocalSaleDetailItem',
    required: true
  }],
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  receivedGrandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  poundsGrandTotal: {
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


LocalSaleDetailSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('LocalSaleDetail', LocalSaleDetailSchema);