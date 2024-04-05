import { customermodel } from "../models/customermodel.mjs"
import { usermodel } from "../models/verify.js";
import jwt  from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { request } from "http";


//this function help us to find the email is already registered or not 
export function getuserbyemail(request){
  try {
      return usermodel.findOne({
          email: request.body.email
      });
  } catch (error) {
      console.error("Error in getuserbyemail:", error);
      throw error; // Rethrow the error to be caught by the calling function
  }
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

//this function checks the token and if tokens matches ,remove the data from the usermodel  and move our data to customermodel
  export async function insertverifyuser(token) {
    try {
        const userverify = await usermodel.findOne({ token: token });

        if (userverify) {
            const newuser = new customermodel({
                username: userverify.username,
                email: userverify.email,
                password: userverify.password,
                token:userverify.token
            });

            await newuser.save();
            await usermodel.deleteOne({ token: token });

        } 
    } catch (error) {
        console.error(error);
        return `<p>Error occurred</p><h4>Registration failed</h4>`;
    }
}


//this function generate otp
export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000);
}


export async function verifyotp(request) {
  const userEnteredOTP = request.body.otp; // Assuming the client sends OTP in the request body

  // Query the database for a user with the provided OTP
  return await usermodel.findOne({ otp: userEnteredOTP });
}

