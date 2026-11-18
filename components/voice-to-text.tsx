"use client";

import { useState } from "react";
import VoiceInput from "@/components/voice-input";

export default function VoiceToText() {
  const [text, setText] = useState("");

  return (
    <section className="translator" aria-label="Student feedback">
      <div className="text-card input-card">
        <div className="card-heading">
          <div className="heading-label">
            <span className="card-icon input-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 4.75h12M6.5 8h7M6.5 11.25h4.25M4 15.25h7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>Student feedback</span>
          </div>
          <span className="character-count">{text.length} / 1,000</span>
        </div>
        <textarea
          className="source-input"
          value={text}
          placeholder="Tap the microphone to capture student feedback..."
          aria-label="Student feedback transcript"
          readOnly
          maxLength={1000}
        />
        <div className="input-footer">
          <span className="voice-hint">
            Speak in Tamil or English. Tamil appears in Tamil script.
          </span>
          <VoiceInput
            text={text}
            onTextChange={setText}
          />
        </div>
      </div>

      <p className="translator-note">
        Live transcription automatically detects spoken Tamil and English.
      </p>
    </section>
  );
}
