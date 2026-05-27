import mongoose, { Schema, type Document } from 'mongoose';

export interface IFarmerProfile extends Document {
  farmName: string;
  farmerName: string;
  location: string;
  farmGoal: string;
  breed: string;
  since: string;
}

const FarmerProfileSchema = new Schema<IFarmerProfile>({
  farmName: { type: String, default: 'My Duck Farm' },
  farmerName: { type: String, default: 'the farmer' },
  location: { type: String, default: '' },
  farmGoal: { type: String, default: '' },
  breed: { type: String, default: '' },
  since: { type: String, default: '' },
});

export default mongoose.model<IFarmerProfile>('FarmerProfile', FarmerProfileSchema, 'farmerprofile');
