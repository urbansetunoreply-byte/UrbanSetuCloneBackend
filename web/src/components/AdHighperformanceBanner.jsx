import React, { useEffect } from "react";

export default function AdHighperformanceBanner() {
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // mobile breakpoint

    // Select ad config based on device
    const adConfig = isMobile
      ? {
        key: "083539ee185eea5bd77de048fed217ac",
        height: 50,
        width: 320
      }
      : {
        key: "49596102a1f137d3ed133763c2138ab9",
        height: 90,
        width: 728
      };

    // Create script for atOptions
    const inlineScript = document.createElement("script");
    inlineScript.innerHTML = `
      atOptions = {
        'key' : '${adConfig.key}',
        'format' : 'iframe',
        'height' : ${adConfig.height},
        'width' : ${adConfig.width},
        'params' : {}
      };
    `;

    // Create script to load the ad
    const adScript = document.createElement("script");
    adScript.src = `//www.highperformanceformat.com/${adConfig.key}/invoke.js`;
    adScript.type = "text/javascript";
    adScript.async = true;

    const container = document.getElementById("highperformance-ad-container");
    if (container) {
      container.innerHTML = ""; // clear previous ads on rerender
      container.appendChild(inlineScript);
      container.appendChild(adScript);
    }
  }, []);

  return (
    <div
      id="highperformance-ad-container"
      style={{ textAlign: "center", margin: "20px 0" }}
    ></div>
  );
}
