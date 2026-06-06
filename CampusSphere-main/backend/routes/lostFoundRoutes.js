const express = require("express");
const router = express.Router();

const {
  createItem,
  getAllItems,
  claimItem,
  closeItem,
} = require("../controllers/lostFoundController");

const { protect } = require("../middleware/authMiddleware");


// CREATE
router.post("/", protect, createItem);

// GET ALL
router.get("/", getAllItems);

// CLAIM ITEM
router.put("/claim/:id", protect, claimItem);

// CLOSE ITEM
router.put("/close/:id", protect, closeItem);

//file uploads
router.post("/", protect, createItem);


module.exports = router;