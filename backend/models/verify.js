import mongoose from "mongoose";
import bcrypt from "bcrypt"; // Make sure to import bcrypt

const userschema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        maxlength: 32,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    token: {
        type: String,
        required: true
    },
    otp:{
        type:String,
      }
});

const usermodel = mongoose.model("Verify", userschema);

export { usermodel };