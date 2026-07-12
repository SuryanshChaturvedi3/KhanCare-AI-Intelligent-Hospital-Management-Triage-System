const Appointment = require("../models/Appointment");
const User = require("../models/User");


// ================= AUTO CANCEL EXPIRED APPOINTMENTS =================
const cancelExpiredAppointments = async () => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    await Appointment.updateMany(
      {
        appointmentDate: { $lt: today },
        status: "Pending"
      },
      {
        $set: { status: "Cancelled" }
      }
    );

  } catch (error) {
    console.log("Auto Cancel Error:", error);
  }
};


// ================= CREATE APPOINTMENT =================
const createAppointment = async (req, res) => {
  try {

    await cancelExpiredAppointments(); // 🔥 expired appointments clean

    const { department, date } = req.body;
    const patientId = req.user.id;

    // --- 1. PAST DATE VALIDATION ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fix timezone: "2024-07-13" → treat as local date, not UTC
    const [year, month, day] = date.split("-").map(Number);
    const bookingDate = new Date(year, month - 1, day);

    if (bookingDate < today) {
      return res.status(400).json({
        message: "You cannot book an appointment for a past date!",
      });
    }

    // --- 2. CHECK EXISTING PENDING APPOINTMENT ---
    const existing = await Appointment.findOne({
      patientId,
      status: "Pending",
    });

    if (existing) {
      return res.status(400).json({
        message: "Wait for your Number, appointment already exists",
      });
    }

    // --- 3. GET LAST TOKEN ---
    const lastAppointment = await Appointment.findOne({
      department,
      appointmentDate: bookingDate,
    }).sort({ tokenNumber: -1 });

    const newTokenNumber = lastAppointment
      ? lastAppointment.tokenNumber + 1
      : 1;

    // --- 4. CREATE NEW APPOINTMENT ---
    const newAppointment = await Appointment.create({
      patientId,
      department,
      appointmentDate: bookingDate,
      tokenNumber: newTokenNumber,
      status: "Pending",
    });

    return res.status(201).json({
      message: "Booking Successfully",
      data: newAppointment,
    });

  } catch (error) {
    console.log("Create Appointment Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// ================= GET ALL APPOINTMENTS =================
const getAllAppointments = async (req, res) => {
  try {

    await cancelExpiredAppointments(); // 🔥 auto clean

    const allAppointments = await Appointment.find({})
      .populate("patientId", "name email phone")
      .sort({ appointmentDate: -1, tokenNumber: 1 });

    res.status(200).json({ success: true, data: allAppointments });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= LIVE STATUS =================
const getLiveStatus = async (req, res) => {
  try {

    await cancelExpiredAppointments(); // 🔥 auto clean

    const patientId = req.user.id;

    const activeAppt = await Appointment.findOne({
      patientId,
      status: "Pending",
    }).sort({ createdAt: -1 });

    if (!activeAppt) {
      return res.status(200).json({
        success: true,
        hasActiveAppointment: false,
        message: "No active appointments",
      });
    }

    const peopleAhead = await Appointment.countDocuments({
      department: activeAppt.department,
      appointmentDate: activeAppt.appointmentDate,
      status: "Pending",
      tokenNumber: { $lt: activeAppt.tokenNumber },
    });

    const currentPosition = peopleAhead + 1;

    res.status(200).json({
      success: true,
      hasActiveAppointment: true,
      data: {
        originalToken: activeAppt.tokenNumber,
        currentPosition,
        department: activeAppt.department,
        appointmentDate: activeAppt.appointmentDate,
      },
    });

  } catch (error) {
    console.log("Live Status Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= MARK COMPLETED =================
const MarkAsCompleted = async (req, res) => {
  try {

    const CheckedUp = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "Completed" },
      { new: true }
    );

    if (!CheckedUp) {
      return res.status(404).json({ message: "Appointment not found!" });
    }

    await sendAppointmentAlerts(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Patient checkup completed! Queue moved.",
      data: CheckedUp,
    });

  } catch (error) {
    console.error("MarkAsCompleted Error:", error);
    return res.status(500).json({ message: "Server error during completion" });
  }
};


// ================= Doctors Portal =================
const getDoctorAppointments = async (req, res) => {
  try {

    await cancelExpiredAppointments(); // 🔥 auto clean

    const doctorId = req.user.id;

    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    const doctorProfile =
      await User.findById(doctorId).select("department role");

    if (!doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    if (doctorProfile.role !== "doctor") {
      return res
        .status(403)
        .json({ message: "Only doctors can access this queue" });
    }

    const myDepartment = doctorProfile.department;

    if (!myDepartment) {
      return res.status(400).json({ message: "Doctor department is not set" });
    }

    const departmentFilter =
      myDepartment === "General Medicine"
        ? { $in: ["General Medicine", "General"] }
        : myDepartment;

    const appointments = await Appointment.find({
      department: departmentFilter,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: "Pending",
    })
      .populate("patientId", "name email phone")
      .sort({ tokenNumber: 1 });

    res.status(200).json({
      success: true,
      department: myDepartment,
      data: appointments,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================= ALERT SYSTEM ================= */
const sendAppointmentAlerts = async (finishedApptId) => {
  try {

    const finishedAppt = await Appointment.findById(finishedApptId);
    if (!finishedAppt) return;

    const pendingPatients = await Appointment.find({
      department: finishedAppt.department,
      status: "Pending",
    })
      .sort({ tokenNumber: 1 })
      .populate("patientId", "name phone");

    const AVG_TIME = 6;

    for (let i = 0; i < pendingPatients.length; i++) {

      const patient = pendingPatients[i];

      const EWT =
        (patient.tokenNumber - finishedAppt.tokenNumber) * AVG_TIME;

      if (EWT > 0 && EWT <= 30 && !patient.isAlertSent) {

        console.log(
          `🚨 Alert: Patient ${patient.patientId.name}, your token #${patient.tokenNumber} is coming up in approx ${EWT} mins!`
        );

        await Appointment.findByIdAndUpdate(patient._id, {
          isAlertSent: true,
        });
      }
    }

  } catch (error) {
    console.error("Alert System Error:", error);
  }
};


module.exports = {
  createAppointment,
  getLiveStatus,
  getAllAppointments,
  MarkAsCompleted,
  getDoctorAppointments,
  sendAppointmentAlerts,
};