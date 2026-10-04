import React, { useState, useMemo } from 'react';
import { Copy, Check, ExternalLink, CheckSquare, Square } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

// ============================================================================
// Syntax Highlighting Engine
// ============================================================================
const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'default', 'new', 'try', 'catch', 'finally',
  'throw', 'class', 'extends', 'super', 'this', 'import', 'export', 'from', 'as',
  'async', 'await', 'yield', 'typeof', 'instanceof', 'void', 'delete', 'in', 'of',
  'interface', 'type', 'enum', 'namespace', 'declare', 'abstract', 'implements',
  'private', 'protected', 'public', 'readonly', 'static', 'override',
  // Python
  'def', 'elif', 'pass', 'lambda', 'with', 'is', 'not', 'and', 'or', 'global',
  'nonlocal', 'assert', 'raise', 'except',
  // Rust
  'fn', 'pub', 'struct', 'impl', 'trait', 'mut', 'ref', 'match', 'use', 'mod',
  'crate', 'move', 'where', 'unsafe', 'loop',
  // Go
  'package', 'func', 'defer', 'go', 'chan', 'select', 'fallthrough',
  // SQL
  'select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete',
  'create', 'alter', 'drop', 'table', 'index', 'view', 'join', 'inner', 'left',
  'right', 'outer', 'on', 'group', 'by', 'order', 'having', 'limit', 'union',
]);

const TYPES = new Set([
  'string', 'number', 'boolean', 'symbol', 'bigint', 'any', 'unknown', 'never',
  'void', 'null', 'undefined', 'object', 'Record', 'Array', 'Promise', 'Set', 'Map',
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result', 'Box',
  'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'None',
]);

function highlightCodeTokens(code: string, language: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const lines = code.split('\n');

  lines.forEach((line, lineIdx) => {
    let charIdx = 0;
    const lineElements: React.ReactNode[] = [];

    while (charIdx < line.length) {
      // 1. Line Comments
      if (
        (line.startsWith('//', charIdx) && language !== 'python') ||
        (line.startsWith('#', charIdx) && (language === 'python' || language === 'bash' || language === 'shell' || language === 'sh' || language === 'yaml' || language === 'yml')) ||
        line.startsWith('--', charIdx)
      ) {
        lineElements.push(
          <span key={`comment-${charIdx}`} style={{ color: '#6A9955', fontStyle: 'italic' }}>
            {line.slice(charIdx)}
          </span>
        );
        charIdx = line.length;
        break;
      }

      // 2. Strings
      const quoteChar = line[charIdx];
      if (quoteChar === '"' || quoteChar === "'" || quoteChar === '`') {
        let endIdx = charIdx + 1;
        while (endIdx < line.length && line[endIdx] !== quoteChar) {
          if (line[endIdx] === '\\') endIdx++; // Skip escaped
          endIdx++;
        }
        if (endIdx < line.length) endIdx++; // include closing quote
        const strVal = line.slice(charIdx, endIdx);
        lineElements.push(
          <span key={`str-${charIdx}`} style={{ color: '#CE9178' }}>
            {strVal}
          </span>
        );
        charIdx = endIdx;
        continue;
      }

      // 3. Numbers
      if (/\d/.test(line[charIdx])) {
        let endIdx = charIdx;
        while (endIdx < line.length && /[\d\.xXa-fA-F_]/.test(line[endIdx])) {
          endIdx++;
        }
        lineElements.push(
          <span key={`num-${charIdx}`} style={{ color: '#B5CEA8' }}>
            {line.slice(charIdx, endIdx)}
          </span>
        );
        charIdx = endIdx;
        continue;
      }

      // 4. Identifiers / Keywords / Types
      if (/[a-zA-Z_$]/.test(line[charIdx])) {
        let endIdx = charIdx;
        while (endIdx < line.length && /[a-zA-Z0-9_$]/.test(line[endIdx])) {
          endIdx++;
        }
        const word = line.slice(charIdx, endIdx);
        const lower = word.toLowerCase();

        if (KEYWORDS.has(lower) || KEYWORDS.has(word)) {
          lineElements.push(
            <span key={`kw-${charIdx}`} style={{ color: '#C586C0', fontWeight: 600 }}>
              {word}
            </span>
          );
        } else if (TYPES.has(word) || TYPES.has(lower)) {
          lineElements.push(
            <span key={`type-${charIdx}`} style={{ color: '#4EC9B0' }}>
              {word}
            </span>
          );
        } else if (word === 'true' || word === 'false' || word === 'null' || word === 'undefined' || word === 'None') {
          lineElements.push(
            <span key={`bool-${charIdx}`} style={{ color: '#569CD6' }}>
              {word}
            </span>
          );
        } else if (endIdx < line.length && line[endIdx] === '(') {
          // Function call
          lineElements.push(
            <span key={`fn-${charIdx}`} style={{ color: '#DCDCAA' }}>
              {word}
            </span>
          );
        } else {
          lineElements.push(
            <span key={`id-${charIdx}`} style={{ color: '#9CDCFE' }}>
              {word}
            </span>
          );
        }
        charIdx = endIdx;
        continue;
      }

      // 5. Operators & Punctuation
      const char = line[charIdx];
      if (/[\{\}\(\)\[\],;]/.test(char)) {
        lineElements.push(
          <span key={`punc-${charIdx}`} style={{ color: '#D4D4D4' }}>
            {char}
          </span>
        );
      } else if (/[\+\-\*\/\%=<>&|!~^?]/.test(char)) {
        lineElements.push(
          <span key={`op-${charIdx}`} style={{ color: '#D4D4D4' }}>
            {char}
          </span>
        );
      } else {
        lineElements.push(char);
      }
      charIdx++;
    }

    tokens.push(
      <div key={`line-${lineIdx}`} style={{ minHeight: '18px' }}>
        {lineElements.length > 0 ? lineElements : '\u00A0'}
      </div>
    );
  });

  return tokens;
}

