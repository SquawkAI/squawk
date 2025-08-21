// components/projects/new-project-dialog.tsx
"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { useForm } from "react-hook-form"
import { FolderPlusIcon, XIcon, SparklesIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { parseError } from "@/lib/utils";

type NewProjectValues = { title: string; description?: string }
type Props = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreate: (v: NewProjectValues) => Promise<void> | void
  trigger?: React.ReactNode
  defaultValues?: Partial<NewProjectValues>
  isSubmittingExternally?: boolean
  className?: string
}

export function NewProjectDialog({ open, onOpenChange, onCreate, trigger, defaultValues, isSubmittingExternally, className }: Props) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const actualOpen = open ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const form = useForm<NewProjectValues>({
    defaultValues: { title: "", description: "", ...defaultValues },
    mode: "onChange",
  })

  const [serverError, setServerError] = React.useState<string | null>(null)
  const submitting = form.formState.isSubmitting || !!isSubmittingExternally

  async function handleSubmit(values: NewProjectValues) {
    setServerError(null);

    try {
      await onCreate({
        title: values.title.trim(),
        description: values.description?.trim(),
      });
      setOpen(false);
      form.reset();
    } catch (e: unknown) {
      const { message, status } = parseError(e);

      if (status === 400) {
        form.setError("title", { type: "server", message });
      } else {
        setServerError(message);
      }
    }
  }

  React.useEffect(() => {
    if (actualOpen) {
      setServerError(null);
      form.clearErrors();
      form.reset({
        title: defaultValues?.title ?? "",
        description: defaultValues?.description ?? "",
      });
    }
  }, [actualOpen, form, defaultValues?.title, defaultValues?.description]);

  return (
    <Dialog.Root
      open={actualOpen}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setServerError(null);
          form.clearErrors();
        }
      }}
    >
      <Dialog.Trigger asChild>
        {trigger ?? <Button size="sm">New Project</Button>}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border shadow-xl",
            "bg-gradient-to-b from-background to-background",
            "data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0",
            className
          )}
        >
          {/* Decorative bubbles */}
          <div className="pointer-events-none absolute -right-24 -top-24 size-56 rounded-full bg-primary/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-28 -bottom-28 size-64 rounded-full bg-blue-400/10 dark:bg-blue-300/10 blur-2xl" />

          {/* Header */}
          <div className="relative flex items-center gap-3 border-b bg-accent/40 px-6 py-4">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FolderPlusIcon className="size-5" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold">
                New Project
              </Dialog.Title>
            </div>

            <Dialog.Close
              className="ring-offset-background focus:ring-ring absolute right-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2"
              aria-label="Close"
            >
              <XIcon className="size-4" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-5">
            {serverError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Couldn’t create project</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-5">
                <FormField
                  name="title"
                  control={form.control}
                  rules={{
                    required: "Please enter a project name.",
                    maxLength: { value: 80, message: "Keep it under 80 characters." },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Biology 101 – Fall" autoFocus {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="description"
                  control={form.control}
                  rules={{ maxLength: { value: 300, message: "Max 300 characters." } }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="What’s inside? (optional)"
                          className={cn(
                            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow]",
                            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Footer buttons */}
                <div className="mt-1 flex items-center justify-end gap-2">
                  <Dialog.Close asChild>
                    <Button type="button" variant="ghost" className="px-4" disabled={submitting}>
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="submit"
                    disabled={!form.formState.isValid || submitting}
                    className="relative px-5"
                  >
                    <SparklesIcon className="mr-1.5 size-4" />
                    {submitting ? "Creating…" : "Create Project"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
