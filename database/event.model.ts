import { Schema, model, models, Document, Model } from "mongoose";

/**
 * Event document shape stored in MongoDB.
 */
export interface EventDocument extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // Stored as ISO date string (YYYY-MM-DD).
  time: string; // Stored as 24h time string (HH:MM).
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EventModel = Model<EventDocument>;

/**
 * Helper to generate a URL-friendly slug from a title.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace non-alphanumeric characters with hyphens.
    .replace(/[^a-z0-9]+/g, "-")
    // Remove leading/trailing hyphens.
    .replace(/^-+|-+$/g, "");
}

/**
 * Validates and normalizes a date string to ISO format (YYYY-MM-DD).
 */
function normalizeDate(date: string): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid event date. Please provide a valid date.");
  }

  // Only keep the date part in ISO (e.g. 2025-11-16).
  return parsed.toISOString().split("T")[0] as string;
}

/**
 * Ensures time is stored as 24h HH:MM.
 */
function normalizeTime(time: string): string {
  const trimmed = time.trim();

  // Accepts HH:MM or HH:MM:SS and normalizes to HH:MM.
  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);

  if (!match) {
    throw new Error("Invalid event time. Expected 24h format HH:MM or HH:MM:SS.");
  }

  const hours = match[1];
  const minutes = match[2];
  return `${hours}:${minutes}`;
}

const EventSchema = new Schema<EventDocument, EventModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    overview: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    mode: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      required: true,
      trim: true,
    },
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator(value: string[]): boolean {
          return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim().length > 0);
        },
        message: "Agenda must be a non-empty array of non-empty strings.",
      },
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator(value: string[]): boolean {
          return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim().length > 0);
        },
        message: "Tags must be a non-empty array of non-empty strings.",
      },
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

// Unique index on slug to guarantee unique event URLs.
EventSchema.index({ slug: 1 }, { unique: true });

// Pre-save hook: validate required strings, normalize date/time, and generate slug from title.
EventSchema.pre("save", function (next) {
  try {
    const event = this;

    // Validate required text fields are non-empty after trimming.
    const requiredStringFields: Array<keyof Pick<
      EventDocument,
      | "title"
      | "description"
      | "overview"
      | "image"
      | "venue"
      | "location"
      | "mode"
      | "audience"
      | "organizer"
    >> = [
      "title",
      "description",
      "overview",
      "image",
      "venue",
      "location",
      "mode",
      "audience",
      "organizer",
    ];

    for (const field of requiredStringFields) {
      const value = event[field];
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`Field "${String(field)}" is required and cannot be empty.`);
      }
    }

    // Normalize date and time to consistent formats.
    event.date = normalizeDate(event.date);
    event.time = normalizeTime(event.time);

    // Only regenerate slug when the title changes.
    if (event.isModified("title")) {
      event.slug = generateSlug(event.title);
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

export const Event: EventModel = (models.Event as EventModel) || model<EventDocument, EventModel>("Event", EventSchema);
