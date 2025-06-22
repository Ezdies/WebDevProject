var express = require('express');
var router = express.Router();
const galleryController = require("../controllers/galleryController");

router.get("/", galleryController.galleryList);
// Obsługa GET: http://localhost/galleries/gallery_add
router.get("/gallery_add", galleryController.gallery_add_get);
// Obsługa POST: http://localhost/galleries/gallery_add
router.post("/gallery_add", galleryController.gallery_add_post);
// Obsługa GET: http://localhost/galleries/gallery_browse
router.get("/gallery_browse", galleryController.gallery_browse_get);
// Obsługa POST: http://localhost/galleries/gallery_browse
router.post("/gallery_browse", galleryController.gallery_browse_post);

module.exports = router; 