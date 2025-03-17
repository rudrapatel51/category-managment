import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  path: {
    type: String,
    default: ''
  },
  level: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster tree queries
categorySchema.index({ parent: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ status: 1 });

// Virtual for child categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Pre-save hook to set the path and level
categorySchema.pre('save', async function(next) {
  try {
    // If this is a new category or parent has changed
    if (this.isNew || this.isModified('parent')) {
      // If it has a parent
      if (this.parent) {
        const parentCategory = await this.constructor.findById(this.parent);
        if (parentCategory) {
          this.path = parentCategory.path ? `${parentCategory.path},${parentCategory._id}` : parentCategory._id.toString();
          this.level = parentCategory.level + 1;
          
          // Check if parent is inactive, then make this inactive too
          if (parentCategory.status === 'inactive') {
            this.status = 'inactive';
          }
        }
      } else {
        // Root category
        this.path = '';
        this.level = 1;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Category = mongoose.model('Category', categorySchema);

export default Category;