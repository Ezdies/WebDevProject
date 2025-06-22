const user = require("../models/user");
const gallery = require("../models/gallery");
const image = require("../models/image");
const asyncHandler = require("express-async-handler");
console.log("statsController loaded");

exports.stats = asyncHandler(async (req, res, next) => {
    const userCount = await user.countDocuments({}).exec();
    const galleryCount = await gallery.countDocuments({}).exec();
    const imageCount = await image.countDocuments({}).exec();
    
    // Get recent galleries
    const recentGalleries = await gallery.find({})
        .populate('user')
        .sort({ date: -1 })
        .limit(5)
        .exec();
    
    // Get recent images
    const recentImages = await image.find({})
        .populate('gallery')
        .sort({ uploadDate: -1 })
        .limit(5)
        .exec();
    
    res.render("stats", {
        title: "GalleryDB Statistics",
        userCount: userCount,
        galleryCount: galleryCount,
        imageCount: imageCount,
        recentGalleries: recentGalleries,
        recentImages: recentImages
    });
}); 