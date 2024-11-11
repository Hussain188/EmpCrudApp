const express=require("express")
const mongoose=require('mongoose')
const dotEnv=require("dotenv")
const ejs=require('ejs')
const session=require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const User = require("./models/User")
const Employee=require('./models/Employee')
const app=express()
const bcrypt = require('bcryptjs');

const cors = require('cors');
app.use(cors());

dotEnv.config()

const port=process.env.port||5000

app.set('view engine','ejs')

app.use(express.static('public'));

mongoose.connect(process.env.mongo_uri).then(()=>{
    console.log("db connected")
}).catch((err)=>{
    console.log("error while conneting",err)
})

const store=new MongoDBStore({
    uri:process.env.mongo_uri,
    collection:"my session",

})



  app.use(session({
    secret: 'This is a secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to false for local development
    store: store
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

  const checkAuth=(req,res,next)=>{
    if(req.session.isAuthicated)
    {
        next()
    }else{
        res.redirect('/signup')
    }

  }
app.get('/signup',(req,res)=>{
   res.render('register')
})

app.get('/login',(req,res)=>{
    res.render('login')

})



app.get('/dashboard', (req, res) => {
    if (req.session.isAuthicated && req.session.person) {
        res.render('welcome', { userName: req.session.person });
        
    } else {
        res.redirect('/login');
    }
});

const multer = require('multer');

const fs = require('fs');
const path = require('path');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsPath = path.join(__dirname, 'uploads'); // Make the path absolute
        cb(null, uploadsPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});


const upload = multer({ storage: storage });


app.post('/create-employee', upload.single('f_Image'), async (req, res) => {
    const { f_Name, f_Email, f_Mobile, f_Designation, f_Gender, f_Courses } = req.body;
    const profile = req.file;
    
    const date = new Date();  // Get current date
const options = { 
    year: '2-digit', 
    month: 'short', 
    day: '2-digit' 
};
const formattedDate = date.toLocaleDateString('en-GB', options).replace(',', '').replace(/ /g, '-');
console.log(formattedDate);  // Output: 13-Feb-21 (for example)

    let userdata=await Employee.findOne({f_Email})
    if(userdata)
    {
        res.status(200).send("Email already exist ");
    }else{

        fs.readFile(profile.path, (err, data) => {
            if (err) {
                return res.status(500).send("Error reading file: " + err.message);
            }
    
            const base64Image = data.toString('base64');
            const courses = Array.isArray(f_Courses) ? f_Courses : [f_Courses];
            
         
            const newEmployee = new Employee({
                f_Name,
                f_Email,
                f_Mobile,
                f_Designation,
                f_Gender,
                f_Courses: courses, 
                createddate:formattedDate,
                profile: base64Image
            });
    
            
    
            // Save the employee to the database
            newEmployee.save()
                .then(() => {
                    res.status(200).send("Employee created successfully!");
                    
                    
                })
                .catch((error) => {
                    console.error("Error saving employee:", error);
                    res.status(500).send("Error saving employee: " + error.message);
                });
        });

    }
   
});



app.get('/getlist', async (req, res) => {
    try {
        const userdata = await Employee.find();
    // Check if the server is sending the data correctly
        res.render('employeeList', { userdata }); // Render the EJS template with data
    } catch (error) {
        console.error('Error fetching employee list:', error);
        res.status(500).send("Error fetching employee list");
    }
});



app.get('/update-employee/:email', (req, res) => {
    const email = req.params.email;
    // Fetch the employee data from the database using the email
    Employee.findOne({ f_Email: email })
        .then(employee => {
            if (employee) {
                // Pass employee data to the view
                res.render('updateemployee', { employeeData: employee });
                // res.render('updateemployee', { userName: req.session.person, employeeData: employee });
            } else {
                res.status(404).send('Employee not found');
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal server error');
        });
});

const upload1 = multer({ dest: 'uploads/' }); 

app.post('/update-employee/:email', upload.single('f_Image'), async (req, res) => {
    const email = req.params.email;
    console.log('Email:', email);

    
    console.log('File Data:', req.file);

   
    console.log('Form Data:', req.body);

    try {
        const updateData = req.body; 
        
        if (req.file) {
            updateData.f_Image = req.file.path;  
        }

        // Find and update the employee document
        const employee = await Employee.findOneAndUpdate({ f_Email: email }, updateData, { new: true });

        if (employee) {
            res.status(200).send('Employee updated successfully');
        } else {
            res.status(404).send('Employee not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating employee');
    }
});

app.post('/delete-employee/:email', upload.single('f_Image'), async (req, res) => {
    const email = req.params.email;
    console.log('Email:', email);

    
    console.log('File Data:', req.file);

   
    console.log('Form Data:', req.body);

    try {
        const updateData = req.body; 
        
        if (req.file) {
            updateData.f_Image = req.file.path;  
        }

        // Find and update the employee document
        const employee = await Employee.findOneAndDelete({ f_Email: email });

        if (employee) {
            res.status(200).send('Delete successfully');
        } else {
            res.status(404).send('Employee not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating employee');
    }
});


app.post("/register", async (req, res) => {
    const { username, email, password } = req.body; // Ensure these match the form field names
    let userdata=await User.findOne({email})
    if(userdata)
    {
        return res.redirect("/signup")
    }
    const hashPass=await bcrypt.hash(password,12)
    userdata=new User({
        username,
        email,
        password:hashPass,

    })
    req.session.person=userdata.username
    await userdata.save()
    res.redirect('/login')

});


app.post("/user-login", async (req, res) => {
    const { email, password } = req.body;
    

    try {
        let user = await User.findOne({ email });
         
       
        if (!user) {
            return res.status(401).send('<script>alert("Invalid login details"); window.location.href="/login";</script>');
        }

        const checkpass = await bcrypt.compare(password, user.password);
        if (!checkpass) {
            return res.status(401).send('<script>alert("Invalid login details"); window.location.href="/login";</script>');
        }
        
        req.session.isAuthicated = true;
        req.session.person = user.username;
      
        res.redirect('/dashboard');
    } catch (err) {
        console.error("Error during user login:", err);
        res.status(500).send("Internal server error");
    }
});


app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err)throw  err;
        res.redirect('/login')
    })
})

app.listen(port,()=>{
    console.log(`server running on ${port}`);
})


