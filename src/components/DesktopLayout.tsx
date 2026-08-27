"use client";

import React from "react";
import Sidebar from "./Sidebar";
import EmptyChat from "./EmptyChat";
import styles from "./DesktopLayout.module.css";

interface DesktopLayoutProps {
  children?: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainContent}>
        {children || <EmptyChat />}
      </div>
    </div>
  );
}
