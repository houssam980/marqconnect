import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";

const basename = import.meta.env.BASE_URL;

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", color: "white", background: "#333" }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log("Mounting application...");
console.log("BASE_URL:", basename);
console.log("Environment:", import.meta.env.MODE);

// Create a wrapper component to use AuthProvider inside BrowserRouter
const AppWithAuth = () => {
  console.log("AppWithAuth rendering...");
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

console.log("Creating React root...");
const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
} else {
  console.log("Root element found, rendering app...");
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppWithAuth />
        </HashRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  );
  console.log("React render called");
}
