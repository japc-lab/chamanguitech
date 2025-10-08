const { Schema, model } = require('mongoose');

const LocalCompanySaleDetailItemSchema = Schema({
  size: {
    type: String,
    required: true,
  },
  class: {
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
  total: {
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

LocalCompanySaleDetailItemSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('LocalCompanySaleDetailItem', LocalCompanySaleDetailItemSchema);