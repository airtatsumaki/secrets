import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mongoose, { Schema } from "mongoose";
mongoose.set("strictQuery", true);
import mongooseEncryption from 'mongoose-encryption';

const app = express();
// instead of body-parser
app.use(express.urlencoded({extended: true})); 
app.use(express.json());

app.set("view engine", "ejs");
app.use(express.static("public"));

// const url = "mongodb+srv://naz:" + process.env.PASSWORD + "@cluster0.lgbc6oy.mongodb.net/blogsitev2";
const url = "mongodb://localhost:27017/userDB";
try {
  await mongoose.connect(url);
} catch (error) {
  console.log(error);
}

const userSchema = new mongoose.Schema({
  email: {type: String, required: true},
  password: {type: String, required: true}
});

userSchema.plugin(mongooseEncryption, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);



app.get("/", (req, res) => {
  res.render("home");
});

app.route("/register")
  .get(async (req, res) => {
    res.render("register", {result: "none"});
  })
  .post(async (req, res) => {
    try{
      const username = req.body.username;
      const password = req.body.password;
      const result = await User.findOne({email: username});
      if(result){
        res.render("register", {result: "error"});
      } else {
        const newUser = new User({email: username, password: password});
        await newUser.save();
        res.redirect("login");
      }
    } catch (error) {
      console.log(error);
    }
  });

app.route("/login")
.get(async (req, res) => {
  res.render("login", {result: "none"});
})
.post(async (req, res) => {
  try{
    const username = req.body.username;
    const password = req.body.password;
    const result = await User.findOne({email: username});
    if(result){
      if(result.password === password){
        res.redirect("secrets");
      } else {
        res.render("login", {result: "error"});
      }
    } else {
      res.render("login", {result: "error"});
    }
  } catch (error) {
    console.log(error);
  }
})

app.route("/secrets")
.get((req, res) => {
  res.render("secrets");
})

app.route("/logout")
.get((req, res) => {
  res.redirect("login");
})

app.listen(process.env.PORT || 3000, () => console.log("Server listening in port 3000"));