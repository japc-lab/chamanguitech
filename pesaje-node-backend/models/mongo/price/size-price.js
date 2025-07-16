const { Schema, model } = require('mongoose');

const SizePriceSchema = Schema({

  size: {
    type: Schema.Types.ObjectId,
    ref: 'Size',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  period: {
    type: Schema.Types.ObjectId,
    ref: 'Period',
    required: true
  },
},
  { timestamps: true },
);

SizePriceSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('SizePrice', SizePriceSchema);