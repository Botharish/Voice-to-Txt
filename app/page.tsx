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
          Speak naturally in Tamil or English. Your words appear live in the
          script of the language you speak.
        </p>
      </section>

      <VoiceToText />

      <footer className="page-footer">
        <span>Every student voice matters - Dev BY SaiHarish.</span>
        <span className="coming-soon">
          <span className="status-dot" />
          Automatic Tamil &amp; English detection
        </span>
      </footer>
    </main>
  );
}
