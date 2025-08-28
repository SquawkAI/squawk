"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import axios from "axios";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { IProject } from "../../layout";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type Choice = { key: string; title: string; desc: string; icon?: string };

const ToneEnum = z.enum(["formal", "neutral", "informal"]);
const ComplexityEnum = z.enum(["advanced", "intermediate", "introductory"]);
const AuthorityEnum = z.enum(["authoritative", "default", "supportive"]);
const DetailEnum = z.enum(["direct", "default", "explanatory"]);

const configFormSchema = z.object({
  title: z
    .string()
    .min(1, "Project title cannot be empty")
    .max(20, "Project title must be less than 20 characters"),
  tone: ToneEnum,
  complexity: ComplexityEnum,
  authority: AuthorityEnum,
  detail: DetailEnum,
});
type ConfigForm = z.infer<typeof configFormSchema>;

const toneChoices: Choice[] = configFormSchema.shape.tone.options.map((key) => ({
  key,
  title: key[0].toUpperCase() + key.slice(1),
  desc:
    key === "formal"
      ? "Structured, precise, and professional. Good for academic, legal, or business contexts."
      : key === "neutral"
        ? "Clear and balanced; avoids emotional phrasing. Good for general communication."
        : "Relaxed and conversational; approachable and friendly.",
  icon: key === "formal" ? "📘" : key === "neutral" ? "⚖️" : "💬",
}));

const complexityChoices: Choice[] = configFormSchema.shape.complexity.options.map((key) => ({
  key,
  title: key === "introductory" ? "Introductory" : key[0].toUpperCase() + key.slice(1),
  desc:
    key === "introductory"
      ? "Simplifies ideas with minimal jargon. Best for beginners."
      : key === "intermediate"
        ? "Moderate detail with some technical terms."
        : "High detail; assumes strong subject knowledge.",
  icon: key === "introductory" ? "🌱" : key === "intermediate" ? "🧩" : "🧠",
}));

const detailChoices: Choice[] = configFormSchema.shape.detail.options.map((key) => ({
  key,
  title: key[0].toUpperCase() + key.slice(1),
  desc:
    key === "direct"
      ? "Short answers with minimal extra detail. Great for quick decisions."
      : key === "default"
        ? "Balanced detail with moderate explanation."
        : "Adds context, reasoning, and background.",
  icon: key === "direct" ? "⚡" : key === "default" ? "📄" : "🔎",
}));

const authorityChoices: Choice[] = configFormSchema.shape.authority.options.map((key) => ({
  key,
  title: key === "default" ? "Default" : key[0].toUpperCase() + key.slice(1),
  desc:
    key === "supportive"
      ? "Encouraging and positive; good for coaching or mentoring."
      : key === "default"
        ? "Neutral tone with balanced authority and warmth."
        : "Confident, directive, and prescriptive guidance.",
  icon: key === "supportive" ? "🤝" : key === "default" ? "🎛️" : "🛡️",
}));

