const express = require('express');
const router = express.Router();
const Meal = require('../models/Meal');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

// Create a new meal (Seller Only)
router.post('/', protect, sellerOnly, async (req, res) => {
  const { name, description, price, image } = req.body;
  try {
    const meal = new Meal({
      sellerId: req.user.id,
      name,
      description,
      price,
      image,
    });
    await meal.save();
    res.status(201).json(meal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all meals (Public)
router.get('/', async (req, res) => {
  try {
    const meals = await Meal.find().populate('sellerId', 'name location');
    res.status(200).json(meals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get seller-specific meals
router.get('/seller', protect, sellerOnly, async (req, res) => {
  try {
    const meals = await Meal.find({ sellerId: req.user.id });
    res.status(200).json(meals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a meal (Seller Only)
router.put('/:id', protect, sellerOnly, async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });

    if (meal.sellerId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized to update this meal' });

    const updatedMeal = await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedMeal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a meal (Seller Only)
router.delete('/:id', protect, sellerOnly, async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });

    if (meal.sellerId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized to delete this meal' });

    await meal.remove();
    res.status(200).json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
