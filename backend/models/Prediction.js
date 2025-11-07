const mongoose = require('mongoose');
const { Schema } = mongoose;

const predictionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true }, // e.g., /uploads/filename.jpg
    diseaseName: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 }
  },
  { timestamps: { createdAt: 'date', updatedAt: 'dateUpdated' } }
);

module.exports = mongoose.model('Prediction', predictionSchema);