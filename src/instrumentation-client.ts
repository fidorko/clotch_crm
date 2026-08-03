// Next.js 16.2 + React 19.2: next/script (beforeInteractive) хибно триггерить
// новий dev-варнінг React "Encountered a script tag while rendering React
// component" — відомий false positive (theme-init у src/app/layout.tsx
// реально виконується коректно). Патчів з боку Next/React ще нема:
// https://github.com/facebook/react/issues/34008
if (process.env.NODE_ENV !== "production") {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering")) {
      return;
    }
    originalConsoleError(...args);
  };
}
