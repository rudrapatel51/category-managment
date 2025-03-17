import express from 'express';
import { 
  createCategory, 
  getCategories, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .post(createCategory)
  .get(getCategories);

router.route('/:id')
  .put(updateCategory)
  .delete(deleteCategory);

export default router;