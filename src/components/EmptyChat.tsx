"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Plus, ArrowUp, X, Image as ImageIcon, FileText, Sparkles, Loader2, AlertCircle } from "lucide-react";
import styles from "./EmptyChat.module.css";

export default function EmptyChat() {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    try {
      setLoading(true);
      setFileError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const formData = new FormData();
      formData.append("message", input.trim());
      formData.append("first", "true");
      if (file) {
        formData.append("file", file);
      }

      const res = await axios.post(`${apiUrl}/api/submit`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success && res.data?.conversation_id) {
        console.log("Chat submitted successfully:", res.data);
        router.push(`${apiUrl}/lookforChat/${res.data.conversation_id}`);
      }

      setInput("");
      setFile(null);
      setIsMenuOpen(false);
    } catch (error: any) {
      console.error("Failed to submit chat:", error);
      const errMsg = error?.response?.data?.error || "Failed to submit message. Please try again.";
      setFileError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (type: "image" | "pdf" | "generate-image") => {
    setIsMenuOpen(false);
    if (type === "image") {
      imageInputRef.current?.click();
    } else if (type === "pdf") {
      pdfInputRef.current?.click();
    } else if (type === "generate-image") {
      setInput("Create an image of ");
    }
  };

  const handleCardClick = (promptText: string) => {
    if (loading) return;
    setInput(promptText);
  };


  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Top Welcome Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to EMCA</h1>
          <p className={styles.subtitle}>
            What would you like to explore today? Ask questions, analyze PDFs,
            or write code.
          </p>
        </div>

        {/* Prompt Suggestion Cards */}
        <div className={styles.promptGrid}>
          <div
            className={styles.promptCard}
            onClick={() =>
              handleCardClick("Write a Python script for web scraping")
            }
          >
            <span className={styles.promptText}>Write code</span>
            <span className={styles.promptSubtext}>Python script for scraping</span>
          </div>
          <div
            className={styles.promptCard}
            onClick={() =>
              handleCardClick("Summarize the key points of this document")
            }
          >
            <span className={styles.promptText}>Analyze document</span>
            <span className={styles.promptSubtext}>Summarize key points</span>
          </div>
          <div
            className={styles.promptCard}
            onClick={() =>
              handleCardClick("Explain quantum computing in simple terms")
            }
          >
            <span className={styles.promptText}>Explain a concept</span>
            <span className={styles.promptSubtext}>Quantum computing simply</span>
          </div>
          <div
            className={styles.promptCard}
            onClick={() =>
              handleCardClick(
                "Draft a professional email for a project update"
              )
            }
          >
            <span className={styles.promptText}>Help me write</span>
            <span className={styles.promptSubtext}>Professional project email</span>
          </div>
        </div>
      </div>

      {/* Bottom Input Form */}
      <div className={styles.formWrapper}>
        <form onSubmit={handleSubmit} className={styles.chatForm}>
          {/* Sending Loader Status */}
          {loading && (
            <div className={styles.loadingStatus}>
              <Loader2 size={16} className={styles.spinner} />
              <span>Sending message...</span>
            </div>
          )}

          {/* File Validation Error Banner */}
          {fileError && (
            <div className={styles.fileErrorBadge}>
              <AlertCircle size={16} className={styles.errorIcon} />
              <span>{fileError}</span>
              <button
                type="button"
                onClick={() => setFileError(null)}
                className={styles.closeErrorBtn}
                title="Dismiss warning"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Selected File Tag */}
          {file && (
            <div className={styles.fileBadge}>
              <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className={styles.removeFileBtn}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Hidden File Inputs for Photo & PDF */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={handleFileSelect}
          />
          <input
            type="file"
            ref={pdfInputRef}
            accept="application/pdf"
            className={styles.hiddenFileInput}
            onChange={handleFileSelect}
          />

          {/* Input Row */}
          <div className={styles.inputRow}>
            {/* + Button & Dropdown Options */}
            <div className={styles.attachWrapper}>
              <button
                type="button"
                className={styles.attachBtn}
                onClick={() => setIsMenuOpen((prev) => !prev)}
                title="Add attachment"
                disabled={loading}
              >
                <Plus size={20} />
              </button>

              {/* Popover Menu */}
              {isMenuOpen && (
                <div className={styles.menuPopover}>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => handleSelectOption("image")}
                  >
                    <ImageIcon size={18} color="#3b82f6" />
                    <span>Upload Photo</span>
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => handleSelectOption("pdf")}
                  >
                    <FileText size={18} color="#10a37f" />
                    <span>Upload PDF</span>
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => handleSelectOption("generate-image")}
                  >
                    <Sparkles size={18} color="#a855f7" />
                    <span>Generate Image</span>
                  </button>
                </div>
              )}
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message EMCA..."
              className={styles.inputField}
              disabled={loading}
            />

            <button
              type="submit"
              className={styles.sendBtn}
              title="Send"
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <Loader2 size={18} className={styles.spinner} />
              ) : (
                <ArrowUp size={18} />
              )}
            </button>
          </div>
        </form>

        <p className={styles.footerText}>
          EMCA can make mistakes. Consider checking important info.
        </p>
      </div>
    </div>
  );
}
