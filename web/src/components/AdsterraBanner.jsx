import { useEffect } from "react";

export default function AdsterraBanner() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//pl28004679.effectivegatecpm.com/2168553b8b01177a106399f3982b40cf/invoke.js";
    script.async = true;
    document.getElementById("adsterra-container").appendChild(script);
  }, []);

  return (
    <div id="adsterra-container">
      <div id="container-2168553b8b01177a106399f3982b40cf"></div>
    </div>
  );
}
