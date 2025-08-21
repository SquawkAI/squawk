import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import React from "react";

const SharePage = () => {
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
          <div className="text-3xl font-bold">Share</div>
          <div className="text-stone-600 text-md">
            Share your Squawk with the world!
          </div>
        </div>
      </header>

      <section className="flex flex-1 gap-4 h-full pb-4">
        <div className="flex flex-col w-1/2">
          <div className="text-lg font-semibold">Share Link</div>
          <div className="flex w-full border border-stone-200 rounded-md p-2 text-sm text-stone-600">
            <div>https://squawk.ai/projects/123</div>
          </div>
        </div>
        <div className="flex flex-col w-1/2 overflow-y-auto">
          <div className="text-lg font-semibold">Chat Preview</div>
          <div className="flex w-full border border-stone-200 rounded-md p-2 text-sm text-stone-600">
            <div>Put iframe here</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SharePage;
