import mongoose, { Schema, Document } from 'mongoose';
import timestampPlugin from './plugin/timestampPlugin/timeStampPlugin';

export interface ILocation extends Document {
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  radius: number;
  state: string;
}
const locationSchema: Schema<ILocation> = new Schema({
  userId: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  locationName: { type: String },
  radius: { type: Number },
  state: { type: String },
});

locationSchema.plugin(timestampPlugin);

const Locations = mongoose.model<ILocation>('Locations', locationSchema);
export default Locations;