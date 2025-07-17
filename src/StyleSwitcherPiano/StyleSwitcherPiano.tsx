import React, { useEffect, useState } from "react";
import PianoBase from "../PianoBase/PianoBase";
import "./StyleSwitcherPiano.css";

const styles = [
  { name: "Classic", file: "/piano-themes/PianoBase.css" },
  { name: "Rounded", file: "/piano-themes/PianoBaseWithDress.css" },
  { name: "Organic", file: "/piano-themes/PianoBaseWithoutDress1.css" },
];

function useDynamicStyle(styleFile: string) {
  useEffect(() => {
    let link = document.getElementById("dynamic-piano-style") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.id = "dynamic-piano-style";
      document.head.appendChild(link);
    }
    link.href = styleFile;
    return () => {
      // para quitar el CSS cuando desmonta:
      link.parentNode && link.parentNode.removeChild(link);
    };
  }, [styleFile]);
}

export default function StyleSwitcherPiano(props: React.ComponentProps<typeof PianoBase>) {
  const [activeStyle, setActiveStyle] = useState(styles[0].file);

  useDynamicStyle(activeStyle);

  return (
    <div className="style-switcher-piano-container">
      <div className="style-switcher-piano-buttons">
        {styles.map((s, i) => {
          let styleClass = "classic";
          if (i === 1) styleClass = "rounded";
          if (i === 2) styleClass = "organic";
          return (
            <button
              key={s.file}
              className={
                [
                  "style-switcher-piano-btn",
                  styleClass,
                  activeStyle === s.file ? "active" : "inactive"
                ].join(" ")
              }
              onClick={() => setActiveStyle(s.file)}
            >
              {s.name}
            </button>
          );
        })}
      </div>
      <PianoBase {...props} />
    </div>
  );
}