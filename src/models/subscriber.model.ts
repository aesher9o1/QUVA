import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({
  collection: 'subscriber',
  autoCreate: true,
  versionKey: false,
  strict: false,
  timestamps: true,
})
export class SubscriberCollection extends Document {
  @Prop({ type: String, required: true, index: true })
  pincode: string;
  @Prop({ type: String, required: true, index: true })
  phoneNumber: string;
}

export const SubscriberCollectionSchema = SchemaFactory.createForClass(
  SubscriberCollection,
);
export interface ISubscriptionCollection {
  pincode: SubscriberCollection['pincode'];
  phoneNumber: SubscriberCollection['phoneNumber'];
}
