import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        courseName: {
            type: String,
            required: true
        },
        courseCode: {
            type: String,
            required: true,
            
        },
        duration: {
            type: Number,
            required: true,
            min: 1
        },
        timesOffered: {
            type: Number,
            required: true,
            min: 1
        },
        studentsEnrolled: {
            type: String,
            default: ""
        },
        studentsCompleted: {
            type: String,
            default: ""
        },
        brochureLink: {
            type: String,
            default: ""
        },
        coordinator: {
            type: String,
            required: true
        },
    },
    { _id: false }
);


const vacEntrySchema = new mongoose.Schema({
    courses: {
        type: [courseSchema],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    programmeCode: {
        type: String,
        default: ""
    },
    program_Id: {
        type: String,
        default: ""
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    uploadedFile: {
        type: String,
        default: null,
    },
    uploadedFilepath: {
        type: String,
        default: null,
    },
    sentToCoordinator: {
        type: Boolean,
        default: false
    },
    sentToCoordinatorAt: {
        type: Date,
        default: null
    },
    studentCount: {
        type: Number,
        default: 0
    },
});

const VacEntry = mongoose.models.VacEntry || mongoose.model("VacEntry", vacEntrySchema);

export default VacEntry;
