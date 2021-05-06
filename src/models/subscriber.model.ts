import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ICenterMini } from './center.model';
@Schema({
  collection: 'subscriber',
  autoCreate: true,
  versionKey: false,
  strict: false,
})
export class SubscriberCollection extends Document {
  @Prop({ type: String, required: true, index: true })
  pincode: string;
  @Prop({ type: String, required: true })
  phoneNumber: string;
}

export const SubscriberSchema = SchemaFactory.createForClass(
  SubscriberCollection,
);

export interface ISubscriptionCollection {
  pincode: SubscriberCollection['pincode'];
  phoneNumber: SubscriberCollection['phoneNumber'];
  data: ICenterMini[][];
}
