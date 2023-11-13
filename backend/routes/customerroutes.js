import express from "express";
import { generatetoken, getuserbyemail,generateUniqueActivationToken,generateOTP, verifyotp } from "../controllers/customercontroller.mjs";
import bcrypt from "bcrypt"
import { customermodel } from "../models/customermodel.mjs"
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
        const uniqueActivationToken = generateUniqueActivationToken();
        Customer = await new customermodel({
            ...req.body,
            password:hashedpassword,
            uniqueActivationToken
        }).save();



        //generate json web token (check controllers folder)
        const token = generatetoken(Customer._id);
        const verify = `http://localhost:5173/api/user/verify/`



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
            subject: 'Sending Forget Password Email using Node.js',
              
            // This would be the text of email body 
            text: `Hi there, you have recently visited our website and entered your email. 
            Please follow the given link to verify your email:
            ${verify}

            Thanks` 
              
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

router.get('/verify/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Find the user with the provided activation token
        const user = await customermodel.findOne({ uniqueActivationToken: token });

        if (!user) {
            return res.status(404).json({ error: 'Invalid activation token ' });
        }

        // Activate the user's account
        user.isActive = true;
        await user.save();

        res.status(200).json({ message: 'Account activated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal error' });
    }
});


//-------------------------------------------------------------------------------------------------

//login
router.post("/login",async(req,res)=>{
    try {
        let Customer = await getuserbyemail(req)// check controller folder to get to know about getuserbyemail
        const token = generatetoken(Customer._id);// check controller folder to get to know about generatetoken
        if(!Customer){
            return res.status(400).json({error:"user not exist"})
        }
        if (!Customer.isActive) {
          return res.status(401).json({ error: 'Account not activated. Check your email for activation instructions.' });
        }
        
        const loginpassword = await bcrypt.compare(req.body.password, Customer.password);
    
        if(!loginpassword){
            res.status(404).json({message:"incorrect password"})
        }
    
        res.json({message:"login successfully",token})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal error' });
    }

})

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
      subject: 'Sending Forget Password Email using Node.js',
        
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