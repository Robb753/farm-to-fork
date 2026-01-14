"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

type State = { hasError: boolean };

export default class HeaderErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Header error boundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <header
          className={`flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b border-gray-200 shadow-sm ${
            this.props.className ?? ""
          }`}
          style={{ zIndex: 40 }}
        >
          <div className="flex items-center">
            <span className="text-xl font-bold text-green-600">
              Farm To Fork
            </span>
          </div>
          <div className="text-gray-500 text-sm">Chargement...</div>
        </header>
      );
    }

    return this.props.children;
  }
}