function getPreview(s: { tone: z.infer<typeof ToneEnum>, complexity: z.infer<typeof ComplexityEnum>, detail: z.infer<typeof DetailEnum>, authority: z.infer<typeof AuthorityEnum> }): string {
  // Core sentence varies mostly by complexity.
  const lead =
    s.complexity === "introductory"
      ? "Quantum entanglement is when two tiny particles act like they're connected, so measuring one immediately tells you something about the other, even if they're far apart."
      : s.complexity === "advanced"
        ? "Quantum entanglement denotes non-classical correlations between subsystems of a shared wavefunction; a measurement on one subsystem instantaneously defines the correlated outcome of its partner, violating local hidden-variable models and formalized via Bell inequalities."
        : "Quantum entanglement occurs when two or more particles share linked states so that measuring one instantly determines the other's outcome, regardless of distance.";

  // Extra sentences vary by detail.
  const detailAdditions =
    s.detail === "direct"
      ? "" // keep it tight
      : s.detail === "default"
        ? " This effect has been repeatedly verified in experiments and is central to quantum information science."
        : " This counterintuitive effect has been confirmed in numerous experiments and underpins emerging technologies, including quantum key distribution and certain quantum computing protocols, where entanglement enables correlations that classical systems cannot reproduce.";

  // Authority framing tweaks the “stance” language.
  const authorityOpen =
    s.authority === "supportive"
      ? "Great question—"
      : s.authority === "authoritative"
        ? "Definitively,"
        : ""; // default: no opener

  const authorityClose =
    s.authority === "supportive"
      ? " If any part feels unclear, we can slow down and walk through a simple example together."
      : s.authority === "authoritative"
        ? " Treat this as a foundational fact when reasoning about quantum protocols."
        : "";

  // Tone polish swaps diction/register lightly (use replaceAll to avoid regex quirks).
  const tonePolish = (text: string) => {
    if (s.tone === "formal") {
      return text
        .replaceAll("tiny particles", "quantum particles")
        .replaceAll("act like they're connected", "exhibit correlated states")
        .replaceAll("far apart", "significant spatial separation");
    }
    if (s.tone === "informal") {
      return text
        .replaceAll("occurs when", "happens when")
        .replaceAll("so that", "so that") // keep as-is; included for clarity if you tweak base text
        .replaceAll("regardless of distance", "even across huge distances");
    }
    return text; // neutral
  };

  const base = `${authorityOpen ? authorityOpen + " " : ""}${lead}${detailAdditions}${authorityClose}`;
  return tonePolish(base).trim();
}


function OptionCard({
  item,
  selected,
  onSelect,
}: {
  item: Choice;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className={[
        "relative w-full text-left rounded-xl p-4 md:p-5 transition",
        "bg-background ring-1 ring-border hover:ring-border",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "ring-2 ring-primary shadow-sm bg-primary/10" : "",
      ].join(" ")}
    >
      <span
        className={[
          "absolute right-3 top-3 h-5 w-5 rounded-full text-[11px] font-bold",
          "flex items-center justify-center transition-opacity",
          selected ? "bg-primary text-primary-foreground opacity-100" : "bg-muted text-muted-foreground opacity-0 group-hover:opacity-60",
        ].join(" ")}
        aria-hidden="true"
      >
        ✓
      </span>

      <div className="flex items-start gap-3">
        {item.icon ? (
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-muted text-lg">
            {item.icon}
          </div>
        ) : null}
        <div>
          <div className="text-sm font-semibold text-foreground">{item.title}</div>
          <div className="mt-1 text-xs md:text-[13px] leading-5 text-muted-foreground">{item.desc}</div>
        </div>
      </div>
    </button>
  );
}

const ConfigPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();

  const { data: project, mutate: mutateProject } = useSWR<IProject>(
    projectId ? `/api/projects/${projectId}` : null,
    async (url: string) => (await axios.get(url)).data
  );

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ConfigForm>({
    resolver: zodResolver(configFormSchema),
  });

  // success/error UI state
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    if (!project) return;
    reset({
      title: project.title ?? "",
      tone: (project.tone as ConfigForm["tone"]) ?? "neutral",
      complexity: (project.complexity as ConfigForm["complexity"]) ?? "intermediate",
      detail: (project.detail as ConfigForm["detail"]) ?? "default",
      authority: (project.authority as ConfigForm["authority"]) ?? "default",
    });
  }, [project, reset]);

  const tone = watch("tone");
  const complexity = watch("complexity");
  const detail = watch("detail");
  const authority = watch("authority");

  const onSubmit = async (values: ConfigForm) => {
    try {
      setStatus("saving");
      setStatusMsg("");

      const res = await fetch(`/api/projects/${projectId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone: values.tone,
          complexity: values.complexity,
          detail: values.detail,
          authority: values.authority,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to update settings");
      }

      // revalidate SWR cache
      await mutateProject();

      setStatus("success");
      setStatusMsg("Settings saved successfully.");
    } catch (e) {
      setStatus("error");
      setStatusMsg((e as Error)?.message || "Something went wrong while saving settings.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 pt-6">
        <header className="mt-4 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Configure</h1>
            <p className="mt-1 text-muted-foreground">Update chat settings and tone</p>
          </div>
        </header>
      </div>

      <section className="mx-auto max-w-7xl px-6 md:px-8 lg:px-10 py-6 md:py-8">
        {/* Alerts */}
        {status === "success" && (
          <Alert className="mb-4">
            {/* simple inline check icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>
              <p>{statusMsg || "Your configuration has been saved."}</p>
            </AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive" className="mb-4">
            {/* simple inline x icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <AlertTitle>Couldn’t save</AlertTitle>
            <AlertDescription>
              <p>{statusMsg || "Please try again."}</p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left */}
            <div className="flex flex-col gap-8">
              {/* Tone */}
              <div role="radiogroup" aria-label="Tone">
                <h2 className="text-lg font-semibold text-foreground">Tone</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toneChoices.map((c) => (
                    <OptionCard
                      key={c.key}
                      item={c}
                      selected={tone === c.key}
                      onSelect={() => setValue("tone", c.key as ConfigForm["tone"], { shouldDirty: true })}
                    />
                  ))}
                </div>
                {errors.tone && <p className="mt-1 text-xs text-destructive">{errors.tone.message}</p>}
              </div>

              {/* Complexity */}
              <div role="radiogroup" aria-label="Complexity">
                <h2 className="text-lg font-semibold text-foreground">Complexity</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {complexityChoices.map((c) => (
                    <OptionCard
                      key={c.key}
                      item={c}
                      selected={complexity === c.key}
                      onSelect={() =>
                        setValue("complexity", c.key as ConfigForm["complexity"], { shouldDirty: true })
                      }
                    />
                  ))}
                </div>
                {errors.complexity && (
                  <p className="mt-1 text-xs text-destructive">{errors.complexity.message}</p>
                )}
              </div>

              {/* Detail */}
              <div role="radiogroup" aria-label="Style – Detail">
                <h2 className="text-lg font-semibold text-foreground">Style – Detail</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detailChoices.map((c) => (
                    <OptionCard
                      key={c.key}
                      item={c}
                      selected={detail === c.key}
                      onSelect={() => setValue("detail", c.key as ConfigForm["detail"], { shouldDirty: true })}
                    />
                  ))}
                </div>
                {errors.detail && <p className="mt-1 text-xs text-destructive">{errors.detail.message}</p>}
              </div>

              {/* Authority */}
              <div role="radiogroup" aria-label="Style – Authority">
                <h2 className="text-lg font-semibold text-foreground">Style – Authority</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {authorityChoices.map((c) => (
                    <OptionCard
                      key={c.key}
                      item={c}
                      selected={authority === c.key}
                      onSelect={() =>
                        setValue("authority", c.key as ConfigForm["authority"], { shouldDirty: true })
                      }
                    />
                  ))}
                </div>
                {errors.authority && (
                  <p className="mt-1 text-xs text-destructive">{errors.authority.message}</p>
                )}
              </div>
            </div>

            {/* Right: Preview */}
            <aside className="lg:sticky lg:top-6 h-fit">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Preview</h2>
                <div className="text-xs text-muted-foreground">
                  Tone: <span className="font-medium">{tone}</span> · Complexity:{" "}
                  <span className="font-medium">{complexity}</span> · Detail:{" "}
                  <span className="font-medium">{detail}</span> · Authority:{" "}
                  <span className="font-medium">{authority}</span>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-background ring-1 ring-border shadow-sm p-5">
                <p className="text-sm leading-7 text-foreground">
                  {getPreview({ tone, complexity, detail, authority })}
                </p>

              </div>
            </aside>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={status === "saving"}
              className={[
                "text-sm px-4 py-2 rounded-lg text-primary-foreground transition",
                status === "saving" ? "bg-primary cursor-not-allowed" : "bg-primary hover:bg-primary",
              ].join(" ")}
            >
              {status === "saving" ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ConfigPage;
