const { Schema, model } = require('mongoose');

const SaleTypeEnum = require('../../../enums/sale-type.enum');

const SaleSchema = Schema({
  purchase: {
    type: Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true
  },
  saleDate: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: SaleTypeEnum,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

SaleSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Sale', SaleSchema);