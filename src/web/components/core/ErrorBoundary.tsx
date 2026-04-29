import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full glass p-8 rounded-3xl text-center space-y-6"
          >
            <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Ups! Etwas ist schiefgelaufen.</h1>
            <p className="text-muted-foreground leading-relaxed">
              Die Website konnte nicht korrekt geladen werden. Bitte versuche die Seite neu zu laden oder leere deinen Cache.
            </p>
            {this.state.error && (
              <div className="p-4 bg-muted/50 rounded-xl text-left overflow-auto max-h-40">
                <code className="text-xs text-destructive">{this.state.error.message}</code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full btn-primary"
            >
              Seite neu laden
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
