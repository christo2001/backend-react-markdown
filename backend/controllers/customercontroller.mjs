import { customermodel } from "../models/customermodel.mjs"
import jwt  from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { request } from "http";


//this function help us to find the email is already registered or not 
export function getuserbyemail(request){
    return customermodel.findOne({
        email:request.body.email
    })
}

//this function generate json web token 
export function generatetoken(id) {
  const expiresIn = '1h'; // You can specify the expiration time as needed (e.g., '1h' for 1 hour)
  const token = jwt.sign({ id }, process.env.SECRET_KEY, { expiresIn });
  return token;
}

//this function generate unique activation token 
export function generateUniqueActivationToken() {
    const randomUuid = uuidv4();
    const hash = crypto.createHash('sha256');
    const activationToken = hash.update(randomUuid).digest('hex');
    return activationToken;
  }

//this function generate otp
export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000);
}


export async function verifyotp(request) {
  const userEnteredOTP = request.body.otp; // Assuming the client sends OTP in the request body

  // Query the database for a user with the provided OTP
  return await customermodel.findOne({ otp: userEnteredOTP });
}

