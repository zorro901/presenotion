/**
 * Individual slide rendering component
 * Displays slide content with formatting and media
 */

import React from 'react';
import type { Slide as SlideType, NotionBlock, NotionBlockType } from '@/types/notion';

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
 * Bullet list block
 */
const BulletListBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  return (
    <ul className="list-disc list-inside my-2">
      {block.listItems?.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};

/**
 * Numbered list block
 */
const NumberedListBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  return (
    <ol className="list-decimal list-inside my-2">
      {block.listItems?.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ol>
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
 * Code block
 */
const CodeBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  return (
    <pre className="bg-gray-100 p-4 rounded my-4 overflow-auto">
      <code className="font-mono text-sm">{block.content}</code>
    </pre>
  );
};

/**
 * Quote block
 */
const QuoteBlock: React.FC<{ block: NotionBlock }> = ({ block }) => {
  return (
    <blockquote className="border-l-4 border-gray-400 pl-4 italic my-4">
      <FormattedText text={block.content} formatting={block.formatting} />
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
