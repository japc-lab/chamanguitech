const { Schema, model } = require('mongoose');

const { LogisticsTypeEnum, LogisticsStatusEnum } = require('../../../enums/logistics.enums');


const LogisticsSchema = Schema({
  purchase: {
    type: Schema.Types.ObjectId,
    ref: 'Purchase',
    required: function () { return this.status !== 'DRAFT'; }
  },
  logisticsDate: {
    type: Date,
    required: function () { return this.status !== 'DRAFT'; },
  },
  type: {
    type: String,
    enum: LogisticsTypeEnum,
    required: function () { return this.status !== 'DRAFT'; },
  },
  grandTotal: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  logisticsSheetNumber: {
    type: String,
    required: function () { return this.status !== 'DRAFT'; }
  },
  items: [{
    type: Schema.Types.ObjectId,
    ref: 'LogisticsItem',
    required: function () { return this.status !== 'DRAFT'; }
  }],
  payments: [{
    type: Schema.Types.ObjectId,
    ref: 'LogisticsPayment',
    required: function () { return this.status !== 'DRAFT'; }
  }],
  status: {
    type: String,
    enum: LogisticsStatusEnum,
    required: false,
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

LogisticsSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Logistics', LogisticsSchema);