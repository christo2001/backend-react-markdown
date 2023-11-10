import mongoose from "mongoose";

export function databaseconnection(){
    try {
        mongoose.connect(process.env.url)
        console.log("mongo db connected")
    } catch (error) {
        console.log("connection failed",error)
    }
}