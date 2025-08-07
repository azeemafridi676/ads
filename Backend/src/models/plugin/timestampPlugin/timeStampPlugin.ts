import { Schema } from 'mongoose';

const timestampPlugin = (schema: Schema): void => {
  schema.add({
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  schema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });
};

export default timestampPlugin;
