const image = require("../models/image");
const gallery = require("../models/gallery");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { authenticateToken, isAdmin } = require("../middleware/auth");
const { formidable } = require('formidable');
const path = require('path');
const fs = require('fs');
console.log("imageController loaded");

exports.imageList = asyncHandler(async (req, res, next) => {
    const allImages = await image.find({})
        .populate({
            path: 'gallery',
            populate: {
                path: 'user'
            }
        })
        .exec();
    res.render("image_list", { title: "GalleryDB images:", image_list: allImages });
});

// Display image add form on GET (requires authentication)
exports.image_add_get = [
    authenticateToken,
    asyncHandler(async (req, res, next) => {
        let userGalleries = [];
        
        // If user is admin, get all galleries
        if (req.user.username === 'admin') {
            userGalleries = await gallery.find({}).populate('user').exec();
        } else {
            // Get only galleries owned by the current user
            userGalleries = await gallery.find({ user: req.user._id }).populate("user").exec();
        }
        
        res.render("image_form", { 
            title: "Add New Image", 
            image: {}, 
            galleries: userGalleries,
            currentUser: req.user,
            errors: [],
            success: null 
        });
    })
];

// Handle image add on POST (requires authentication)
exports.image_add_post = [
    authenticateToken,
    asyncHandler(async (req, res, next) => {
        const form = formidable({
            uploadDir: path.join(__dirname, '../public/images'),
            keepExtensions: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB limit
            filter: function ({name, originalFilename, mimetype}) {
                // Accept only image files
                return mimetype && mimetype.includes("image");
            }
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Formidable error:", err);
                let userGalleries = [];
                if (req.user.username === 'admin') {
                    userGalleries = await gallery.find({}).populate('user').exec();
                } else {
                    userGalleries = await gallery.find({ user: req.user._id }).populate("user").exec();
                }
                res.render("image_form", {
                    title: "Add New Image",
                    image: {},
                    galleries: userGalleries,
                    currentUser: req.user,
                    errors: [{ 
                        param: 'general', 
                        msg: 'An error occurred while uploading the file. Please try again.' 
                    }],
                    success: null
                });
                return;
            }

            // Validate fields
            const errors = [];
            
            if (!fields.name || fields.name[0].trim().length < 1 || fields.name[0].trim().length > 200) {
                errors.push({ param: 'name', msg: 'Image name must be between 1 and 200 characters' });
            }
            
            if (fields.description && fields.description[0].trim().length > 500) {
                errors.push({ param: 'description', msg: 'Description must not exceed 500 characters' });
            }
            
            if (!fields.gallery || !fields.gallery[0]) {
                errors.push({ param: 'gallery', msg: 'Please select a gallery' });
            }
            
            if (!files.imageFile || !files.imageFile[0]) {
                errors.push({ param: 'imageFile', msg: 'Please select an image file to upload' });
            }

            // Create an image object with escaped and trimmed data
            const newImage = new image({
                name: fields.name ? fields.name[0].trim() : '',
                description: fields.description ? fields.description[0].trim() : '',
                path: '',
                gallery: fields.gallery ? fields.gallery[0] : '',
                uploadDate: new Date()
            });

            if (errors.length > 0) {
                // There are validation errors. Render form again with sanitized values/errors messages
                console.log("Validation errors:", errors);
                let userGalleries = [];
                if (req.user.username === 'admin') {
                    userGalleries = await gallery.find({}).populate('user').exec();
                } else {
                    userGalleries = await gallery.find({ user: req.user._id }).populate("user").exec();
                }
                res.render("image_form", {
                    title: "Add New Image",
                    image: newImage,
                    galleries: userGalleries,
                    currentUser: req.user,
                    errors: errors,
                    success: null
                });
                return;
            }

            try {
                // Check if user has permission to add image to this gallery
                const selectedGallery = await gallery.findById(fields.gallery[0]).populate('user').exec();
                
                if (!selectedGallery) {
                    throw new Error('Gallery not found');
                }

                // Check if user is admin or owns the gallery
                if (req.user.username !== 'admin' && selectedGallery.user._id.toString() !== req.user._id.toString()) {
                    let userGalleries = [];
                    if (req.user.username === 'admin') {
                        userGalleries = await gallery.find({}).populate('user').exec();
                    } else {
                        userGalleries = await gallery.find({ user: req.user._id }).populate("user").exec();
                    }
                    res.render("image_form", {
                        title: "Add New Image",
                        image: newImage,
                        galleries: userGalleries,
                        currentUser: req.user,
                        errors: [{ 
                            param: 'gallery', 
                            msg: 'You can only add images to your own galleries' 
                        }],
                        success: null
                    });
                    return;
                }

                // Check if image with same name already exists in this gallery
                const existingImage = await image.findOne({ 
                    name: fields.name[0].trim(),
                    gallery: fields.gallery[0] 
                }).exec();
                
                if (existingImage) {
                    // Image exists in this gallery, show error message
                    console.log("Image already exists in gallery:", fields.name[0].trim(), fields.gallery[0]);
                    let userGalleries = [];
                    if (req.user.username === 'admin') {
                        userGalleries = await gallery.find({}).populate('user').exec();
                    } else {
                        userGalleries = await gallery.find({ user: req.user._id }).populate("user").exec();
                    }
                    res.render("image_form", {
                        title: "Add New Image",
                        image: newImage,
                        galleries: userGalleries,
                        currentUser: req.user,
                        errors: [{ 
                            param: 'name', 
                            msg: `Image with name "${fields.name[0].trim()}" already exists in this gallery` 
                        }],
                        success: null
                    });
                    return;
                }

                // Process uploaded file
                const uploadedFile = files.imageFile[0];
                const fileName = uploadedFile.newFilename;
                const filePath = `/images/${fileName}`;
                
                // Update image object with file path
                newImage.path = filePath;
                newImage.name = fields.name[0].trim();
                newImage.description = fields.description ? fields.description[0].trim() : '';
                newImage.gallery = fields.gallery[0];

                // Save image to database
                await newImage.save();
                console.log("Image added successfully:", newImage.name, "File:", fileName);
                
                let userGalleries = [];
                if (req.user.username === 'admin') {
                    userGalleries = await gallery.find({}).populate('user').exec();
                } else {
                    userGalleries = await gallery.find({ user: req.user._id }).populate("user").exec();
                }
                res.render("image_form", {
                    title: "Add New Image",
                    image: {},
                    galleries: userGalleries,
                    currentUser: req.user,
                    errors: [],
                    success: `Image "${newImage.name}" has been successfully uploaded and added to the gallery!`
                });
                
            } catch (error) {
                // Handle database errors
                console.error("Database error:", error);
                let userGalleries = [];
                if (req.user.username === 'admin') {
                    userGalleries = await gallery.find({}).populate('user').exec();
                } else {
                    userGalleries = await gallery.find({ user: req.user._id }).populate("user").exec();
                }
                res.render("image_form", {
                    title: "Add New Image",
                    image: newImage,
                    galleries: userGalleries,
                    currentUser: req.user,
                    errors: [{ 
                        param: 'general', 
                        msg: 'An error occurred while saving the image. Please try again.' 
                    }],
                    success: null
                });
            }
        });
    }),
];

