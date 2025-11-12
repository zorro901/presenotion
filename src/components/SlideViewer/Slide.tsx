/**
 * Individual slide rendering component
 * Displays slide content with formatting and media
 */

import React, { useEffect, useRef } from 'react';
import type { Slide as SlideType, NotionBlock, NotionBlockType } from '@/types/notion';
import Prism from 'prismjs';

// Import Prism core languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';

interface SlideProps {
  slide: SlideType;
  fontSize: number;
}

export const Slide: React.FC<SlideProps> = ({ slide, fontSize }) => {
  return (
    <div
      className="slide-content"
      style={{
        fontSize: `${fontSize}px`,
        padding: '2rem',
        height: '100%',
        overflow: 'auto',
      }}
      role="region"
      aria-label={`Slide ${slide.index + 1}: ${slide.title}`}
    >
      <h1 className="slide-title" style={{ marginBottom: '1.5rem' }}>
        {slide.title}
      </h1>

      <div className="slide-blocks">
        {slide.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
};

/**
 * Render a single NotionBlock
 */
const BlockRenderer: React.FC<{ block: NotionBlock }> = ({ block }) => {
  switch (block.type) {
    case 'heading' as NotionBlockType:
      return <HeadingBlock block={block} />;

    case 'paragraph' as NotionBlockType:
      return <ParagraphBlock block={block} />;

    case 'bullet_list' as NotionBlockType:
      return <BulletListBlock block={block} />;

    case 'numbered_list' as NotionBlockType:
      return <NumberedListBlock block={block} />;

    case 'image' as NotionBlockType:
      return <ImageBlock block={block} />;

    case 'code' as NotionBlockType:
      return <CodeBlock block={block} />;

    case 'quote' as NotionBlockType:
      return <QuoteBlock block={block} />;

    case 'divider' as NotionBlockType:
      return <hr className="my-4" />;

    case 'unsupported' as NotionBlockType:
      return (
        <div className="text-gray-500 italic">
          [Unsupported content type]
        </div>
      );

    default:
      return null;
  }
};

/**
 * Heading block (H2-H6, H1 is slide title)
 */
const HeadingBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  const level = block.level || 2;
  const Tag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;

  return (
    <Tag className="my-4 font-bold">
      <FormattedText text={block.content} formatting={block.formatting} />
    </Tag>
  );
};

/**
 * Paragraph block
 */
const ParagraphBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  return (
    <p className="my-2">
      <FormattedText text={block.content} formatting={block.formatting} />
    </p>
  );
};

/**
 * Bullet list block with nested content support
 */
const BulletListBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  return (
    <div className="my-2">
      <ul className="list-disc list-inside">
        {block.listItems?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      {/* Render nested blocks (like quotes inside list items) */}
      {block.children && block.children.length > 0 && (
        <div className="ml-6 mt-2">
          {block.children.map((childBlock) => (
            <BlockRenderer key={childBlock.id} block={childBlock} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Numbered list block with nested content support
 */
const NumberedListBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  return (
    <div className="my-2">
      <ol className="list-decimal list-inside">
        {block.listItems?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
      {/* Render nested blocks (like quotes inside list items) */}
      {block.children && block.children.length > 0 && (
        <div className="ml-6 mt-2">
          {block.children.map((childBlock) => (
            <BlockRenderer key={childBlock.id} block={childBlock} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Image block
 */
const ImageBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  if (!block.imageUrl) return null;

  return (
    <div className="my-4">
      <img
        src={block.imageUrl}
        alt={block.imageAlt || 'Image'}
        className="max-w-full h-auto"
      />
    </div>
  );
};

/**
 * Code block with syntax highlighting
 */
const CodeBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [block.content, block.codeLanguage]);

  // Map Notion language names to Prism language identifiers
  const getPrismLanguage = (lang?: string): string => {
    if (!lang) return 'text';

    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'python': 'python',
      'py': 'python',
      'java': 'java',
      'css': 'css',
      'bash': 'bash',
      'sh': 'bash',
      'shell': 'bash',
      'json': 'json',
      'markdown': 'markdown',
      'md': 'markdown',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml',
    };

    return languageMap[lang.toLowerCase()] || 'text';
  };

  const prismLang = getPrismLanguage(block.codeLanguage);
  const displayLanguage = block.codeLanguage || 'text';

  return (
      <div className="my-4 rounded overflow-hidden border border-gray-300 bg-gray-50">
        {/* Language label */}
        {block.codeLanguage && (
            <div className="bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 uppercase">
              {displayLanguage}
            </div>
        )}

        {/* Code content */}
        <pre className="p-4 overflow-auto bg-gray-900 leading-none !m-0">
          <code
              ref={codeRef}
              className={`language-${prismLang} font-mono text-sm text-gray-100`}
          >
            {block.content}
          </code>
        </pre>
      </div>
  );
};

/**
 * Quote block with nested content support
 */
const QuoteBlock: React.FC<{ block: NotionBlock }> = ({block}) => {
  return (
    <blockquote className="border-l-4 border-gray-400 pl-4 my-4">
      <div className="italic">
        <FormattedText text={block.content} formatting={block.formatting} />
      </div>
      {/* Render nested blocks (like lists inside quotes) */}
      {block.children && block.children.length > 0 && (
        <div className="mt-2 not-italic">
          {block.children.map((childBlock) => (
            <BlockRenderer key={childBlock.id} block={childBlock} />
          ))}
        </div>
      )}
    </blockquote>
  );
};

/**
 * Render text with formatting
 */
interface FormattedTextProps {
  text: string;
  formatting?: Array<{
    type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';
    start: number;
    end: number;
  }>;
}

const FormattedText: React.FC<FormattedTextProps> = ({ text, formatting }) => {
  if (!formatting || formatting.length === 0) {
    return <>{text}</>;
  }

  // Apply formatting (simplified version)
  // In a full implementation, you would handle overlapping formats
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  formatting.forEach((format, idx) => {
    // Add unformatted text before this format
    if (format.start > lastIndex) {
      parts.push(text.substring(lastIndex, format.start));
    }

    // Add formatted text
    const formattedText = text.substring(format.start, format.end);
    let element: React.ReactNode = formattedText;

    switch (format.type) {
      case 'bold':
        element = <strong key={idx}>{formattedText}</strong>;
        break;
      case 'italic':
        element = <em key={idx}>{formattedText}</em>;
        break;
      case 'underline':
        element = <u key={idx}>{formattedText}</u>;
        break;
      case 'strikethrough':
        element = <s key={idx}>{formattedText}</s>;
        break;
      case 'code':
        element = <code key={idx} className="bg-gray-200 px-1 rounded">{formattedText}</code>;
        break;
    }

    parts.push(element);
    lastIndex = format.end;
  });

  // Add remaining unformatted text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};
