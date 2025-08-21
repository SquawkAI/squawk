import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import React from "react";

const ConfigPage = () => {
  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-4">
      <Link
        href="/projects"
        className="flex items-center gap-1 text-sm text-black hover:text-stone-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </Link>
      <header className="flex items-center justify-between">
        <div className="inline-flex flex-col justify-center items-start gap-1">
          <div className="text-3xl font-bold">Configure</div>
          <div className="text-stone-600 text-md">
            Update chat settings and tone
          </div>
        </div>
      </header>

      <section className="flex flex-1 gap-8 h-full pb-4">
        <div className="flex flex-col gap-4 w-1/2 h-full">
          {/* Section: Tone */}
          <div className="flex flex-col">
            <div className="text-lg font-semibold">Tone</div>
            <div className="flex flex-row gap-2">
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Formal</div>
                <div className="text-xs text-stone-600">
                  Structured, precise, and professional wording. Best for
                  academic, legal, or business contexts.
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Neutral</div>
                <div className="text-xs text-stone-600">
                  Clear and balanced; avoids emotional or casual phrasing. Best
                  for general, objective communication.
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Informal</div>
                <div className="text-xs text-stone-600">
                  Relaxed and conversational; approachable, friendly tone. Best
                  for everyday conversations.
                </div>
              </div>
            </div>
          </div>
          {/* Section: Complexity */}
          <div className="flex flex-col">
            <div className="text-lg font-semibold">Complexity</div>
            <div className="flex flex-row gap-2">
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Introductory</div>
                <div className="text-xs text-stone-600">
                  Simplifies ideas, uses basic vocabulary, minimal jargon. Best
                  for beginners or general audiences.
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Intermediate</div>
                <div className="text-xs text-stone-600">
                  Moderate detail with some technical or domain-specific terms.
                  Best for learners with some prior knowledge.
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Advanced</div>
                <div className="text-xs text-stone-600">
                  High-level detail, assumes strong subject knowledge. Best for
                  specialists or expert audiences.
                </div>
              </div>
            </div>
          </div>
          {/* Section: Style - Detail */}
          <div className="flex flex-col">
            <div className="text-lg font-semibold">Style – Detail</div>
            <div className="flex flex-row gap-2">
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Direct</div>
                <div className="text-xs text-stone-600">
                  Short, concise answers with minimal extra detail. Best for
                  quick responses and fast decision-making.
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Default</div>
                <div className="text-xs text-stone-600">
                  Balanced level of detail with moderate explanation. Best for
                  most situations where clarity and brevity are both important.
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Explanatory</div>
                <div className="text-xs text-stone-600">
                  Adds context, reasoning, and background information. Best for
                  teaching, clarifying, or expanding on ideas.
                </div>
              </div>
            </div>
          </div>
          {/* Section: Style - Authority */}
          <div className="flex flex-col">
            <div className="text-lg font-semibold">Style – Authority</div>
            <div className="flex flex-row gap-2">
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Supportive</div>
                <div className="text-xs text-stone-600">
                  Encouraging and positive, with emphasis on reassurance. Best
                  for coaching, mentoring, or motivating users.
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Default</div>
                <div className="text-xs text-stone-600">
                  Neutral tone with balanced authority and warmth. Best for
                  general communication where tonal flexibility is needed.
                </div>
              </div>
              <div className="w-full flex flex-col gap-1 border border-stone-200 rounded-md p-2 cursor-pointer">
                <div className="text-sm font-medium">Authoritative</div>
                <div className="text-xs text-stone-600">
                  Confident, directive, and prescriptive in guidance. Best for
                  rules, instructions, or expert opinions.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-1/2 overflow-y-auto">
          <div className="text-lg font-semibold">Prompt Preview</div>
          <div className="flex w-full border border-stone-200 rounded-md p-2 text-sm text-stone-600">
            <div>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla non
              eleifend arcu, quis luctus sapien. Aliquam venenatis dui ac
              bibendum fermentum. Nulla enim velit, lobortis eget lorem sed,
              tincidunt pretium lacus. Mauris rutrum dui nec quam venenatis, sit
              amet accumsan ipsum gravida. Nulla nec venenatis ligula, at porta
              risus. Nunc nec est feugiat, condimentum ipsum ac, elementum odio.
              Integer eu sagittis libero, sed interdum velit. In ultricies
              efficitur enim a vestibulum. Nam vestibulum viverra metus, sed
              pharetra turpis consequat id. Maecenas dapibus, lacus ac gravida
              cursus, augue enim semper dolor, ut blandit sem mauris quis
              turpis. Aliquam metus ante, volutpat ut fringilla ac, finibus eu
              neque. Sed id lacus libero. Nam sodales condimentum ligula eget
              aliquet. Vestibulum eleifend lacus et semper fermentum. Sed ut
              ipsum nulla. Phasellus interdum tempor magna sed pellentesque.
              Duis nibh augue, varius et purus sed, rutrum cursus magna. Morbi
              at libero leo. Aliquam in dolor placerat, mattis eros ut,
              hendrerit purus. Vestibulum nec sem felis. Etiam pretium augue sit
              amet tincidunt eleifend. Sed nulla odio, accumsan eget eros vel,
              lacinia congue mi. Vivamus commodo nisl sed elit blandit faucibus.
              Nunc quis eros ut lacus rhoncus iaculis. Donec rhoncus tortor id
              lectus imperdiet feugiat. Aenean gravida, sapien scelerisque
              blandit pellentesque, elit quam ornare lorem, et interdum ante
              nibh quis dui. Vestibulum consectetur lectus eu sem auctor, vitae
              consequat ante interdum. Integer tincidunt, lacus id pharetra
              volutpat, est leo faucibus turpis, ut vehicula justo nisi ut
              libero. Donec blandit lacinia tempus. Nam faucibus tellus ut
              luctus vestibulum. Morbi volutpat elit ac risus tristique, nec
              maximus enim aliquam. Nulla facilisi. Aliquam erat volutpat.
              Vivamus a mi magna. Sed luctus bibendum risus vitae efficitur.
              Duis vitae neque vel arcu gravida commodo sit amet a nisi. Nunc
              ultricies convallis lorem eu dignissim. Ut dictum a augue et
              commodo.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConfigPage;
