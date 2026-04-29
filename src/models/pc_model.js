import mongoose from "mongoose";

const programmeCoordinatorSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    programmeCode: {
      type: String,
      required: true,
      trim: true,
    },
    program_Id: {
      type: String,
      default: "",
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    yearOfIntroduction: {
      type: String,
      required: true,
      trim: true,
    },
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },
    coordinatorName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      enum: ["IT", "Management", "Commerce", "Law"],
    },
    coordinatorEmail: {
      type: String,
      required: true,
      trim: true,
      match: [/.+@.+\..+/, "Invalid email format"],
    },
    programmeName: {
      type: String,
      required: true,
      trim: true,
    },
    coordinatorContact: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9+ -]{10,15}$/, "Invalid contact number"],
    },
    PCdocument: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
     
   

    cbcsStatus: {
  type: String,
  enum: ["Yes", "No"],
  required: true
},
     cbcsYear: {
      type: Number, 
      min: 2000,
  max: 2100,// uploaded file path/name
      default: null
    },

   revisionStatus: {
      type: String,
      enum: ["Yes", "No"],
      required: true
    },
    coursesUpload:{type: String, default: null}, 
    minutesMeeting: {type: String, default: null},
    summaryRevision:  {type: String, default: null},
    newCoursesFile: {type: String, default: null},
    employabilityUpload:  {type: String, default: null}


  },
  { timestamps: true },
);

const PcDetails =
  mongoose.models.PcDetails ||
  mongoose.model("PcDetails", programmeCoordinatorSchema);

export default PcDetails;
