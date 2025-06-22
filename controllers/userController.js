const user = require("../models/user");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { generateToken, authenticateToken, isAdmin } = require("../middleware/auth");
console.log("userController loaded");

exports.userList = asyncHandler(async (req, res, next) => {
    const allUsers = await user.find({}).exec();
    res.render("user_list", { title: "GalleryDB users:", user_list: allUsers });
});

// Display user add form on GET (admin only)
exports.user_add_get = [
    authenticateToken,
    isAdmin,
    asyncHandler(async (req, res, next) => {
        res.render("user_add", { 
            title: "Add New User", 
            user: {}, 
            errors: [],
            success: null 
        });
    })
];

// Handle user add on POST (admin only)
exports.user_add_post = [
    authenticateToken,
    isAdmin,
    // Validate and sanitize fields
    body("username")
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage("Username must be between 3 and 50 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username can only contain letters, numbers, and underscores")
        .escape(),
    body("name")
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Name must be between 1 and 100 characters")
        .escape(),
    body("surname")
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Surname must be between 1 and 100 characters")
        .escape(),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    // Process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request
        const errors = validationResult(req);

        // Create a user object with escaped and trimmed data
        const newUser = new user({
            username: req.body.username,
            name: req.body.name,
            surname: req.body.surname,
        });

        if (!errors.isEmpty()) {
            // There are validation errors. Render form again with sanitized values/errors messages
            console.log("Validation errors:", errors.array());
            res.render("user_add", {
                title: "Add New User",
                user: newUser,
                errors: errors.array(),
                success: null
            });
        } else {
            try {
                // Check if user with same username already exists
                const existingUser = await user.findOne({ username: req.body.username }).exec();
                if (existingUser) {
                    // User exists, show error message
                    console.log("User already exists:", req.body.username);
                    res.render("user_add", {
                        title: "Add New User",
                        user: newUser,
                        errors: [{ 
                            param: 'username', 
                            msg: `User with username "${req.body.username}" already exists in the database` 
                        }],
                        success: null
                    });
                } else {
                    // Hash password and save user
                    const hashedPassword = await bcrypt.hash(req.body.password, 10);
                    newUser.password = hashedPassword;
                    await newUser.save();
                    console.log("User added successfully by admin:", newUser.username);
                    res.render("user_add", {
                        title: "Add New User",
                        user: {},
                        errors: [],
                        success: `User "${newUser.username}" has been successfully added to the database by admin!`
                    });
                }
            } catch (error) {
                // Handle database errors
                console.error("Database error:", error);
                res.render("user_add", {
                    title: "Add New User",
                    user: newUser,
                    errors: [{ 
                        param: 'general', 
                        msg: 'An error occurred while saving the user. Please try again.' 
                    }],
                    success: null
                });
            }
        }
    }),
];

// Display login form on GET
exports.user_login_get = asyncHandler(async (req, res, next) => {
    res.render("user_login_form", { 
        title: "User Login", 
        errors: [],
        success: null 
    });
});

// Handle login on POST
exports.user_login_post = [
    // Validate fields
    body("username")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Username is required")
        .escape(),
    body("password")
        .isLength({ min: 1 })
        .withMessage("Password is required"),

    // Process request after validation
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render("user_login_form", {
                title: "User Login",
                errors: errors.array(),
                success: null
            });
        } else {
            try {
                // Find user by username
                const userData = await user.findOne({ username: req.body.username }).exec();
                
                if (!userData) {
                    res.render("user_login_form", {
                        title: "User Login",
                        errors: [{ msg: "Invalid username or password" }],
                        success: null
                    });
                } else {
                    // Check password
                    const isValidPassword = await bcrypt.compare(req.body.password, userData.password);
                    
                    if (!isValidPassword) {
                        res.render("user_login_form", {
                            title: "User Login",
                            errors: [{ msg: "Invalid username or password" }],
                            success: null
                        });
                    } else {
                        // Generate token and set cookie
                        const token = generateToken(userData._id);
                        res.cookie('token', token, { 
                            httpOnly: true, 
                            secure: false, // set to true in production with HTTPS
                            maxAge: 24 * 60 * 60 * 1000 // 24 hours
                        });
                        
                        res.redirect('/');
                    }
                }
            } catch (error) {
                console.error("Login error:", error);
                res.render("user_login_form", {
                    title: "User Login",
                    errors: [{ msg: "An error occurred during login. Please try again." }],
                    success: null
                });
            }
        }
    }),
];

// Handle logout on GET
exports.user_logout_get = asyncHandler(async (req, res, next) => {
    res.clearCookie('token');
    res.redirect('/');
});