import mongoose, { Schema, Document } from 'mongoose';
import timestampPlugin from './plugin/timestampPlugin/timeStampPlugin';

export interface IAvailableStates extends Document {
  name: string;
  code: string;
  country: string;
}
const availableStatesSchema: Schema<IAvailableStates> = new Schema({
  name: { type: String },
  code: { type: String },
  country: { type: String, default: 'United States' },
});

availableStatesSchema.plugin(timestampPlugin);

const AvailableStates = mongoose.model<IAvailableStates>('AvailableStates', availableStatesSchema);
export default AvailableStates;
