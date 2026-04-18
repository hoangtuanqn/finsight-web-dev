import { useState, useEffect } from "react";

export const useDarkMode = () => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('finsight-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('finsight-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark];
}
