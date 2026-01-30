import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentEvent extends Document {
  pfPaymentId: string;
  mPaymentId: string;
  paymentStatus: string;
  amountGross: string;
  providerId?: mongoose.Types.ObjectId;
  processedAt: Date;
  rawData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentEventSchema = new Schema<IPaymentEvent>(
  {
    pfPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mPaymentId: {
      type: String,
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      required: true,
    },
    amountGross: {
      type: String,
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
    },
    processedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    rawData: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: automatically delete records after 30 days
paymentEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const PaymentEvent = mongoose.model<IPaymentEvent>('PaymentEvent', paymentEventSchema);
