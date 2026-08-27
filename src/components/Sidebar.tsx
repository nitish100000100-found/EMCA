"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { Plus, MessageSquare, LogOut } from "lucide-react";
import styles from "./Sidebar.module.css";

interface ChatItem {
  id: number | string;
  name: string;
}

interface UserInfo {
  id?: number | string;
  name?: string;
  email?: string;
}

export default function Sidebar() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();
  const params = useParams();

  const currentActiveId = params?.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        // Fetch user & chats in parallel to cut loading time in half
        const [userRes, chatsRes] = await Promise.all([
          axios.get(`${apiUrl}/api/getme`, { withCredentials: true }),
          axios.get(`${apiUrl}/api/getallchatoverview`, { withCredentials: true }),
        ]);

        if (userRes.data?.user) {
          setUser(userRes.data.user);
        } else {
          router.push("/login");
          return;
        }

        if (chatsRes.data?.chats) {
          setChats(chatsRes.data.chats);
        }
      } catch (error) {
        console.error("Fetch data error:", error);
        router.push("/login");
      }
    };

    fetchData();
  }, [router]);

  const handleNewChat = () => {
    router.push(`${process.env.NEXT_PUBLIC_API_URL || ""}/`);
  };

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      await axios.post(`${apiUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      router.push("/login");
    }
  };

  return (
    <aside className={styles.sidebar}>
      {/* Top: Add New Chat Button */}
      <div className={styles.top}>
        <button className={styles.newChatBtn} onClick={handleNewChat}>
          <Plus size={18} />
          <span>New chat</span>
        </button>
      </div>

      {/* Middle: Chat Previews wrapped in /lookforChat/[id] */}
      <div className={styles.middleList}>
        {chats.length === 0 ? (
          <div style={{ padding: "12px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No chats available
          </div>
        ) : (
          chats.map((chat) => {
            const isActive =
              currentActiveId != null && String(chat.id) === String(currentActiveId);
            return (
              <Link
                key={chat.id}
                href={`${process.env.NEXT_PUBLIC_API_URL || ""}/lookforChat/${chat.id}`}
                className={`${styles.chatItem} ${isActive ? styles.activeChatItem : ""}`}
              >
                <MessageSquare size={16} />
                <span className={styles.itemTitle}>{chat.name || `Chat ${chat.id}`}</span>
              </Link>
            );
          })
        )}
      </div>

      {/* Bottom: User Info & Logout Button */}
      <div className={styles.bottomFooter}>
        <div className={styles.userInfo}>
          {user?.name && <span className={styles.userName}>{user.name}</span>}
          <span className={styles.userEmail}>{user?.email || "User"}</span>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
