import React, { useEffect, useState } from "react";
import PianoBase from "../PianoBase/PianoBase";

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
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {styles.map((s, i) => (
          <button
            key={s.file}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: activeStyle === s.file ? "#222" : "#ccc",
              color: activeStyle === s.file ? "#fff" : "#333",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: 15 + i * 2,
              fontFamily: i === 1 ? "cursive" : i === 2 ? "monospace" : "inherit",
              boxShadow: activeStyle === s.file ? "0 2px 8px #2228" : "none",
              transition: "all 0.2s"
            }}
            onClick={() => setActiveStyle(s.file)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <PianoBase {...props} />
    </div>
  );
}