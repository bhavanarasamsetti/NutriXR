// Scene Viewer on Android does not expose navigator.xr; treat Android Chrome as supported.
const isAndroidChrome = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android/i.test(ua) && /Chrome/i.test(ua);
};

// Basic AR support check. Use Scene Viewer on Android, otherwise check WebXR when available.
export async function checkARSupport() {
  try {
    if (isAndroidChrome()) {
      return { supported: true, reason: 'Scene Viewer on Android' };
    }
    if (!navigator?.xr) {
      return { supported: false, reason: 'WebXR not available' };
    }
    const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
    return { supported: arSupported, reason: arSupported ? 'AR available' : 'AR not available' };
  } catch (err) {
    console.warn('AR support check error:', err);
    return { supported: false, reason: err.message };
  }
}