// Display image show on GET (requires authentication)
exports.image_show_get = [
    authenticateToken,
    asyncHandler(async (req, res, next) => {
        const imageId = req.query.id;
        const galleryId = req.query.gallery;
        
        if (!imageId) {
            return res.redirect('/galleries/gallery_browse');
        }

        try {
            const imageData = await image.findById(imageId)
                .populate({
                    path: 'gallery',
                    populate: {
                        path: 'user'
                    }
                })
                .exec();
            
            if (!imageData) {
                return res.redirect('/galleries/gallery_browse');
            }

            res.render("image_show", { 
                title: "View Image", 
                image: imageData,
                currentUser: req.user
            });
        } catch (error) {
            console.error("Error loading image:", error);
            res.redirect('/galleries/gallery_browse');
        }
    })
];

// Display image update form on GET (requires authentication and ownership)
exports.image_update_get = [
    authenticateToken,
    asyncHandler(async (req, res, next) => {
        const imageId = req.query.id;
        
        if (!imageId) {
            return res.redirect('/galleries/gallery_browse');
        }

        try {
            const imageData = await image.findById(imageId)
                .populate({
                    path: 'gallery',
                    populate: {
                        path: 'user'
                    }
                })
                .exec();
            
            if (!imageData) {
                return res.redirect('/galleries/gallery_browse');
            }

            // Check if user has permission to update this image
            if (req.user.username !== 'admin' && imageData.gallery.user._id.toString() !== req.user._id.toString()) {
                return res.redirect('/galleries/gallery_browse');
            }

            let userGalleries = [];
            if (req.user.username === 'admin') {
                userGalleries = await gallery.find({}).populate('user').exec();
            } else {
                userGalleries = await gallery.find({ user: req.user._id }).populate("user").exec();
            }

            res.render("image_update", { 
                title: "Update Image", 
                image: imageData,
                galleries: userGalleries,
                currentUser: req.user,
                errors: [],
                success: null 
            });
        } catch (error) {
            console.error("Error loading image for update:", error);
            res.redirect('/galleries/gallery_browse');
        }
    })
];

