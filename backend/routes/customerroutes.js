import express from "express";
import { generatetoken, getuserbyemail,generateUniqueActivationToken,generateOTP, verifyotp,insertverifyuser } from "../controllers/customercontroller.mjs";
import bcrypt from "bcrypt"
import { customermodel } from "../models/customermodel.mjs"
import { usermodel } from "../models/verify.js";
import nodemailer from "nodemailer"


const router = express.Router();


//register
router.post("/registered",async(req,res)=>{
    try {
        //check user already exist
        // check controller folder to get to know about getuserbyemail
        let Customer = await getuserbyemail(req)
        if(Customer){
            return res.status(400).json({error:"user already exist"})
        }


        // generate hashed password
        const salt = await bcrypt.genSalt(10)
        const hashedpassword = await bcrypt.hash(req.body.password,salt)


        //generate activation token (check controllers folder)
        const token = generatetoken(req.body.email);
        Customer = await new usermodel({
            ...req.body,
            password:hashedpassword,
            token 
        }).save();
        
        
        res.status(201).json({message:"successfully registered ",token})


    } catch (error) {
        console.log(error)
        res.status(500).json({error:"internal error"})
    }
})


//-------------------------------------------------------------------------------------------------

//login
router.post("/login", async (req, res) => {
  try {
      const Customer = await getuserbyemail(req);
      if (!Customer) {
          return res.status(404).json({ error: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(req.body.password, Customer.password);
      if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid password" });
      }

      const token = generatetoken(Customer._id);
      res.json({ message: "Login successful", token });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal error" });
  }
});




//-------------------------------------------------------------------------------------------------
//forget password
router.post("/forgetpassword", async (req, res) => {
  try {
    let Customer = await getuserbyemail(req); // check controller folder to get to know about getuserbyemail

    if (!Customer) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const otp = generateOTP();

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'otismelbourn22@gmail.com',
        pass: 'xpur qesj lfvz fwhe'
      }
    });  
    
  const mailConfigurations = { 
    
      from: 'otismelbourn22@gmail.com',
      to: req.body.email,
      subject: 'Forget Password Email',
        
      // This would be the text of email body 
      text: `your OTP  ${otp}  Thanks.` 
        
  }; 
    
  transporter.sendMail(mailConfigurations, function(error, info) {
      if (error) {
          console.error(error);
          return res.status(500).json({ error: 'Email could not be sent' });
      }
      console.log('Email Sent Successfully');
      console.log(info);
  });
  

    // Save the OTP to the user model
    Customer.otp = otp;
    await Customer.save();

    res.status(200).json({ message: "OTP generated successfully", otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});
 
///--------------------------------------------------------

router.post("/verifyotp", async (req, res) => {
    // Retrieve the user by email from your database
    let Customer = await getuserbyemail(req);
  
    if (!Customer) {
      return res.status(400).json({ error: "User does not exist" });
    }
  
    // Check if the stored OTP matches the one provided by the user
    let otpUser = await verifyotp(req);
  
    if (!otpUser) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
  
    // Check if the OTP user matches the user retrieved by email
    if (Customer._id.toString() !== otpUser._id.toString()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
  
    // If the OTP is valid, you can update the user's status or reset their password as needed

    await Customer.save();
  
    // Respond to the client with a success message
    res.status(200).json({ message: "OTP verified successfully" });
  });


//--------------------------------------------------------

//changepassword

router.post("/changepassword", async (req, res) => {
    let Customer = await getuserbyemail(req);
  
    if (!Customer) {
      return res.status(400).json({ error: "User not exist" });
    }

        // Update the user's password with the new password
        const hashedPassword = await bcrypt.hash(req.body.newpassword, 10); // Use newPassword here
        Customer.password = hashedPassword; // Update the user's password
    
        // Save the updated user data
        await Customer.save();
    
        res.json({ message: 'Password changed successfully' });
  
 });
  
  

export const userRouter = router;