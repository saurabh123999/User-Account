const express = require('express');
const app=express();
const userModel=require("./models/user");
const postModel=require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());
const crypto=require('crypto');
const path = require('path');
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
   crypto.randomBytes(12,function(err,bytes){
    const fn = bytes.toString("hex")+ path.extname("file.originalname");
   })
    cb(null, fn)
  }

})

const upload = multer({ storage: storage })



app.get('/',(req,res)=>{
    res.render("index");
})

app.get('/test', (req,res)=>{
    res.render("test");
})

app.post('/upload',upload.single('image'), (req,res)=>{
    console.log(req.file);
})

app.get('/login',(req,res)=>{
    res.render("login");
})

app.get('/profile',isLoggedIn,async (req,res)=>{
    let user=await userModel.findOne({email:req.user.email}).populate("posts");
    
    res.render("profile",{user});
})


app.post('/post',isLoggedIn,async (req,res)=>{
    let user=await userModel.findOne({email:req.user.email});
   let {content}=req.body;
   let post=await postModel.create({
    user:user._id,
    content
   })
   user.posts.push(post._id);
   await user.save();
   res.redirect("/profile");
})


app.post('/register', async (req,res)=>{
    let {email, password,username,name,age}=req.body;

    let user= await userModel.findOne({email});
    if(user){ 
        return res.send("user already registered");
    }
    bcrypt.genSalt(10, async (err,salt)=>{
        bcrypt.hash(password,salt, async (err, hash)=>{
           let user= await userModel.create({
            username,
            email,
            age,
            name,
            password:hash

           })
           let token= jwt.sign({email:email,userId:user._id},"shhhhhh");
           res.cookie("token",token);
           res.send("registered");

        })
    })
})


app.post('/login', async (req,res)=>{
    let {email, password}=req.body;

    let user= await userModel.findOne({email});
    if(!user){ 
        return res.send("something went wrong");
    }
    bcrypt.compare(password, user.password, (err, result)=>{
        if(result){
            let token= jwt.sign({email:email,userId:user._id},"shhhhhh");
            res.cookie("token",token);
            res.redirect("/profile");
        }else{
           res.redirect('/login');
        }
    })
})

app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
})

function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect("/login");
    }

    try {
        let data = jwt.verify(req.cookies.token, "shhhhhh");
        req.user = data;
        next();
    } catch (err) {
        return res.redirect("/login");
    }
}



app.listen(3000);