// ============================================================================
// Code Block with Header & Copy Button
// ============================================================================
interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = useMemo(() => {
    return highlightCodeTokens(code, language.toLowerCase());
  }, [code, language]);

  return (
    <div
      style={{
        margin: '12px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: '#1E1E1E',
        color: '#D4D4D4',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '12.5px',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Code Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: '#252526',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#858585',
          }}
        >
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy code"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '4px',
            color: copied ? '#4ADE80' : '#CCCCCC',
            padding: '3px 7px',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Content */}
      <div
        style={{
          padding: '12px 14px',
          overflowX: 'auto',
          lineHeight: '1.55',
          whiteSpace: 'pre',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        {highlighted}
      </div>
    </div>
  );
};

// ============================================================================
// Math Formatter (LaTeX rendering without heavy external bundles)
// ============================================================================
function formatMathFormula(latex: string): string {
  return latex
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\neq/g, '≠')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\infty/g, '∞')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sum/g, '∑')
    .replace(/\\int/g, '∫')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\cdot/g, '·')
    .replace(/\\quad/g, '   ')
    .replace(/\\,/g, ' ');
}

// ============================================================================
// Inline Markdown Elements Parser
// ============================================================================
function parseInline(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Inline Math: $formula$
    const mathMatch = remaining.match(/^\$([^$\n]+)\$/);
    if (mathMatch) {
      elements.push(
        <span
          key={`math-${keyIdx++}`}
          style={{
            fontFamily: '"Cambria Math", "Times New Roman", serif',
            fontStyle: 'italic',
            padding: '1px 4px',
            backgroundColor: 'rgba(37, 150, 190, 0.08)',
            borderRadius: '4px',
            color: 'var(--accent, #2596BE)',
          }}
        >
          {formatMathFormula(mathMatch[1])}
        </span>
      );
      remaining = remaining.slice(mathMatch[0].length);
      continue;
    }

    // 2. Images: ![alt](url)
    const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      elements.push(
        <img
          key={`img-${keyIdx++}`}
          src={imgMatch[2]}
          alt={imgMatch[1]}
          style={{
            maxWidth: '100%',
            maxHeight: '360px',
            borderRadius: '8px',
            margin: '8px 0',
            border: '1px solid var(--border, #E5E7EB)',
            display: 'block',
          }}
        />
      );
      remaining = remaining.slice(imgMatch[0].length);
      continue;
    }

    // 3. Links: [label](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      elements.push(
        <a
          key={`link-${keyIdx++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent, #2596BE)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          <span>{linkMatch[1]}</span>
          <ExternalLink size={10} style={{ opacity: 0.8 }} />
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 4. Inline Code: `code`
    const codeMatch = remaining.match(/^`([^`\n]+)`/);
    if (codeMatch) {
      elements.push(
        <code
          key={`code-${keyIdx++}`}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '12px',
            padding: '2px 5px',
            borderRadius: '4px',
            backgroundColor: 'var(--surface-secondary, rgba(0,0,0,0.06))',
            color: 'var(--foreground, #111111)',
            border: '1px solid var(--border, #E5E7EB)',
          }}
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 5. Bold & Italic: ***text***
    const boldItalicMatch = remaining.match(/^(\*\*\*|___)(.*?)\1/);
    if (boldItalicMatch) {
      elements.push(
        <strong key={`bi-${keyIdx++}`} style={{ fontWeight: 700, fontStyle: 'italic' }}>
          {boldItalicMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // 6. Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      elements.push(
        <strong key={`b-${keyIdx++}`} style={{ fontWeight: 600 }}>
          {boldMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 7. Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch && italicMatch[2].length > 0) {
      elements.push(
        <em key={`i-${keyIdx++}`} style={{ fontStyle: 'italic' }}>
          {italicMatch[2]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 8. Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(.*?)~~/);
    if (strikeMatch) {
      elements.push(
        <del key={`del-${keyIdx++}`} style={{ textDecoration: 'line-through', opacity: 0.7 }}>
          {strikeMatch[1]}
        </del>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // 9. Plain text slice up to next formatting character
    const nextSpecial = remaining.search(/[\$`!\[\*_~]/);
    if (nextSpecial === -1) {
      elements.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      elements.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      elements.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return elements;
}

// ============================================================================
// Block Markdown Parser
// ============================================================================
interface BlockToken {
  type: 'code' | 'table' | 'heading' | 'quote' | 'checklist' | 'ul' | 'ol' | 'math' | 'hr' | 'p';
  level?: number;
  language?: string;
  code?: string;
  headers?: string[];
  alignments?: ('left' | 'center' | 'right')[];
  rows?: string[][];
  items?: Array<{ text: string; checked?: boolean }>;
  content?: string;
}

function parseBlocks(markdown: string): BlockToken[] {
  const blocks: BlockToken[] = [];
  const lines = markdown.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code Block ```
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++; // skip closing ```
      }
      blocks.push({
        type: 'code',
        language: language || 'text',
        code: codeLines.join('\n'),
      });
      continue;
    }

    // 2. Math Block $$ ... $$
    if (trimmed.startsWith('$$')) {
      const mathLines: string[] = [];
      const inlineMathEnd = trimmed.slice(2).indexOf('$$');
      if (inlineMathEnd !== -1) {
        // Single line $$ ... $$
        blocks.push({
          type: 'math',
          content: trimmed.slice(2, 2 + inlineMathEnd).trim(),
        });
        i++;
        continue;
      }

      i++;
      while (i < lines.length && !lines[i].trim().startsWith('$$')) {
        mathLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('$$')) {
        i++;
      }
      blocks.push({
        type: 'math',
        content: mathLines.join('\n').trim(),
      });
      continue;
    }

    // 3. Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 4. Headings: # H1, ## H2, ### H3, #### H4
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 5. Blockquote: > quote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'quote',
        content: quoteLines.join('\n'),
      });
      continue;
    }

    // 6. Tables: | Header | Header |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && lines[i + 1].includes('|---')) {
      const headerLine = trimmed;
      const separatorLine = lines[i + 1].trim();
      const headers = headerLine
        .slice(1, -1)
        .split('|')
        .map(h => h.trim());

      const alignments = separatorLine
        .slice(1, -1)
        .split('|')
        .map(cell => {
          const c = cell.trim();
          if (c.startsWith(':') && c.endsWith(':')) return 'center';
          if (c.endsWith(':')) return 'right';
          return 'left';
        });

      i += 2; // skip header and separator
      const rows: string[][] = [];

      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const rowCells = lines[i]
          .trim()
          .slice(1, -1)
          .split('|')
          .map(cell => cell.trim());
        rows.push(rowCells);
        i++;
      }

      blocks.push({
        type: 'table',
        headers,
        alignments: alignments as ('left' | 'center' | 'right')[],
        rows,
      });
      continue;
    }

    // 7. Checklists: - [ ] or - [x]
    const checkMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (checkMatch) {
      const items: Array<{ text: string; checked: boolean }> = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
        if (!m) break;
        items.push({
          checked: m[2].toLowerCase() === 'x',
          text: m[3].trim(),
        });
        i++;
      }
      blocks.push({
        type: 'checklist',
        items,
      });
      continue;
    }

    // 8. Unordered Lists: - item or * item
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (ulMatch) {
      const items: Array<{ text: string }> = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)[-*+]\s+(.*)$/);
        if (!m) break;
        items.push({ text: m[2].trim() });
        i++;
      }
      blocks.push({
        type: 'ul',
        items,
      });
      continue;
    }

    // 9. Ordered Lists: 1. item
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olMatch) {
      const items: Array<{ text: string }> = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)\d+\.\s+(.*)$/);
        if (!m) break;
        items.push({ text: m[2].trim() });
        i++;
      }
      blocks.push({
        type: 'ol',
        items,
      });
      continue;
    }

    // 10. Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // 11. Normal Paragraph (accumulate until empty line or block marker)
    const pLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('$$') &&
      !/^(\s*)[-*+]\s+/.test(lines[i]) &&
      !/^(\s*)\d+\.\s+/.test(lines[i])
    ) {
      pLines.push(lines[i]);
      i++;
    }

    blocks.push({
      type: 'p',
      content: pLines.join('\n'),
    });
  }

  return blocks;
}

