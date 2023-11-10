import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { databaseconnection } from "./db.js"
import { userRouter } from "./routes/customerroutes.js";




dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT; // Correct the variable name to uppercase

databaseconnection(); // Call the function to connect to MongoDB

//router
app.use("/api/user", userRouter)


app.listen(PORT, () => {
  console.log('Server is running on port', PORT);
});
