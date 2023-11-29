import mongoose from "mongoose";

const customerschema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        maxlength:32,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        trim:true
    },
    isActive: {
        type: Boolean,
        default: false,
      },
      token: {
        type: String,
    },
      activationToken: {
        type: String,
      },
      urlToken: {
        type: String,
      },
      otp:{
        type:String,
      }
})

const customermodel = mongoose.model("Customer", customerschema)
export { customermodel };