// ============================================================================
// Main Markdown Renderer Component
// ============================================================================
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
}) => {
  const blocks = useMemo(() => {
    return parseBlocks(content || '');
  }, [content]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontSize: '14px',
        lineHeight: '1.6',
        color: 'inherit',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {blocks.map((block, idx) => {
        // Code Block
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={`code-${idx}`}
              language={block.language || 'text'}
              code={block.code || ''}
            />
          );
        }

        // Table
        if (block.type === 'table') {
          return (
            <div
              key={`table-${idx}`}
              style={{
                margin: '12px 0',
                overflowX: 'auto',
                borderRadius: '8px',
                border: '1px solid var(--border, #E5E7EB)',
                backgroundColor: 'var(--surface, #FFFFFF)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-secondary, #F9FAFB)', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
                    {block.headers?.map((h, hIdx) => {
                      const align = block.alignments?.[hIdx] || 'left';
                      return (
                        <th
                          key={`th-${hIdx}`}
                          style={{
                            padding: '8px 12px',
                            fontWeight: 600,
                            textAlign: align,
                            color: 'var(--foreground, #111111)',
                          }}
                        >
                          {parseInline(h)}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {block.rows?.map((row, rIdx) => (
                    <tr
                      key={`tr-${rIdx}`}
                      style={{
                        borderBottom: rIdx < (block.rows?.length || 0) - 1 ? '1px solid var(--border, #F3F4F6)' : 'none',
                        backgroundColor: rIdx % 2 === 1 ? 'var(--surface-secondary, #FCFCFD)' : 'transparent',
                      }}
                    >
                      {row.map((cell, cIdx) => {
                        const align = block.alignments?.[cIdx] || 'left';
                        return (
                          <td
                            key={`td-${cIdx}`}
                            style={{
                              padding: '8px 12px',
                              textAlign: align,
                              color: 'var(--foreground, #374151)',
                            }}
                          >
                            {parseInline(cell)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Headings
        if (block.type === 'heading') {
          const contentNodes = parseInline(block.content || '');
          if (block.level === 1) {
            return (
              <h1
                key={`h1-${idx}`}
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  marginTop: '12px',
                  marginBottom: '6px',
                  color: 'var(--foreground, #111111)',
                  lineHeight: '1.3',
                }}
              >
                {contentNodes}
              </h1>
            );
          }
          if (block.level === 2) {
            return (
              <h2
                key={`h2-${idx}`}
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  marginTop: '10px',
                  marginBottom: '4px',
                  color: 'var(--foreground, #111111)',
                  lineHeight: '1.35',
                }}
              >
                {contentNodes}
              </h2>
            );
          }
          if (block.level === 3) {
            return (
              <h3
                key={`h3-${idx}`}
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  marginTop: '8px',
                  marginBottom: '4px',
                  color: 'var(--foreground, #111111)',
                }}
              >
                {contentNodes}
              </h3>
            );
          }
          return (
            <h4
              key={`h4-${idx}`}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                marginTop: '6px',
                marginBottom: '2px',
                color: 'var(--foreground, #111111)',
              }}
            >
              {contentNodes}
            </h4>
          );
        }

        // Blockquote
        if (block.type === 'quote') {
          return (
            <blockquote
              key={`quote-${idx}`}
              style={{
                margin: '8px 0',
                padding: '6px 14px',
                borderLeft: '3px solid var(--accent, #2596BE)',
                backgroundColor: 'rgba(37, 150, 190, 0.05)',
                borderRadius: '0 6px 6px 0',
                color: 'var(--foreground, #374151)',
                fontStyle: 'italic',
              }}
            >
              {parseInline(block.content || '')}
            </blockquote>
          );
        }

        // Checklist
        if (block.type === 'checklist') {
          return (
            <ul
              key={`checklist-${idx}`}
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '6px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {block.items?.map((item, itemIdx) => (
                <li
                  key={`cl-item-${itemIdx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13.5px',
                  }}
                >
                  {item.checked ? (
                    <CheckSquare size={15} color="var(--accent, #2596BE)" />
                  ) : (
                    <Square size={15} color="var(--muted, #9CA3AF)" />
                  )}
                  <span style={{ textDecoration: item.checked ? 'line-through' : 'none', opacity: item.checked ? 0.75 : 1 }}>
                    {parseInline(item.text)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // Unordered List
        if (block.type === 'ul') {
          return (
            <ul
              key={`ul-${idx}`}
              style={{
                paddingLeft: '20px',
                margin: '6px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {block.items?.map((item, itemIdx) => (
                <li key={`ul-item-${itemIdx}`} style={{ lineHeight: '1.5' }}>
                  {parseInline(item.text)}
                </li>
              ))}
            </ul>
          );
        }

        // Ordered List
        if (block.type === 'ol') {
          return (
            <ol
              key={`ol-${idx}`}
              style={{
                paddingLeft: '22px',
                margin: '6px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {block.items?.map((item, itemIdx) => (
                <li key={`ol-item-${itemIdx}`} style={{ lineHeight: '1.5' }}>
                  {parseInline(item.text)}
                </li>
              ))}
            </ol>
          );
        }

        // Math Block
        if (block.type === 'math') {
          return (
            <div
              key={`math-block-${idx}`}
              style={{
                margin: '10px 0',
                padding: '12px 16px',
                backgroundColor: 'rgba(37, 150, 190, 0.06)',
                border: '1px solid rgba(37, 150, 190, 0.2)',
                borderRadius: '8px',
                textAlign: 'center',
                fontFamily: '"Cambria Math", "Times New Roman", serif',
                fontSize: '16px',
                color: 'var(--foreground, #111111)',
                overflowX: 'auto',
              }}
            >
              {formatMathFormula(block.content || '')}
            </div>
          );
        }

        // Horizontal Rule
        if (block.type === 'hr') {
          return (
            <hr
              key={`hr-${idx}`}
              style={{
                margin: '14px 0',
                border: 'none',
                borderTop: '1px solid var(--border, #E5E7EB)',
              }}
            />
          );
        }

        // Normal Paragraph
        return (
          <p
            key={`p-${idx}`}
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {parseInline(block.content || '')}
          </p>
        );
      })}

      {/* Streaming Active Cursor */}
      {isStreaming && (
        <span
          style={{
            display: 'inline-block',
            width: '7px',
            height: '14px',
            backgroundColor: 'var(--accent, #2596BE)',
            borderRadius: '1px',
            marginLeft: '2px',
            verticalAlign: 'middle',
            animation: 'pulse 1s infinite ease-in-out',
          }}
        />
      )}
    </div>
  );
};

export default MarkdownRenderer;
