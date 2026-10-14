type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
};

export function listenOnce() {
  if (typeof window === "undefined") return Promise.resolve<string | null>(null);
  const host = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  const Ctor = host.SpeechRecognition ?? host.webkitSpeechRecognition;
  if (!Ctor) return Promise.resolve<string | null>(null);
  return new Promise<string | null>((resolve) => {
    const recognition = new Ctor();
    recognition.lang = "bn-BD";
    recognition.interimResults = false;
    let done = false;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      resolve(value);
    };
    const timer = window.setTimeout(() => {
      recognition.stop();
      finish(null);
    }, 6000);
    recognition.onresult = (event) => {
      window.clearTimeout(timer);
      finish(event.results[0]?.[0]?.transcript ?? null);
    };
    recognition.onerror = () => {
      window.clearTimeout(timer);
      finish(null);
    };
    try {
      recognition.start();
    } catch {
      window.clearTimeout(timer);
      finish(null);
    }
  });
}
