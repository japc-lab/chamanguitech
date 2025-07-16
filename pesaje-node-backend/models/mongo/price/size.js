const { Schema, model } = require('mongoose');

const SizeTypeEnum = require('../../../enums/size-type.enum');

const SizeSchema = Schema({

  size: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: SizeTypeEnum,
    required: true
  },
},
  { timestamps: true },
);

SizeSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Size', SizeSchema);