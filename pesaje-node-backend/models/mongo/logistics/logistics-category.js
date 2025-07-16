const { Schema, model } = require('mongoose');

const LogisticsCategoryEnum = require('../../../enums/logistics-category.enum');

const LogisticsCategorySchema = Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: LogisticsCategoryEnum,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);


LogisticsCategorySchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});


module.exports = model('LogisticsCategory', LogisticsCategorySchema);