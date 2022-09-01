import express, { response } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path"
// import uuidv4 from 'uuidv4';
// import bcrypt from "bcrypt";
// import jsonebtoken from "jsonwebtoken";
import mongoose from "mongoose";
import mongodb from "mongodb";

const app = express();
const __dirname = path.resolve();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    cb(null, uuidv4() + '-' + fileName)
}
});

var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});

// var upload= multer({storage: storage});

mongoose.connect(
  "mongodb://localhost:27017/loginDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
  },
  () => {
    console.log("DB connected ");
  }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  number: String,
  gender: String,
  city: String,
  hobby: Array,
  image:{
    data: Buffer,
    contentType: String
  }
});

const User = new mongoose.model("user", userSchema);
app.get("/users", (req, res) => {
  User.find({}, function (err, users) {
    if (err) {
      res.send({ message: "don't get data" });
    } else {
      res.send(users);
    }
  });
});

// delete data
app.delete("/delete/:id", async (req, res) => {
  console.log("delete user");
  const data = await User.deleteOne({
    _id: new mongodb.ObjectId(req.params.id),
  });
  res.send(data);
});

// get all data
app.get("/findOne/:id", async (req, res) => {
    const data = await User.findOne({_id: new mongodb.ObjectId(req.params.id)});
      res.send(data);
  });

// update data
app.put("/update/:id", async (req, res) => {
  console.log("====",req.params.id);
  console.log("----",req.body)
  User.findOneAndUpdate(
    { _id: req.params.id },
    {
      $set: {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        number: req.body.number,
        gender: req.body.gender,
        city: req.body.city,
        hobby: req.body.hobby,
        image: req.body.image
      },
    }
  )
    .then((result) => {
      res.status(200).json({
        User: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

// add data
app.post("/users", upload.single('image'), (req, res) => {
  // const url = req.protocol + '://' + req.get('host')
  console.log("register", req.body);
    // const image = fs.readFileSync(req.file.path);

  console.log("file", req.file);
  var img = {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      // contentType: 'image/jpeg' || "image/jpg"
    }
  const { name, email, password, number, gender, city, hobby} = req.body;
  // req.body.password = bcrypt.hashSync(req.body.password, 8);
  User.findOne({ email: email }, (err, user) => {
    if (user) {
      res.send({ message: "already register" });
    } else {
      const user = new User({
        name,
        email,
        password,
        number,
        gender,
        city,
        hobby,
        img
      });
      user.save((err) => {
        if (err) {
          res.send(err);
        } else {
          res.send({ message: "login success" });
        }
      });
    }
  });
});

// app.post('/users', upload.single('image'), (req, res, next) => {
//   var image = fs.readFileSync(req.file.path);
//   const url = req.protocol + ':/' + req.get('host');
//   var encode_img = image.toString('base64');
//   var final_image = {
//     contentType:req.file.mimetype,
//     img:new Buffer(encode_img,'base64')
//   };
//
//   const user = new User({
//     // _id: new mongoose.Types.ObjectId(),
//     name: req.body.name,
//     email: req.body.email,
//     password: req.body.password,
//     number: req.body.number,
//     gender: req.body.gender,
//     city: req.body.city,
//     hobby: req.body.hobby,
//     image: req.body.final_image.img
//   });
//   user.save().then(result => {
//     res.status(201).json({
//       message: "User registered successfully!",
//       userCreated: {
//         name: result.name,
//         email: result.email,
//         password: result.password,
//         gender: result.gender,
//         number: result.number,
//         city: result.city,
//         hobby: result.hobby,
//         img: result.image
//       }
//     })
//   }).catch(err => {
//     console.log(err),
//         res.status(500).json({
//           error: err
//         });
//   })
// });

app.listen(8080, () => {
  console.log("BE 8080");
});
