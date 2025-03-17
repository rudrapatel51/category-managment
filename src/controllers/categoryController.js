import Category from '../models/Category.js';
import { ErrorResponse } from '../utils/errorHandler.js';
import mongoose from 'mongoose';

// @desc    Create new category
// @route   POST /api/category
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, parent, status } = req.body;
    
    // Create category
    const category = await Category.create({
      name,
      parent: parent || null,
      status
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories as a tree
// @route   GET /api/category
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    // First get root categories (those without parent)
    const rootCategories = await Category.find({ parent: null })
      .sort('name');
    
    // Function to recursively get children
    const populateChildren = async (categories) => {
      for (let category of categories) {
        // Find children for this category
        const children = await Category.find({ parent: category._id }).sort('name');
        
        // If there are children, populate their children too
        if (children.length > 0) {
          category._doc.children = await populateChildren(children);
        } else {
          category._doc.children = [];
        }
      }
      return categories;
    };
    
    // Populate all children
    const categoriesTree = await populateChildren(rootCategories);
    
    res.status(200).json({
      success: true,
      count: rootCategories.length,
      data: categoriesTree
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/category/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    const { name, status } = req.body;
    const categoryId = req.params.id;
    
    let category = await Category.findById(categoryId);
    
    if (!category) {
      return next(new ErrorResponse(`Category not found with id of ${categoryId}`, 404));
    }
    
    // Simple update if only name is changing
    if (name && !status) {
      category = await Category.findByIdAndUpdate(
        categoryId,
        { name },
        { new: true, runValidators: true }
      );
    } 
    // If status is changing, we need to update all subcategories too
    else if (status) {
      // First update this category
      category = await Category.findByIdAndUpdate(
        categoryId,
        { name: name || category.name, status },
        { new: true, runValidators: true }
      );
      
      // If status is inactive, update all children to inactive
      if (status === 'inactive') {
        // Use path to find all descendants
        await Category.updateMany(
          { path: { $regex: new RegExp(categoryId) } },
          { status: 'inactive' }
        );
      }
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category and reassign children
// @route   DELETE /api/category/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return next(new ErrorResponse(`Category not found with id of ${categoryId}`, 404));
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get parent of the category being deleted
      const parentId = category.parent;
      
      // Find all direct children of the category being deleted
      const children = await Category.find({ parent: categoryId });
      
      // Update all children to have the parent of the deleted category
      for (const child of children) {
        await Category.findByIdAndUpdate(
          child._id,
          { parent: parentId },
          { session }
        );
        
        // Recalculate path and level
        const updatedChild = await Category.findById(child._id).session(session);
        
        if (parentId) {
          const newParent = await Category.findById(parentId).session(session);
          updatedChild.path = newParent.path ? `${newParent.path},${newParent._id}` : newParent._id.toString();
          updatedChild.level = newParent.level + 1;
        } else {
          updatedChild.path = '';
          updatedChild.level = 1;
        }
        
        await updatedChild.save({ session });
      }
      
      // Delete the category
      await Category.findByIdAndDelete(categoryId, { session });
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export { createCategory, getCategories, updateCategory, deleteCategory };