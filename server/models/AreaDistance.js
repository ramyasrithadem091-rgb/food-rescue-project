const mongoose = require("mongoose");

const areaDistanceSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true
    },

    fromArea: {
      type: String,
      required: true,
      trim: true
    },

    toArea: {
      type: String,
      required: true,
      trim: true
    },

    distanceKm: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

areaDistanceSchema.index({
  city: 1,
  fromArea: 1,
  toArea: 1
});

module.exports =
  mongoose.model(
    "AreaDistance",
    areaDistanceSchema
  );