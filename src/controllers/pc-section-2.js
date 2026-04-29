import mongoose from "mongoose";
import PcDetailsModel from "../models/pc_model.js";
import VacEntryModel from "../models/vac-model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { createUploader } from "../middleware/upload-factory.js";
import path from "path";
import fs from "fs";
