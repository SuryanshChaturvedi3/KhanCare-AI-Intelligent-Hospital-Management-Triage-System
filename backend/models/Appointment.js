const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", 
      
    },
    department: {
      type: String,
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    appointmentDate: {
      type: Date,
      required:true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isAlertSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

appointmentSchema.index(
  { department: 1, appointmentDate: 1, tokenNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);