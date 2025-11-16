import { Schema, model, models, Document, Model, Types } from "mongoose";
import { Event } from "./event.model";

/**
 * Booking document shape stored in MongoDB.
 */
export interface BookingDocument extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingModel = Model<BookingDocument>;

/**
 * Simple email validation regex for format checking.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<BookingDocument, BookingModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true, // Index for faster lookups by event.
    },
    email: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator(value: string): boolean {
          return EMAIL_REGEX.test(value);
        },
        message: "Invalid email format.",
      },
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

// Ensure an index on eventId to optimize queries by event reference.
BookingSchema.index({ eventId: 1 });

// Pre-save hook: validate that the referenced event exists and email is valid.
BookingSchema.pre("save", async function (next) {
  try {
    const booking = this;

    if (!EMAIL_REGEX.test(booking.email)) {
      throw new Error("Invalid email format.");
    }

    // Only check event existence when eventId is new or changed.
    if (booking.isNew || booking.isModified("eventId")) {
      const eventExists = await Event.exists({ _id: booking.eventId }).lean();

      if (!eventExists) {
        throw new Error("Cannot create booking: referenced event does not exist.");
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

export const Booking: BookingModel =
  (models.Booking as BookingModel) || model<BookingDocument, BookingModel>("Booking", BookingSchema);
