import { useEffect, useState } from "react";

const detectMobile = () => {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
};

export default function useWebXRSupport() {
  const [supported, setSupported] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isMobile, setIsMobile] = useState(detectMobile());

  useEffect(() => {
    let active = true;

    const runCheck = async () => {
      if (typeof navigator === "undefined" || !navigator.xr?.isSessionSupported) {
        if (active) {
          setSupported(false);
          setChecking(false);
        }
        return;
      }

      try {
        const result = await navigator.xr.isSessionSupported("immersive-ar");
        if (active) {
          setSupported(result);
          setChecking(false);
        }
      } catch (err) {
        if (active) {
          setSupported(false);
          setChecking(false);
        }
      }
    };

    setIsMobile(detectMobile());
    runCheck();

    return () => {
      active = false;
    };
  }, []);

  return { supported, checking, isMobile };
}
