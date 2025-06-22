var express = require('express');
var router = express.Router();
const imageController = require("../controllers/imageController");
const { authenticateToken } = require("../middleware/auth");

router.get("/", imageController.imageList);
router.get("/image_add", authenticateToken, imageController.image_add_get);
router.post("/image_add", authenticateToken, imageController.image_add_post);
router.get("/image_update", imageController.image_update_get);
router.post("/image_update", imageController.image_update_post);
router.post("/image_delete", imageController.image_delete_post);
router.get("/image_show", imageController.image_show_get);

module.exports = router; 