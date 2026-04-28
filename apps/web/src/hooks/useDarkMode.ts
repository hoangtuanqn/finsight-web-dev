import { useState, useEffect, type Dispatch, type SetStateAction } from "react";

export const useDarkMode = (): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const [dark, setDark] = useState(() => {
    let saved = localStorage.getItem("finsight-theme") ?? "dark";
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    localStorage.setItem("finsight-theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, setDark];
};
