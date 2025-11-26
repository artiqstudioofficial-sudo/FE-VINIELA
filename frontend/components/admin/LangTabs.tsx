import React from "react";
import { Language } from "../../types";

interface LangTabsProps {
  activeLang: Language;
  onChange: (lang: Language) => void;
}

const LangTabs: React.FC<LangTabsProps> = ({ activeLang, onChange }) => {
  return (
    <div className="border-b border-gray-200 mb-4">
      <nav className="-mb-px flex space-x-4" aria-label="Tabs">
        {(["id", "en", "cn"] as Language[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeLang === lang
                ? "border-viniela-gold text-viniela-gold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default LangTabs;
