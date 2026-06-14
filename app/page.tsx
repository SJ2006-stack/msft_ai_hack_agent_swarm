"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Zap, ArrowRight } from "lucide-react";
import { FIXTURE_INPUT } from "@/fixtures/demo-input";
import { MeshGradient } from "@/components/ui/mesh-gradient";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SwarmCycleMarquee } from "@/components/home/swarm-cycle-marquee";
import { SwarmSetupStepper } from "@/components/home/swarm-setup-stepper";
import { SwarmChatDemo } from "@/components/home/swarm-chat-demo";
import { SwarmGraphPreview } from "@/components/home/swarm-graph-preview";
import { springSnappy } from "@/lib/motion-presets";

type PresetInput = { company: string; product: string; url: string };

const DEMO_PRESETS: { id: string; label: string; tagline: string; input: PresetInput }[] = [
  {
    id: "microsoft",
    label: "Microsoft",
    tagline: "Azure + Copilot",
    input: {
      company: "Microsoft",
      product:
        "Microsoft Azure cloud platform and Microsoft Copilot AI assistant — cloud migration, a unified data estate (Microsoft Fabric), and org-wide generative AI productivity for the enterprise",
      url: "https://azure.microsoft.com",
    },
  },
  {
    id: "apple",
    label: "Apple",
    tagline: "Apple at Work",
    input: {
      company: "Apple",
      product:
        "Apple at Work — Mac, iPhone, and iPad for the enterprise with Apple Business Manager, employee-choice programs, zero-touch deployment, and built-in security",
      url: "https://www.apple.com/business/",
    },
  },
  {
    id: "spacex",
    label: "SpaceX",
    tagline: "Starlink + Starshield",
    input: {
      company: "SpaceX",
      product:
        "Starlink high-speed, low-latency satellite connectivity for enterprise, maritime, aviation, and government — plus Starshield secure comms and Falcon 9 launch services",
      url: "https://www.starlink.com",
    },
  },
];

