"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Plus, X } from "lucide-react";
import Sidebar from "./Sidebar";
import EmptyChat from "./EmptyChat";
import styles from "./MobileLayout.module.css";

interface MobileLayoutProps {
  children?: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const handleNewChat = () => {
    setIsSidebarOpen(false);
    router.push("/");
  };

  return (
    <div className={styles.mobileContainer}>
      {/* Top Header Bar for Mobile */}
      <header className={styles.mobileHeader}>
        <div className={styles.headerLeft}>
          <button
            className={styles.iconBtn}
            onClick={() => setIsSidebarOpen(true)}
            title="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <span className={styles.headerTitle}>EMCA</span>
        </div>

        {/* Top Right: New Chat Icon Button */}
        <button
          className={styles.iconBtn}
          onClick={handleNewChat}
          title="New Chat"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.chatContent}>
        {children || <EmptyChat />}
      </main>

      {/* Mobile Sidebar & Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div style={{ flex: 1 }} />
              <button
                className={styles.drawerCloseBtn}
                onClick={() => setIsSidebarOpen(false)}
                title="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.sidebarWrapper} onClick={() => setIsSidebarOpen(false)}>
              <Sidebar />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
