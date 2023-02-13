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
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';

//http://localhost:3000/auth/google/secrets

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
  username: {type: String},
  // password: {type: String},
  googleId: {type: String},
  secret: {type: String},
});

// userSchema.plugin(mongooseEncryption, {secret: process.env.SECRET, encryptedFields: ["password"]});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);

  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

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
    User.register({username: username}, password, function(err, user) {
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
.get(async (req, res) => {
  // req.isAuthenticated() ? res.render("secrets") : res.redirect("login");
  const result = await User.find({"secret": { $ne: null }});
  let allSecrets = [];
  if(result){
    result.forEach(function(item){
      console.log(item.secret);
      allSecrets.push(item.secret);
    })
  }
  res.render("secrets", {content: allSecrets});
});

app.route("/logout")
.get((req, res) => {
  req.logout((err) => {
    err ? console.log(err) : res.redirect("/");
  });
})

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.route("/submit")
.get((req, res) => {
  req.isAuthenticated() ? res.render("submit") : res.redirect("/login");
})
.post(async (req, res) => {
  // console.log(req.body);
  // console.log(req.user);
  console.log("submitting secret");
  const result = await User.findOne({_id: req.user._id});
  // console.log(result);
  if(result){
    result.secret = req.body.secret;
    result.save();
  }
  res.redirect("/secrets");
});

app.listen(process.env.PORT || 3000, () => console.log("Server listening in port 3000"));