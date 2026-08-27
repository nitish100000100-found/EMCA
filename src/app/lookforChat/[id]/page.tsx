"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DesktopLayout from "@/components/DesktopLayout";
import MobileLayout from "@/components/MobileLayout";
import RealChat from "@/components/RealChat";

export default function LookForChatPage() {
  const params = useParams();
  const conversationId = (params?.id as string) || "";

  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isMobile = width > 0 && width < 900;

  return isMobile ? (
    <MobileLayout>
      <RealChat conversationId={conversationId} />
    </MobileLayout>
  ) : (
    <DesktopLayout>
      <RealChat conversationId={conversationId} />
    </DesktopLayout>
  );
}
