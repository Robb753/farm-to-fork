"use client";
import React from "react";
import Header from "./_components/layout/Header";


function Provider({ children }) {
  return (
    <div>
      <Header />
      <div>{children}</div>
      
    </div>
  );
}

export default Provider;
