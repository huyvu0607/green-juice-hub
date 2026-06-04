import ReactMarkdown from 'react-markdown';

// Detect đơn giản: nếu có thẻ HTML thì render HTML, ngược lại render Markdown
function isHTML(str) {
  return /<[a-z][\s\S]*>/i.test(str);
}

export default function RichText({ content, className = "" }) {
  if (!content) return <p className="text-secondary text-sm">Chưa có mô tả.</p>;

  const base = `prose prose-sm max-w-none
    prose-headings:font-display prose-headings:text-primary
    prose-p:text-secondary prose-p:leading-relaxed prose-p:mb-3
    prose-img:rounded-xl prose-img:my-4 prose-img:max-w-full prose-img:mx-auto
    prose-em:italic prose-strong:font-semibold prose-strong:text-primary
    prose-ul:list-disc prose-ul:pl-5 prose-li:text-secondary
    prose-a:text-[var(--color-primary)] prose-a:underline
    ${className}`;

  if (isHTML(content)) {
    return <div className={base} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return (
    <div className={base}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}