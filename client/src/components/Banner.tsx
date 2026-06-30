import { useState } from "react";
import { TruckIcon, XIcon, ZapIcon } from "lucide-react";

const Banner = () => {
  const [bannerVisible, setBannerVisible] = useState(() => {
    return sessionStorage.getItem("bannerDismissed") !== "true";
  });

  const dismissBanner = () => {
    setBannerVisible(false);
    sessionStorage.setItem("bannerDismissed", "true");
  };

  if (!bannerVisible) return null;

  return (
    <div className="relative overflow-hidden bg-linear-to-r from-app-green via-emerald-800 to-app-green text-xs text-white sm:text-sm">
      <div className="flex-center mx-auto max-w-7xl gap-6 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex-center gap-2">
          <TruckIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="text-white/85">Free Kathmandu Valley delivery over Rs. 1,500</span>
        </div>
        <span className="hidden text-white/40 sm:inline">|</span>
        <div className="hidden items-center gap-2 sm:flex">
          <ZapIcon className="size-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
          <span>From cart to door fast, reliable, and trustworthy every time.</span>
        </div>
      </div>
      <button
        type="button"
        onClick={dismissBanner}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60"
        aria-label="Dismiss banner"
      >
        <XIcon className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};

export default Banner;