// Handle image update on POST (requires authentication and ownership)
exports.image_update_post = [
    authenticateToken,
    asyncHandler(async (req, res, next) => {
        const imageId = req.body.imageId;
        
        if (!imageId) {
            return res.redirect('/galleries/gallery_browse');
        }

        try {
            const imageData = await image.findById(imageId)
                .populate({
                    path: 'gallery',
                    populate: {
                        path: 'user'
                    }
                })
                .exec();
            
            if (!imageData) {
                return res.redirect('/galleries/gallery_browse');
            }

            // Check if user has permission to update this image
            if (req.user.username !== 'admin' && imageData.gallery.user._id.toString() !== req.user._id.toString()) {
                return res.redirect('/galleries/gallery_browse');
            }

            // Validate fields
            const errors = [];
            
            if (!req.body.name || req.body.name.trim().length < 1 || req.body.name.trim().length > 200) {
                errors.push({ param: 'name', msg: 'Image name must be between 1 and 200 characters' });
            }
            
            if (req.body.description && req.body.description.trim().length > 500) {
                errors.push({ param: 'description', msg: 'Description must not exceed 500 characters' });
            }
            
            if (!req.body.gallery) {
                errors.push({ param: 'gallery', msg: 'Please select a gallery' });
            }

            // Check if user has permission to move image to selected gallery
            const selectedGallery = await gallery.findById(req.body.gallery).populate('user').exec();
            if (req.user.username !== 'admin' && selectedGallery.user._id.toString() !== req.user._id.toString()) {
                errors.push({ param: 'gallery', msg: 'You can only move images to your own galleries' });
            }

            // Check if image with same name already exists in the target gallery (if different from current)
            if (req.body.gallery !== imageData.gallery._id.toString()) {
                const existingImage = await image.findOne({ 
                    name: req.body.name.trim(),
                    gallery: req.body.gallery 
                }).exec();
                
                if (existingImage) {
                    errors.push({ 
                        param: 'name', 
                        msg: `Image with name "${req.body.name.trim()}" already exists in the target gallery` 
                    });
                }
            }

            if (errors.length > 0) {
                let userGalleries = [];
                if (req.user.username === 'admin') {
                    userGalleries = await gallery.find({}).populate('user').exec();
                } else {
                    userGalleries = await gallery.find({ user: req.user._id }).populate("user").exec();
                }
                res.render("image_update", {
                    title: "Update Image",
                    image: imageData,
                    galleries: userGalleries,
                    currentUser: req.user,
                    errors: errors,
                    success: null
                });
                return;
            }

            // Update image
            imageData.name = req.body.name.trim();
            imageData.description = req.body.description ? req.body.description.trim() : '';
            imageData.gallery = req.body.gallery;
            
            await imageData.save();
            console.log("Image updated successfully:", imageData.name);
            
            // Redirect to browse gallery
            res.redirect(`/galleries/gallery_browse?gallery=${req.body.gallery}`);
            
        } catch (error) {
            console.error("Error updating image:", error);
            res.redirect('/galleries/gallery_browse');
        }
    })
];

// Handle image delete on POST (requires authentication and ownership)
exports.image_delete_post = [
    authenticateToken,
    asyncHandler(async (req, res, next) => {
        const imageId = req.body.imageId;
        const galleryId = req.body.galleryId;
        
        if (!imageId) {
            return res.redirect('/galleries/gallery_browse');
        }

        try {
            const imageData = await image.findById(imageId)
                .populate({
                    path: 'gallery',
                    populate: {
                        path: 'user'
                    }
                })
                .exec();
            
            if (!imageData) {
                return res.redirect('/galleries/gallery_browse');
            }

            // Check if user has permission to delete this image
            if (req.user.username !== 'admin' && imageData.gallery.user._id.toString() !== req.user._id.toString()) {
                return res.redirect('/galleries/gallery_browse');
            }

            // Delete image from database (but keep file on server)
            await image.findByIdAndDelete(imageId);
            console.log("Image deleted successfully:", imageData.name);
            
            // Redirect to browse gallery
            res.redirect(`/galleries/gallery_browse?gallery=${galleryId || imageData.gallery._id}`);
            
        } catch (error) {
            console.error("Error deleting image:", error);
            res.redirect('/galleries/gallery_browse');
        }
    })
]; 