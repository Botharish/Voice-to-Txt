"use client";

import { useState } from "react";
import VoiceInput from "@/components/voice-input";

const languages = ["Tamil", "English"] as const;
type Language = (typeof languages)[number];

export default function VoiceToText() {
  const [language, setLanguage] = useState<Language>("English");
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);

  return (
    <section className="translator" aria-label="Student feedback">
      <div className="language-bar">
        <LanguagePicker
          label="Feedback language"
          value={language}
          onChange={setLanguage}
          disabled={isListening}
        />
      </div>

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
          aria-label={`Student feedback in ${language}`}
          lang={language === "Tamil" ? "ta-IN" : "en-IN"}
          readOnly
          maxLength={1000}
        />
        <div className="input-footer">
          <span className="voice-hint">
            Tap the microphone, then speak. Your words appear live.
          </span>
          <VoiceInput
            language={language}
            text={text}
            onTextChange={setText}
            onListeningChange={setIsListening}
          />
        </div>
      </div>

      <p className="translator-note">
        Live speech recognition is provided by your browser.
      </p>
    </section>
  );
}

function LanguagePicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: Language;
  onChange: (language: Language) => void;
  disabled: boolean;
}) {
  return (
    <div className="language-picker">
      <span className="language-label">{label}</span>
      <div className="language-options" role="group" aria-label={label}>
        {languages.map((language) => (
          <button
            className={`language-option${value === language ? " selected" : ""}`}
            type="button"
            key={language}
            aria-pressed={value === language}
            disabled={disabled}
            onClick={() => onChange(language)}
          >
            {language}
          </button>
        ))}
      </div>
    </div>
  );
}
