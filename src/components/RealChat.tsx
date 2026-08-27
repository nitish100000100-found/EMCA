"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { Plus, ArrowUp, Image as ImageIcon, FileText, X, ExternalLink, Loader2, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import styles from "./RealChat.module.css";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  type: "text" | "image" | "pdf";
  content: string;
  file_url: string | null;
  chat_overview?: string;
  created_at: string;
}

export default function RealChat({ conversationId }: { conversationId: string | number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError(null);

    if (!selectedFile) return;

    // Check allowed MIME types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError("Only JPEG, PNG, WEBP, GIF, and PDF files are allowed");
      e.target.value = "";
      setFile(null);
      return;
    }

    // Check file size (Max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError("File size must be smaller than 5 MB");
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  useEffect(() => {
    if (!conversationId) return;

    const getMessages = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await axios.post(
          `${apiUrl}/api/getchatmessages`,
          { conversation_id: conversationId },
          { withCredentials: true }
        );
        if (res.data?.success) {
          setMessages(res.data.messages || []);
        }
      } catch (e) {
        console.error("Failed to fetch messages:", e);
      } finally {
        setLoading(false);
      }
    };

    getMessages();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSelectOption = (type: "image" | "pdf" | "generate") => {
    setIsMenuOpen(false);
    if (type === "image") {
      imageInputRef.current?.click();
    } else if (type === "pdf") {
      pdfInputRef.current?.click();
    } else if (type === "generate") {
      setInput("Generate an image of ");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const formData = new FormData();
      formData.append("message", input.trim());
      formData.append("first", "false");
      formData.append("conversation_id", String(conversationId));
      if (file) {
        formData.append("file", file);
      }

      const res = await axios.post(`${apiUrl}/api/submit`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setInput("");
        setFile(null);
        setIsMenuOpen(false);

        const newItems: ChatMessage[] = [];
        if (res.data.userChat) newItems.push(res.data.userChat);
        if (res.data.aiChat) newItems.push(res.data.aiChat);

        setMessages((prev) => [...prev, ...newItems]);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      const errMsg = err?.response?.data?.error || "Failed to send message. Please try again.";
      setFileError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;

    try {
      setDeleting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await axios.post(
        `${apiUrl}/api/deletechat`,
        { conversation_id: conversationId },
        { withCredentials: true }
      );

      if (res.data?.success) {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const currentChatTitle = messages[0]?.chat_overview;

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerTitle}>
          {currentChatTitle || (conversationId ? `Chat #${conversationId}` : "New Chat")}
        </div>
        <button
          className={styles.deleteChatBtn}
          onClick={() => setShowDeleteModal(true)}
          disabled={deleting}
          title="Delete Conversation"
        >
          <Trash2 size={16} />
          <span>Delete Chat</span>
        </button>
      </div>

      {/* Confirm Delete Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmBox}>
            <div className={styles.confirmHeader}>
              <Trash2 size={24} color="#ef4444" />
              <h3>Delete Conversation</h3>
            </div>
            <p>
              Are you sure you want to delete this entire chat conversation? This action cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={handleDeleteConversation}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 size={16} className={styles.spinner} />
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={styles.messagesArea}>
        {messages.length === 0 ? (
          <div className={styles.loadingContainer}>
            {loading ? (
              <>
                <Loader2 className={styles.spinner} size={28} />
                <span>Loading messages...</span>
              </>
            ) : (
              <span>No messages yet.</span>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(msg.file_url || "")}`;

              return (
                <div key={msg.id} className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}>
                  <div className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.assistantAvatar}`}>
                    {isUser ? "U" : "AI"}
                  </div>
                  <div className={`${styles.messageBubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
                    {msg.type === "image" && msg.file_url && (
                      <div className={styles.fileAttachment}>
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={msg.file_url}
                            alt="Attachment"
                            width={300}
                            height={200}
                            className={styles.imagePreview}
                            unoptimized
                          />
                        </a>
                      </div>
                    )}
                    {msg.type === "pdf" && msg.file_url && (
                      <div className={styles.fileAttachment}>
                        <a href={pdfViewerUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfCard}>
                          <FileText size={20} color="#ef4444" />
                          <div className={styles.pdfInfo}>
                            <span className={styles.pdfName}>PDF Document</span>
                          </div>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                    {msg.content && (
                      <div className={`${styles.messageContent} ${isUser ? styles.userContent : styles.assistantContent}`}>
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                <div className={`${styles.avatar} ${styles.assistantAvatar}`}>
                  AI
                </div>
                <div className={styles.loadingContent}>
                  <Loader2 size={16} className={styles.spinner} />
                  <span>EMCA is thinking...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={pdfInputRef}
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Input Form */}
      <form onSubmit={handleSubmit} className={styles.inputContainer}>
        {fileError && (
          <div className={styles.fileErrorBadge}>
            <AlertCircle size={16} className={styles.errorIcon} />
            <span>{fileError}</span>
            <button
              type="button"
              className={styles.closeErrorBtn}
              onClick={() => setFileError(null)}
              title="Dismiss warning"
            >
              <X size={14} />
            </button>
          </div>
        )}
        {file && (
          <div className={styles.fileBadge}>
            <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
            <button type="button" className={styles.removeFileBtn} onClick={() => setFile(null)}>
              <X size={14} />
            </button>
          </div>
        )}
        <div className={styles.inputWrapper}>
          <button type="button" className={styles.attachBtn} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Plus size={20} />
          </button>
          {isMenuOpen && (
            <div className={styles.menuPopup}>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => handleSelectOption("image")}
              >
                <ImageIcon size={18} color="#6366f1" />
                <span>Upload Photo</span>
              </button>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => handleSelectOption("pdf")}
              >
                <FileText size={18} color="#ef4444" />
                <span>Upload PDF</span>
              </button>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => handleSelectOption("generate")}
              >
                <Sparkles size={18} color="#8b5cf6" />
                <span>Generate Image</span>
              </button>
            </div>
          )}
          <input
            type="text"
            className={styles.textInput}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className={styles.sendBtn} disabled={!input.trim() || loading}>
            {loading ? <div className={styles.spinner} /> : <ArrowUp size={20} />}
          </button>
        </div>
      </form>
    </div>
  );
}
