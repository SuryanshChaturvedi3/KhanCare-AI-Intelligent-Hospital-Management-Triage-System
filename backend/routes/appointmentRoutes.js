const express = require ('express')
const router = express.Router()

const {createAppointment, getLiveStatus, getAllAppointments,MarkAsCompleted, getDoctorAppointments}= require("../controller/appointmentController")
const {authenticateJWT} = require("../middleware/authMiddleware")


router.post("/appointment",authenticateJWT,createAppointment)
router.get("/status",authenticateJWT,getLiveStatus)
router.get("/receptionist", authenticateJWT,getAllAppointments)
router.put('/complete/:id', authenticateJWT, MarkAsCompleted)
router.get("/doctor", authenticateJWT,getDoctorAppointments)


module.exports = router;