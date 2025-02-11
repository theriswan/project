require("dotenv").config({ path: ".env" });
const mongodb=require('./config/mongodb')
const express=require('express');
const app=express();
const nocache=require('nocache')
const cookieParser=require('cookie-parser');
const PORT=process.env.PORT;
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(nocache());
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({extended:true}));
const user_route=require('./router/userRouter');
app.use('/',user_route);
const admin_route=require('./router/adminRouter');
app.use('/admin',admin_route);
app.listen(PORT,()=>{
    console.log(`server on:http://localhost:${PORT}`);
})