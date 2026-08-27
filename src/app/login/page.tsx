"use client";

import React, { useState } from "react";
import axios from "axios";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  CredentialResponse,
} from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import styles from "./login.module.css";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const handleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      setLoading(true);
      const token = credentialResponse.credential;

      if (!token) {
        console.error("Google token missing");
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await axios.post(`${apiUrl}/api/auth/google`, {
        token,
      });
      router.push("/");

      console.log(res.data);
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
    >
      <main className={styles.container}>
        {/* Background glow */}
        <div className={styles.bgGlow} />

        <div className={styles.wrapper}>
          {/* Logo / Brand */}
          <div className={styles.brandContainer}>
            <div className={styles.logo}>
              <span className={styles.logoText}>E</span>
            </div>
          </div>

          {/* Login Card */}
          <div className={styles.card}>
            <div className={styles.header}>
              <h1 className={styles.title}>
                Welcome to EMCA
              </h1>
              <p className={styles.subtitle}>
                Sign in to continue to your account
              </p>
            </div>

            {/* Google Login or Loading state */}
            {loading ? (
              <div className={styles.loadingWrapper}>
                <Loader2 size={32} className={styles.spinner} />
                <span>Signing in... Please wait</span>
              </div>
            ) : (
              <div className={styles.googleWrapper}>
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => {
                    console.log("Google Login Failed");
                  }}
                  theme="filled_black"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="320"
                />
              </div>
            )}

            {/* Divider */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>
                SECURE SIGN IN
              </span>
              <div className={styles.dividerLine} />
            </div>

            <p className={styles.termsText}>
              By continuing, you agree to EMCA&apos;s{" "}
              <span className={styles.link}>
                Terms of Service
              </span>{" "}
              and{" "}
              <span className={styles.link}>
                Privacy Policy
              </span>
              .
            </p>
          </div>

          {/* Footer */}
          <p className={styles.footer}>
            © {new Date().getFullYear()} EMCA. All rights reserved.
          </p>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}