export default function HomePage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [product, setProduct] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadDemoInput() {
    setCompany(FIXTURE_INPUT.company);
    setProduct(FIXTURE_INPUT.product);
    setUrl(FIXTURE_INPUT.url ?? "");
    setError(null);
  }

  function scrollToLaunchForm() {
    document.getElementById("launch-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function startRun(payload: PresetInput) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/report/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: payload.company,
          product: payload.product,
          url: payload.url || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to start run");
      }

      const { run_id, demo_mode } = await res.json();
      router.push(demo_mode ? `/report/${run_id}?demo=1` : `/report/${run_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function launchPreset(preset: PresetInput) {
    setCompany(preset.company);
    setProduct(preset.product);
    setUrl(preset.url);
    void startRun(preset);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await startRun({ company, product, url });
  }

  return (
    <div className="min-h-screen bg-[#FCD116] flex flex-col">
      <section className="relative border-b-4 border-black overflow-hidden">
        <MeshGradient variant="hero" />
        <div className="relative z-10 p-6 md:p-12 lg:p-16">
          <ScrollReveal>
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
                  11 agents · LangGraph
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase leading-none tracking-tighter text-[#0A0A0A]">
                  GTM
                  <br />
                  <span className="inline-block rotate-180 origin-center">Maxxin</span>
                </h1>
                <p className="text-sm md:text-base font-medium text-neutral-800 max-w-md leading-relaxed">
                  Describe your company and product. Agents map markets, find signals,
                  qualify prospects, and draft outreach.
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springSnappy, delay: 0.15 }}
                    className="bg-black text-[#FCD116] px-3 py-1.5 border-2 border-black flex items-center gap-1.5"
                  >
                    <motion.span
                      className="w-2 h-2 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    Ready
                  </motion.span>
                  <motion.a
                    href="#architecture-section"
                    whileHover={{ x: -2, y: -2 }}
                    transition={springSnappy}
                    className="bg-white text-black px-3 py-1.5 border-2 border-black brutalist-shadow"
                  >
                    See the graph
                  </motion.a>
                </div>
              </div>

              <ScrollReveal delay={100}>
                <div
                  id="launch-form"
                  className="border-4 border-black bg-white/90 backdrop-blur-sm p-6 md:p-8 brutalist-shadow-lg"
                >
                  <div className="mb-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-lg font-bold text-[#0A0A0A]">New run</h2>
                      <button
                        type="button"
                        onClick={loadDemoInput}
                        className="border-2 border-black bg-white px-3 py-1 text-xs font-semibold text-[#0A0A0A] transition-colors hover:bg-black hover:text-[#FCD116]"
                      >
                        Fill sample
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500">Or pick a demo company</p>
                    <div className="grid grid-cols-3 gap-2">
                      {DEMO_PRESETS.map((preset, i) => (
                        <motion.button
                          key={preset.id}
                          type="button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...springSnappy, delay: 0.08 * i }}
                          whileHover={{ x: -2, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => launchPreset(preset.input)}
                          disabled={loading}
                          className="flex flex-col items-start border-2 border-black bg-[#FCD116] px-2.5 py-1.5 text-left transition-colors hover:bg-black hover:text-[#FCD116] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="text-xs font-bold">{preset.label}</span>
                          <span className="text-[9px] font-medium opacity-70">{preset.tagline}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="company" className="block text-xs font-semibold text-[#0A0A0A]">
                        Company
                      </label>
                      <textarea
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                        rows={2}
                        placeholder="B2B SaaS sales intelligence startup…"
                        className="w-full border-4 border-black bg-white px-3 py-2 text-sm text-[#0A0A0A] placeholder:text-neutral-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="product" className="block text-xs font-semibold text-[#0A0A0A]">
                        Product
                      </label>
                      <textarea
                        id="product"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        required
                        rows={3}
                        placeholder="AI prospecting and GTM automation tool…"
                        className="w-full border-4 border-black bg-white px-3 py-2 text-sm text-[#0A0A0A] placeholder:text-neutral-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="url" className="block text-xs font-semibold text-[#0A0A0A]">
                        Website <span className="font-normal text-neutral-600">(optional)</span>
                      </label>
                      <input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full border-4 border-black bg-white px-3 py-2 text-sm text-[#0A0A0A] placeholder:text-neutral-400 focus:outline-none"
                      />
                    </div>

                    {error && (
                      <p className="border-2 border-red-700 bg-red-100 px-3 py-2 text-xs font-medium text-red-800">
                        {error}
                      </p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ x: -2, y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      transition={springSnappy}
                      className="flex w-full items-center justify-center gap-2 border-4 border-black bg-[#0A0A0A] py-3 text-sm font-semibold text-[#FCD116] brutalist-shadow brutalist-btn-hover-yellow disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#FCD116] border-t-transparent" />
                          Starting…
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 fill-current" />
                          Run swarm
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </ScrollReveal>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SwarmCycleMarquee />

      <SwarmSetupStepper onLaunchClick={scrollToLaunchForm} />

      <SwarmChatDemo />

      <SwarmGraphPreview />

      <section className="grid md:grid-cols-2 border-b-4 border-black">
        <ScrollReveal className="p-8 md:p-12 bg-[#0A0A0A] text-[#FCD116] border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col justify-between space-y-8">
          <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none text-white">
            GTM research,
            <br />
            without the
            <br />
            spreadsheet sprint.
          </h3>
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-neutral-300">
              Each agent owns one step. Shared state keeps outputs aligned from ICP
              through outreach.
            </p>
            <button
              type="button"
              onClick={scrollToLaunchForm}
              className="bg-[#FCD116] text-black font-semibold text-sm border-2 border-black px-6 py-3 brutalist-shadow brutalist-btn-hover flex items-center gap-2"
            >
              Start a run
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120} className="p-8 md:p-12 bg-white text-[#0A0A0A] flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block">
              Pipeline
            </span>
            <p className="text-xl font-bold leading-tight">
              Parallel research branches merge before prospect scoring and outreach.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-6">
            <div>
              <p className="text-4xl font-black">11</p>
              <p className="text-xs text-neutral-500 mt-1">Agents</p>
            </div>
            <div>
              <p className="text-4xl font-black">5</p>
              <p className="text-xs text-neutral-500 mt-1">Stages</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <footer className="bg-[#0A0A0A] text-neutral-500 border-t-4 border-black p-8 text-center text-xs">
        <p className="text-white font-semibold text-sm">GTMaxxin</p>
        <p className="text-neutral-600 mt-1">
          © {new Date().getFullYear()} · Next.js, LangGraph & Tailwind
        </p>
      </footer>
    </div>
  );
}
