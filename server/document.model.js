import mongoose from "mongoose";

const docSchema = new mongoose.Schema({
    _id: String,
    doc: Object
}, {timestamps: true});

const docModel = mongoose.model("docs", docSchema);
export default docModel;