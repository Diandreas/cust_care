import React from "react";
import "@theme-toggles/react/css/Classic.css";
import { Classic } from "@theme-toggles/react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const isDark = theme === "dark";

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <div className="flex items-center justify-center">
            {/*@ts-ignore*/}
            <Classic
                duration={750}
                toggled={isDark}
                onToggle={toggleTheme}
                className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
                style={{ fontSize: '2rem' }}
            />
        </div>
    );
}
