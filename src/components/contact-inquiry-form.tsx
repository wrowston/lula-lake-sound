"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  contactInquirySchema,
  type ContactInquiryValues,
} from "@/lib/contact-inquiry-schema"

/** Slightly taller than the base underline input for touch / form legibility. */
const fieldClassName = "h-11 text-base md:text-sm"

export function ContactInquiryForm() {
  const [showSuccess, setShowSuccess] = useState(false)

  const form = useForm<ContactInquiryValues>({
    resolver: zodResolver(contactInquirySchema),
    defaultValues: {
      artistName: "",
      contactName: "",
      email: "",
      phone: "",
      message: "",
      website: "",
    },
  })

  async function onSubmit(values: ContactInquiryValues) {
    form.clearErrors("root")
    setShowSuccess(false)

    if (values.website.trim().length > 0) {
      form.reset()
      return
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: values.artistName,
          contactName: values.contactName,
          email: values.email,
          phone: values.phone.trim() ? values.phone.trim() : undefined,
          message: values.message,
          website: "",
        }),
      })

      let data: { success?: boolean; message?: string } = {}
      try {
        data = (await response.json()) as { success?: boolean; message?: string }
      } catch {
        form.setError("root", {
          type: "server",
          message: "Something went wrong. Please try again.",
        })
        return
      }

      if (!response.ok) {
        form.setError("root", {
          type: "server",
          message:
            data?.message ?? "Failed to send your inquiry. Please try again.",
        })
        return
      }

      if (data?.success) {
        form.reset()
        setShowSuccess(true)
      } else {
        form.setError("root", {
          type: "server",
          message: data?.message ?? "Something went wrong. Please try again.",
        })
      }
    } catch (error) {
      console.error("Submission error:", error)
      form.setError("root", {
        type: "server",
        message:
          "Network error. Please check your connection and try again.",
      })
    }
  }

  const rootError = form.formState.errors.root

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative space-y-8"
      >
        {showSuccess ? (
          <Alert className="border-sand/20 bg-sand/5 text-left" role="status">
            <AlertTitle className="text-sand">Message sent</AlertTitle>
            <AlertDescription className="text-ivory/80">
              Thank you! Your inquiry has been sent. We&apos;ll get back to you
              soon.
            </AlertDescription>
          </Alert>
        ) : null}

        {rootError ? (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Couldn&apos;t send</AlertTitle>
            <AlertDescription>
              <p>{rootError.message}</p>
              <p className="mt-2 text-muted-foreground">
                If the problem persists, please email us directly at{" "}
                <a
                  href="mailto:info@lulalakesound.com"
                  className="text-sand underline-offset-4 hover:underline"
                >
                  info@lulalakesound.com
                </a>
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="artistName"
            render={({ field }) => (
              <FormItem>
              <FormLabel className="label-text text-sand/70">
                Artist / band name *
              </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your artist or band name"
                    autoComplete="organization"
                    className={fieldClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
              <FormLabel className="label-text text-sand/70">
                Contact name *
              </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your full name"
                    autoComplete="name"
                    className={fieldClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
              <FormLabel className="label-text text-sand/70">
                Email address *
              </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    className={fieldClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
              <FormLabel className="label-text text-sand/70">
                Phone (optional)
              </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                    className={fieldClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div
          className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
          aria-hidden
        >
          <label htmlFor="contact-website-hp">Do not fill this out</label>
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <input
                id="contact-website-hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className="sr-only"
                {...field}
              />
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="label-text text-sand/70">
                Tell us about your project *
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="A little about your project — style, scope, timeline, what you want from the room..."
                  className="min-h-[10rem] resize-y text-base md:text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-center pt-6">
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="h-11 px-9"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Sending…" : "Send inquiry"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
