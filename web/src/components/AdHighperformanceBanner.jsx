import { useEffect } from "react";

export default function AdHighperformanceBanner() {
  useEffect(() => {
    // Create the script that sets atOptions
    const inlineScript = document.createElement("script");
    inlineScript.innerHTML = `
      atOptions = {
        'key' : '49596102a1f137d3ed133763c2138ab9',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;

    // Create the script that loads the ad
    const adScript = document.createElement("script");
    adScript.src = "//www.highperformanceformat.com/49596102a1f137d3ed133763c2138ab9/invoke.js";
    adScript.type = "text/javascript";
    adScript.async = true;

    const container = document.getElementById("highperformance-ad-container");
    if (container) {
      container.appendChild(inlineScript);
      container.appendChild(adScript);
    }
  }, []);

  return <div id="highperformance-ad-container" style={{ textAlign: "center", margin: "20px 0" }}></div>;
}
