const { Schema, model } = require('mongoose');

const TimeOfDayEnum = require('../../../enums/time-of-day.enum');

const PeriodSchema = Schema({

  name: {
    type: String,
    required: true
  },
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
    required: true,
  },
  timeOfDay: {
    type: String,
    enum: TimeOfDayEnum,
  },
  receivedDateTime: {
    type: Date,
    required: true
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

// 🔹 Ensure `name` is unique within the same `company`
PeriodSchema.index({ name: 1, company: 1 }, { unique: true });

PeriodSchema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

// 🔹 Ensure indexes are properly synchronized during schema initialization
PeriodSchema.on('index', (error) => {
  if (error) console.error('❌ Indexing error:', error);
});

module.exports = model('Period', PeriodSchema);