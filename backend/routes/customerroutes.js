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

        const verify = `https://6571caba142d9d0e25297c2b--relaxed-faun-da5d5a.netlify.app/api/user/verify/`



        //sending activation token via mail
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
            subject: 'Activation of your Account',
              
            // This would be the text of email body 
            html: `
    <p>Hi there, you have recently visited our website and entered your email.</p>
    <p>Please follow the given link to verify your email:</p>
    <a href="${verify}">click here to activate your account</a>
    <p>Thanks</p>
  `,
              
        }; 
          
        transporter.sendMail(mailConfigurations, function(error, info) {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Email could not be sent' });
            }
            console.log('Email Sent Successfully');
            console.log(info);
        });
        
        
        res.status(201).json({message:"successfully logged in",token})


    } catch (error) {
        console.log(error)
        res.status(500).json({error:"internal error"})
    }
})

//--------------------------------------------------------------------------------------------
//verifying mail 

// Verification route
router.get('/verify/:token', async (req, res) => {
  try {
    // Use insertverifyuser function to update user status based on the token
    const response = await insertverifyuser(req.params.token);

    // Find the user by verification token
    const user = await customermodel.findOne({ verificationToken: req.params.token });

    if (user) {
      // Set user as active and save changes
      user.isActive = true;
      await user.save();
      
      // Send success response
      res.status(200).json({ message: response });
    } else {
      // If user not found, or token is invalid or already verified, send error response
      res.status(400).json({ error: "Invalid or already verified token" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    // Use getuserbyemail function to retrieve the user
    let Customer = await getuserbyemail(req);

    if (!Customer) {
      // If user not found, send an error response
      return res.status(400).json({ error: "User not exist" });
    }

    // Check if Customer is not null before accessing its properties
    if (Customer && !Customer.isActive) {
      // If user is not active, send an error response
      return res.status(401).json({ error: 'Account not activated. Check your email for activation instructions.' });
    }

    // Compare the passwords
    const loginpassword = await bcrypt.compare(req.body.password, Customer.password);

    if (!loginpassword) {
      // If password is incorrect, send an error response
      return res.status(404).json({ message: "Incorrect password" });
    }

    // Generate token and send a success response
    const token = generatetoken(Customer._id);
    res.json({ message: "Login successfully", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal error' });
  }
});



//-------------------------------------------------------------------------------------------------
//forget password
router.post("/forgetpassword", async (req, res) => {
    let Customer = await getuserbyemail(req);// check controller folder to get to know about getuserbyemail
  
    if (!Customer) {
      return res.status(400).json({ error: "User not exist" });
    }
  
    const otp = generateOTP();// check controller folder to get to know about  generateOTP

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
  
  
    // Update the user's 'otp' field in the database
    Customer.otp = otp;
    await Customer.save();
  
    res.status(200).json({ message: "OTP generated successfully", otp });
  });
  

///--------------------------------------------------------

// verify otp
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
  
    // Clear the OTP in your database to prevent further use
    Customer.otp = null; // Assuming you have an 'otp' field in your user record
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