import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents = {
  p: ({ children }) => <p style={{ margin: '0.3em 0', lineHeight: '1.6' }}>{children}</p>,
  strong: ({ children }) => <strong style={{ color: 'var(--color-accent, #60a5fa)', fontWeight: 600 }}>{children}</strong>,
  ul: ({ children }) => <ul style={{ margin: '0.3em 0', paddingLeft: '1.2em' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '0.3em 0', paddingLeft: '1.2em' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '0.2em' }}>{children}</li>,
  h1: ({ children }) => <h1 style={{ fontSize: '1.1em', fontWeight: 700, margin: '0.5em 0 0.3em' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '1em', fontWeight: 600, margin: '0.4em 0 0.2em' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '0.95em', fontWeight: 600, margin: '0.3em 0 0.2em' }}>{children}</h3>,
  code: ({ inline, children }) => {
    if (inline) {
      return (
        <code style={{
          background: 'var(--color-bg-secondary)',
          padding: '0.15em 0.4em',
          borderRadius: '4px',
          fontSize: '0.9em',
          fontFamily: 'monospace',
        }}>
          {children}
        </code>
      );
    }
    return (
      <pre style={{
        background: 'var(--color-bg-secondary)',
        padding: '0.75em',
        borderRadius: '8px',
        overflow: 'auto',
        fontSize: '0.85em',
        margin: '0.4em 0',
        border: '1px solid var(--color-border)',
      }}>
        <code style={{ fontFamily: 'monospace' }}>{children}</code>
      </pre>
    );
  },
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '0.4em 0' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.85em',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
      }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{
      padding: '0.5em 0.75em',
      textAlign: 'left',
      fontWeight: 600,
      background: 'var(--color-bg-secondary)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{
      padding: '0.4em 0.75em',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {children}
    </td>
  ),
};

export default function MessageRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="message-markdown" style={{ fontSize: '14px', wordBreak: 'break-word' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
