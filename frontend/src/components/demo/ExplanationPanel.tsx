import React, { useState, useMemo } from "react";
import DOMPurify from "dompurify";

interface ExplanationPanelProps {
  explanation: string;
}

const ExplanationPanel = React.memo(({ explanation }: ExplanationPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { truncatedContent, fullContent, needsTruncation } = useMemo(() => {
    if (!explanation)
      return {
        truncatedContent: "",
        fullContent: "",
        needsTruncation: false,
      };

    const formatContent = (text: string) => {
      // Remove common fluff phrases and filler words
      const cleanText = text
        .replace(/\b(Let me explain|I'll explain|Here's what|As you can see|It's important to note|Basically|Essentially|In other words|Simply put|To put it simply)\b[.,]?\s*/gi, '')
        .replace(/\b(This is|This shows|This demonstrates|This simulation shows)\b\s*/gi, '')
        .replace(/\b(The simulation|The visualization|The model)\b/gi, 'This')
        .replace(/\s{2,}/g, ' ') // Remove multiple spaces
        .trim();
      
      return cleanText
        .replace(/\*\*(.*?)\*\*/g, '<h3 class="explanation-heading">$1</h3>')
        .replace(/^- (.*$)/gim, '<li class="explanation-bullet">$1</li>')
        .replace(/^\* (.*$)/gim, '<li class="explanation-bullet">$1</li>')
        .replace(/^• (.*$)/gim, '<li class="explanation-bullet">$1</li>')
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return ''; // Skip empty lines
          if (trimmed.startsWith("<h3") || trimmed.startsWith("<li")) return trimmed;
          if (trimmed) return `<p class="explanation-text">${trimmed}</p>`;
          return "";
        })
        .filter(Boolean)
        .join("");
    };

    // Clean explanation first, then check truncation
    const cleanExplanation = explanation
      .replace(/\b(Let me explain|I'll explain|Here's what|As you can see|It's important to note|Basically|Essentially|In other words|Simply put|To put it simply)\b[.,]?\s*/gi, '')
      .replace(/\b(This is|This shows|This demonstrates|This simulation shows)\b\s*/gi, '')
      .replace(/\b(The simulation|The visualization|The model)\b/gi, 'This')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    const words = cleanExplanation.split(" ");
    const wordLimit = 50; // Reduced for more concise display
    const needsTruncation = words.length > wordLimit;

    const truncatedText = needsTruncation
      ? words.slice(0, wordLimit).join(" ") + "..."
      : cleanExplanation;

    return {
      truncatedContent: DOMPurify.sanitize(formatContent(truncatedText)),
      fullContent: DOMPurify.sanitize(formatContent(cleanExplanation)),
      needsTruncation,
    };
  }, [explanation]);

  return (
    <div className="explanation-wrapper">
      <style>{`
        .explanation-heading {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin: 8px 0 3px 0;
          padding-bottom: 2px;
          border-bottom: 2px solid #3b82f6;
          display: inline-block;
          line-height: 1.2;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .explanation-heading:first-child {
          margin-top: 0;
        }
        .explanation-bullet {
          list-style: none;
          position: relative;
          padding-left: 14px;
          margin: 2px 0;
          line-height: 1.3;
          color: #374151;
          font-size: 14px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        .explanation-bullet:before {
          content: "•";
          color: #3b82f6;
          font-weight: bold;
          position: absolute;
          left: 0;
          font-size: 12px;
        }
        .explanation-text {
          margin: 3px 0;
          line-height: 1.4;
          color: #4b5563;
          font-size: 14px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        .explanation-text:last-child {
          margin-bottom: 0;
        }
        .explanation-content {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding-bottom: 0;
        }
        .explanation-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .explanation-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <div
        className="explanation-content"
        dangerouslySetInnerHTML={{
          __html: isExpanded ? fullContent : truncatedContent,
        }}
      />

      {needsTruncation && (
        <div className="flex-shrink-0 pt-2 mt-2 border-t border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium underline focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 rounded transition-colors"
          >
            {isExpanded ? "Show Less" : "Read More"}
          </button>
        </div>
      )}
    </div>
  );
});

export default ExplanationPanel;
