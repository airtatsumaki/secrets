import express from "express";
import dotenv from "dotenv";
// import md5 from "md5";
dotenv.config();
import mongoose, { Schema } from "mongoose";
mongoose.set("strictQuery", true);
// import bcrypt from 'bcrypt';
// import mongooseEncryption from 'mongoose-encryption';
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();
// instead of body-parser
app.use(express.urlencoded({extended: true})); 
app.use(express.json());

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
  // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

// const url = "mongodb+srv://naz:" + process.env.PASSWORD + "@cluster0.lgbc6oy.mongodb.net/blogsitev2";
const url = "mongodb://localhost:27017/userDB";
try {
  await mongoose.connect(url);
} catch (error) {
  console.log(error);
}

const userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  password: {type: String, required: true}
});

// userSchema.plugin(mongooseEncryption, {secret: process.env.SECRET, encryptedFields: ["password"]});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.route("/register")
  .get(async (req, res) => {
    res.render("register", {result: "none"});
  })
  .post(async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log(username, password);
    User.register({username: username, password: password}, password, function(err, user) {
      if (err) {
        console.log(err);
        res.render("register", {result: "error"});
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("secrets");
        });
      }
      // const authenticate = User.authenticate();
      // authenticate('username', 'password', function(err, result) {
      //   if (err) {

      //   }
      //   // Value 'result' is set to false. The user could not be authenticated since the user is not active
      // });
    });
    
    
    
    // try{
    //   const username = req.body.username;
    //   // const password = md5(req.body.password);
    //   const password = bcrypt.hashSync(req.body.password, 10);
    //   const result = await User.findOne({email: username});
    //   if(result){
    //     res.render("register", {result: "error"});
    //   } else {
    //     const newUser = new User({email: username, password: password});
    //     await newUser.save();
    //     res.redirect("login");
    //   }
    // } catch (error) {
    //   console.log(error);
    // }
  });

app.route("/login")
.get(async (req, res) => {
  res.render("login", {result: "none"});
})
.post(async (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  
  req.login(user, function (err) {
    if(err){
        console.log("line 114");
    }
    passport.authenticate("local", {failureRedirect: '/login'})(req, res, () => {
      res.redirect("secrets");
    });
  })
  
  // try{
  //   const username = req.body.username;
  //   // const password = md5(req.body.password);
  //   const password = req.body.password;
  //   const result = await User.findOne({email: username});
  //   console.log(result);
  //   if(result){
  //     if(bcrypt.compareSync(req.body.password, result.password)){
  //       res.redirect("secrets");
  //     }
  //     else{
  //       res.render("login", {result: "error"});
  //     }
  //   } else {
  //     res.render("login", {result: "error"});
  //   }
  // } catch (error) {
  //   console.log(error);
  // }
})

app.route("/secrets")
.get((req, res) => {
  req.isAuthenticated() ? res.render("secrets") : res.redirect("login");
})

app.route("/logout")
.get((req, res) => {
  req.logout((err) => {
    err ? console.log(err) : res.redirect("/");
  });
})

app.listen(process.env.PORT || 3000, () => console.log("Server listening in port 3000"));