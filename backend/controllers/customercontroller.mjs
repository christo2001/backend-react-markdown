import { customermodel } from "../models/customermodel.mjs"
import jwt  from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { request } from "http";



export function getuserbyemail(request){
    return customermodel.findOne({
        email:request.body.email
    })
}

export function generatetoken(id) {
    return jwt.sign({ id }, process.env.SECRET_KEY);
  }

export function generateUniqueActivationToken() {
    const randomUuid = uuidv4();
    const hash = crypto.createHash('sha256');
    const activationToken = hash.update(randomUuid).digest('hex');
    return activationToken;
  }

export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000);
}


export async function verifyotp(request) {
  const userEnteredOTP = request.body.otp; // Assuming the client sends OTP in the request body

  // Query the database for a user with the provided OTP
  return await customermodel.findOne({ otp: userEnteredOTP });
}

