import mongoose from "mongoose";

const eventRegistrationSchema = new mongoose.Schema({
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("EventRegistration", eventRegistrationSchema);
