import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import type { TimelineResult } from '../lib/types';
import { buildTimelineStory } from '../lib/story';

export function StoryView({ result }: { result: TimelineResult }) {
  const story = useMemo(() => buildTimelineStory(result), [result]);

  const paragraphs = story.split('\n\n').filter(Boolean);

  return (
    <div className="bg-surface border border-edge rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-accent-soft border-b border-edge flex items-center gap-2">
        <BookOpen size={18} className="text-primary" />
        <span className="font-semibold text-ink">Change Story</span>
        <span className="text-xs text-ink-muted ml-2">
          A plain-English narrative of all changes
        </span>
      </div>
      <div className="px-5 py-4 space-y-4 text-sm leading-relaxed text-ink">
        {paragraphs.map((p, i) => {
          // Detect step headers (lines starting with ──)
          if (p.startsWith('──')) {
            return (
              <div
                key={i}
                className="font-bold text-primary border-t border-edge pt-4 mt-2"
              >
                {p}
              </div>
            );
          }
          // Detect bullet lists
          if (p.includes('\n•')) {
            const lines = p.split('\n');
            return (
              <div key={i}>
                {lines[0] && (
                  <p className="font-medium text-ink mb-2">{lines[0]}</p>
                )}
                <ul className="space-y-1.5 ml-1">
                  {lines.slice(1).map((line, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-ink-muted"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      <span>{line.replace(/^•\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          return (
            <p key={i} className="text-ink">
              {p}
            </p>
          );
        })}
      </div>
    </div>
  );
}
