var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const jwt = require('jsonwebtoken');
const user = require('./models/user');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var galleriesRouter = require('./routes/galleries');
var imagesRouter = require('./routes/images');
var statsRouter = require('./routes/stats');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Serve images under /galleries path for easier access
app.use('/galleries', express.static(path.join(__dirname, 'public/images')));

// Middleware to add user info to all views
app.use(async (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const userData = await user.findById(decoded.userId).exec();
            res.locals.loggedUser = userData;
        } catch (error) {
            res.locals.loggedUser = null;
        }
    } else {
        res.locals.loggedUser = null;
    }
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/galleries', galleriesRouter);
app.use('/images', imagesRouter);
app.use('/stats', statsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const mongoDB = process.env.MONGODB_URI || "mongodb://localhost:27017/GalleryDB"; 
main().catch((err) => console.log(err)); 
async function main() { 
  await mongoose.connect(mongoDB);
  
  // Create default admin account if it doesn't exist
  const bcrypt = require('bcrypt');
  
  try {
    const adminExists = await user.findOne({ username: 'admin' }).exec();
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new user({
        username: 'admin',
        name: 'Administrator',
        surname: 'System',
        password: hashedPassword
      });
      await adminUser.save();
      console.log('✅ Default admin account created successfully!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change the password after first login!');
    }
  } catch (error) {
    console.log('❌ Error creating default admin account:', error.message);
  }
}

module.exports = app;
