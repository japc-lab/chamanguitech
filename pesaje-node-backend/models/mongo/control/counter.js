const { Schema, model } = require('mongoose');

const CounterSchema = Schema({
    model: { type: String, required: true, unique: true }, // Model name (e.g., "Purchase", "Order")
    seq: { type: Number, default: 0 } // Sequential counter
});

module.exports = model('Counter', CounterSchema);
