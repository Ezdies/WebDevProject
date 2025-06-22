const gallery = require("../models/gallery");
const user = require("../models/user");
const image = require("../models/image");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { authenticateToken, isAdmin } = require("../middleware/auth");
console.log("galleryController loaded");

exports.galleryList = asyncHandler(async (req, res, next) => {
    const allGalleries = await gallery.find({}).populate('user').exec();
    res.render("gallery_list", { title: "GalleryDB galleries:", gallery_list: allGalleries });
});

// Display gallery add form on GET (requires authentication)
exports.gallery_add_get = [
    authenticateToken,
    asyncHandler(async (req, res, next) => {
        let allUsers = [];
        
        // If user is admin, get all users for dropdown
        if (req.user.username === 'admin') {
            allUsers = await user.find({}).exec();
        }
        
        res.render("gallery_add", { 
            title: "Add New Gallery", 
            gallery: {}, 
            users: allUsers,
            currentUser: req.user,
            errors: [],
            success: null 
        });
    })
];

// Handle gallery add on POST (requires authentication)
exports.gallery_add_post = [
    authenticateToken,
    // Validate and sanitize fields
    body("name")
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage("Gallery name must be between 1 and 200 characters")
        .escape(),
    body("description")
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description must not exceed 500 characters")
        .escape(),

    // Process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request
        const errors = validationResult(req);

        // Determine user ID for the gallery
        let userId = req.user._id;
        
        // If admin and user is selected, use that user's ID
        if (req.user.username === 'admin' && req.body.user) {
            userId = req.body.user;
        }

        // Create a gallery object with escaped and trimmed data
        const newGallery = new gallery({
            name: req.body.name,
            description: req.body.description,
            user: userId,
            date: new Date()
        });

        if (!errors.isEmpty()) {
            // There are validation errors. Render form again with sanitized values/errors messages
            console.log("Validation errors:", errors.array());
            let allUsers = [];
            if (req.user.username === 'admin') {
                allUsers = await user.find({}).exec();
            }
            res.render("gallery_add", {
                title: "Add New Gallery",
                gallery: newGallery,
                users: allUsers,
                currentUser: req.user,
                errors: errors.array(),
                success: null
            });
        } else {
            try {
                // Check if gallery with same name already exists for this user
                const existingGallery = await gallery.findOne({ 
                    name: req.body.name,
                    user: userId 
                }).exec();
                
                if (existingGallery) {
                    // Gallery exists for this user, show error message
                    console.log("Gallery already exists for user:", req.body.name, userId);
                    let allUsers = [];
                    if (req.user.username === 'admin') {
                        allUsers = await user.find({}).exec();
                    }
                    res.render("gallery_add", {
                        title: "Add New Gallery",
                        gallery: newGallery,
                        users: allUsers,
                        currentUser: req.user,
                        errors: [{ 
                            param: 'name', 
                            msg: `Gallery with name "${req.body.name}" already exists for this user` 
                        }],
                        success: null
                    });
                } else {
                    // Data from form is valid and gallery doesn't exist. Save gallery
                    await newGallery.save();
                    console.log("Gallery added successfully:", newGallery.name);
                    let allUsers = [];
                    if (req.user.username === 'admin') {
                        allUsers = await user.find({}).exec();
                    }
                    res.render("gallery_add", {
                        title: "Add New Gallery",
                        gallery: {},
                        users: allUsers,
                        currentUser: req.user,
                        errors: [],
                        success: `Gallery "${newGallery.name}" has been successfully added to the database!`
                    });
                }
            } catch (error) {
                // Handle database errors
                console.error("Database error:", error);
                let allUsers = [];
                if (req.user.username === 'admin') {
                    allUsers = await user.find({}).exec();
                }
                res.render("gallery_add", {
                    title: "Add New Gallery",
                    gallery: newGallery,
                    users: allUsers,
                    currentUser: req.user,
                    errors: [{ 
                        param: 'general', 
                        msg: 'An error occurred while saving the gallery. Please try again.' 
                    }],
                    success: null
                });
            }
        }
    }),
];

// Display gallery browse form on GET (requires authentication)
exports.gallery_browse_get = [
    authenticateToken,
    asyncHandler(async (req, res, next) => {
        const allGalleries = await gallery.find({}).populate('user').exec();
        let selectedGallery = null;
        let images = [];
        
        // Check if gallery parameter is provided in query string
        if (req.query.gallery) {
            try {
                selectedGallery = await gallery.findById(req.query.gallery).populate('user').exec();
                if (selectedGallery) {
                    images = await image.find({ gallery: req.query.gallery }).exec();
                }
            } catch (error) {
                console.error("Error loading gallery:", error);
            }
        }
        
        res.render("gallery_browse", { 
            title: "Browse Gallery", 
            galleries: allGalleries,
            selectedGallery: selectedGallery,
            images: images,
            errors: [],
            success: null 
        });
    })
];

// Handle gallery browse on POST (requires authentication)
exports.gallery_browse_post = [
    authenticateToken,
    body("gallery")
        .isMongoId()
        .withMessage("Please select a valid gallery"),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const allGalleries = await gallery.find({}).populate('user').exec();
            res.render("gallery_browse", {
                title: "Browse Gallery",
                galleries: allGalleries,
                selectedGallery: null,
                images: [],
                errors: errors.array(),
                success: null
            });
        } else {
            try {
                const selectedGallery = await gallery.findById(req.body.gallery).populate('user').exec();
                const images = await image.find({ gallery: req.body.gallery }).exec();
                
                const allGalleries = await gallery.find({}).populate('user').exec();
                
                res.render("gallery_browse", {
                    title: "Browse Gallery",
                    galleries: allGalleries,
                    selectedGallery: selectedGallery,
                    images: images,
                    errors: [],
                    success: null
                });
            } catch (error) {
                console.error("Database error:", error);
                const allGalleries = await gallery.find({}).populate('user').exec();
                res.render("gallery_browse", {
                    title: "Browse Gallery",
                    galleries: allGalleries,
                    selectedGallery: null,
                    images: [],
                    errors: [{ 
                        param: 'general', 
                        msg: 'An error occurred while loading the gallery. Please try again.' 
                    }],
                    success: null
                });
            }
        }
    }),
]; 