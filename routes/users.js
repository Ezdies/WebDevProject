var express = require('express');
var router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.userList);
router.get("/user_add", userController.user_add_get);
router.post("/user_add", userController.user_add_post);
router.get("/login", userController.user_login_get);
router.post("/login", userController.user_login_post);
router.get("/logout", userController.user_logout_get);

module.exports = router;