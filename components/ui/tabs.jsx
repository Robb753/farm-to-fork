"use client";
import React from "react";
import { useState } from "react";

export function Tabs({ defaultValue, children }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div>
      {React.Children.map(children, (child) =>
        child.type.name === "TabsList"
          ? React.cloneElement(child, { activeTab, setActiveTab })
          : React.cloneElement(child, { activeTab })
      )}
    </div>
  );
}

export function TabsList({
  children,
  activeTab,
  setActiveTab,
  className = "",
}) {
  return (
    <div className={`inline-flex rounded-md ${className}`}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
}

export function TabsTrigger({
  children,
  value,
  activeTab,
  setActiveTab,
  className = "",
}) {
  const isActive = value === activeTab;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium border rounded-l-md focus:outline-none ${
        isActive
          ? "bg-white text-green-700"
          : "text-gray-500 hover:text-green-600"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, activeTab, className = "" }) {
  if (value !== activeTab) return null;
  return <div className={className}>{children}</div>;
}
