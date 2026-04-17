import { z } from "zod"

/** Mirrors validation in `src/app/api/contact/route.ts` MAX_LEN and required fields. */
export const contactInquirySchema = z.object({
  artistName: z
    .string()
    .trim()
    .min(1, "Artist or band name is required.")
    .max(200, "Artist or band name is too long."),
  contactName: z
    .string()
    .trim()
    .min(1, "Contact name is required.")
    .max(200, "Contact name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .max(320, "Email is too long."),
  phone: z.string().max(50, "Phone number is too long."),
  message: z
    .string()
    .trim()
    .min(1, "Tell us about your project.")
    .max(10000, "Message is too long."),
  /** Honeypot — must stay empty; handled in submit before fetch. */
  website: z.string(),
})

export type ContactInquiryValues = z.infer<typeof contactInquirySchema>
