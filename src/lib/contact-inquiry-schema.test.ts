import { describe, expect, test } from "bun:test";
import { contactInquirySchema } from "@/lib/contact-inquiry-schema";

const valid = {
  artistName: "Lula Band",
  contactName: "Jane Doe",
  email: "jane@example.com",
  phone: "555-0100",
  message: "Need a day of tracking.",
  website: "",
};

describe("contactInquirySchema", () => {
  test("accepts a complete, valid submission", () => {
    const result = contactInquirySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test("rejects empty artist name", () => {
    const result = contactInquirySchema.safeParse({
      ...valid,
      artistName: "   ",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing contact name", () => {
    const result = contactInquirySchema.safeParse({
      ...valid,
      contactName: "",
    });
    expect(result.success).toBe(false);
  });

  test("rejects malformed email", () => {
    const result = contactInquirySchema.safeParse({
      ...valid,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty message", () => {
    const result = contactInquirySchema.safeParse({
      ...valid,
      message: "",
    });
    expect(result.success).toBe(false);
  });

  test("rejects message that exceeds the cap", () => {
    const result = contactInquirySchema.safeParse({
      ...valid,
      message: "a".repeat(10_001),
    });
    expect(result.success).toBe(false);
  });

  test("rejects oversized artistName", () => {
    const result = contactInquirySchema.safeParse({
      ...valid,
      artistName: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  test("rejects oversized phone (> 50)", () => {
    const result = contactInquirySchema.safeParse({
      ...valid,
      phone: "1".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  test("accepts empty phone (field is optional-ish)", () => {
    const result = contactInquirySchema.safeParse({ ...valid, phone: "" });
    expect(result.success).toBe(true);
  });

  test("honeypot `website` must exist but can be empty", () => {
    const result = contactInquirySchema.safeParse({ ...valid, website: "" });
    expect(result.success).toBe(true);
  });

  test("rejects when honeypot `website` field is missing", () => {
    const { website: _website, ...rest } = valid;
    void _website;
    const result = contactInquirySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
