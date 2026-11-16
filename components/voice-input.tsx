"use client";

import { useEffect, useRef, useState } from "react";

type Language = "Tamil" | "English";

interface RecognitionAlternativeLike {
  transcript: string;
}

interface RecognitionResultLike {
  isFinal: boolean;
  [index: number]: RecognitionAlternativeLike;
}

interface RecognitionEventLike {
  results: ArrayLike<RecognitionResultLike>;
}

interface RecognitionErrorLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

interface VoiceInputProps {
  language: Language;
  text: string;
  onTextChange: (text: string) => void;
  onListeningChange: (isListening: boolean) => void;
}

const maxTranscriptLength = 1000;

export default function VoiceInput({
  language,
  text,
  onTextChange,
  onListeningChange,
}: VoiceInputProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const startingTextRef = useRef("");
  const [isListening, setIsListening] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!isListening) return;

    const timer = window.setInterval(
      () => setElapsedSeconds((seconds) => seconds + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [isListening]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      }
    };
  }, []);

  function beginRecognition(
    Recognition: new () => SpeechRecognitionLike,
    locale: string,
    allowTamilFallback: boolean,
  ) {
    const recognition = new Recognition();
    recognition.lang = locale;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? "";
      }

      onTextChange(
        `${startingTextRef.current}${transcript}`.slice(0, maxTranscriptLength),
      );
    };

    recognition.onerror = (event) => {
      if (
        event.error === "language-not-supported" &&
        allowTamilFallback &&
        language === "Tamil"
      ) {
        recognitionRef.current = null;
        beginRecognition(Recognition, "ta", false);
        return;
      }

      const messages: Record<string, string> = {
        "not-allowed": "Allow microphone access in your browser to use voice input.",
        "service-not-allowed": "Your browser’s live speech service is unavailable.",
        "audio-capture": "No microphone was found. Check your audio input and try again.",
        "no-speech": "No speech was detected. Tap the microphone to try again.",
        network: "Live speech recognition needs a network connection.",
        "language-not-supported":
          "Tamil speech isn’t supported by this browser’s recognition service. Try Chrome with Tamil (India) enabled.",
      };
      recognitionRef.current = null;
      setStatus(
        messages[event.error] ??
          (event.error === "aborted"
            ? ""
            : "Live speech input stopped unexpectedly. Please try again."),
      );
      setIsListening(false);
      onListeningChange(false);
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setIsListening(false);
      onListeningChange(false);
      setStatus((currentStatus) =>
        currentStatus === "Listening…" || currentStatus === "Stopping…"
          ? "Voice input stopped."
          : currentStatus,
      );
    };

    try {
      recognitionRef.current = recognition;
      setElapsedSeconds(0);
      setStatus("Listening…");
      setIsListening(true);
      onListeningChange(true);
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      onListeningChange(false);
      setStatus("Couldn’t start live voice input. Check microphone access and try again.");
    }
  }

  function startListening() {
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!Recognition) {
      setStatus("Live speech input isn’t supported here. Try Chrome or Edge.");
      return;
    }

    startingTextRef.current = text.trim() ? `${text.trimEnd()} ` : "";
    setElapsedSeconds(0);
    setStatus("Listening…");
    setIsListening(true);
    onListeningChange(true);

    beginRecognition(
      Recognition,
      language === "Tamil" ? "ta-IN" : "en-IN",
      language === "Tamil",
    );
  }

  function stopListening() {
    setStatus("Stopping…");
    recognitionRef.current?.stop();
  }

  const formattedTime = `${Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(elapsedSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="voice-input">
      <button
        className={`voice-button${isListening ? " is-listening" : ""}`}
        type="button"
        onClick={isListening ? stopListening : startListening}
        aria-label={
          isListening ? "Stop live voice input" : `Start speaking in ${language}`
        }
        aria-pressed={isListening}
      >
        {isListening ? (
          <span className="voice-stop-icon" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect
              x="7"
              y="2.5"
              width="6"
              height="10"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5m-3 0h6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <span className="voice-status" aria-live="polite">
        {status ||
          (isListening ? `Listening · ${formattedTime}` : "Tap to speak")}
      </span>
      {isListening && (
        <span className="voice-wave" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  );
}
