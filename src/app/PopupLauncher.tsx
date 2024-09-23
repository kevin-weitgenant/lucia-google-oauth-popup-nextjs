"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PopupLauncher() {
  const router = useRouter();
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  useEffect(() => {
    // Set up event listener for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin) {
        if (event.data && typeof event.data === "object") {
          if (
            event.data.type === "GOOGLE_LOGIN_COMPLETE" &&
            event.data.success
          ) {
            router.refresh();
            
          } 
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Clean up
    return () => {
      if (popupWindow) popupWindow.close();
      window.removeEventListener("message", handleMessage);
    };
  }, [popupWindow]);

  const openPopup = () => {
    const popup = window.open("/login/google/api", "Login", "width=500,height=600");
    setPopupWindow(popup);
  };

  return (
    <div>
      <button onClick={openPopup}>Sign in with Google</button>
     
    </div>
  );
}
