import VoiceToText from "@/components/voice-to-text";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <span className="eyebrow">
          <span className="eyebrow-line" />
          STUDENT FEEDBACK COLLECTOR
          <span className="eyebrow-line" />
        </span>
        <h1 id="page-title">Student feedback, captured.</h1>
        <p className="hero-subtitle">
          Speak your feedback in Tamil or English and see the words appear live.
        </p>
      </section>

      <VoiceToText />

      <footer className="page-footer">
        <span>Every student voice matters - Dev BY SaiHarish.</span>
        <span className="coming-soon">
          <span className="status-dot" />
          Tamil &amp; English voice input
        </span>
      </footer>
    </main>
  );
}
