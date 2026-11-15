'use client';

import React, { useState, useMemo } from 'react';
import { marked } from 'marked';

export interface Bulletin {
  id: string;
  publishedDate: string;
  title: string;
  subtitle?: string;
  scripture?: string;
  hymn?: string;
  preacher?: string;
  presider?: string;
  location?: string;
  streamingUrl?: string;
  messageBody?: string;
  announcements?: string;
}

interface BulletinViewProps {
  bulletins: Bulletin[];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function renderRichHtml(raw?: string): string {
  if (!raw) return '';
  // リッチエディタ内の "## 見出し" 行をh3へ変換して視認性を整える
  const normalized = raw.replace(/<p>\s*##\s*(.*?)<\/p>/gi, '<h3>$1</h3>');
  return marked.parse(normalized, { async: false }) as string;
}

export default function BulletinView({ bulletins }: BulletinViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = bulletins[selectedIndex] || bulletins[0];

  const messageHtml = useMemo(
    () => renderRichHtml(current?.messageBody),
    [current?.messageBody]
  );
  const announcementsHtml = useMemo(
    () => renderRichHtml(current?.announcements),
    [current?.announcements]
  );

  const hasOlder = selectedIndex < bulletins.length - 1;
  const hasNewer = selectedIndex > 0;

  return (
    <div className="min-h-screen bg-stone-100 py-6 px-4 print:bg-white print:p-0">
      {/* 上部操作バー（印刷時は非表示） */}
      <div className="max-w-[210mm] mx-auto mb-4 bg-white border border-stone-200 rounded-lg px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-[10px] tracking-widest text-emerald-800 font-semibold uppercase">
            KEISEN CHRISTIAN CHURCH
          </p>
          <h1 className="text-sm font-bold text-stone-800">
            恵泉キリスト教会 週報システム
          </h1>
        </div>

        {/* バックナンバー切替コントロール（常時表示） */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => hasOlder && setSelectedIndex(selectedIndex + 1)}
            disabled={!hasOlder}
            className="px-2.5 py-1.5 text-xs font-medium rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="ひとつ前の週報へ"
          >
            ← 前号
          </button>

          <select
            aria-label="バックナンバー選択"
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="text-xs border border-stone-300 rounded px-2.5 py-1.5 bg-stone-50 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 max-w-[240px] sm:max-w-[300px]"
          >
            {bulletins.map((item, idx) => (
              <option key={item.id} value={idx}>
                {formatDate(item.publishedDate)}｜{item.title}
                {idx === 0 ? '（最新）' : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => hasNewer && setSelectedIndex(selectedIndex - 1)}
            disabled={!hasNewer}
            className="px-2.5 py-1.5 text-xs font-medium rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="ひとつ新しい週報へ"
          >
            次号 →
          </button>
        </div>

        {/* A4 PDF / 印刷ボタン */}
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded shadow-sm transition cursor-pointer"
        >
          A4 PDF / 印刷
        </button>
      </div>

      {/* A4 週報紙面本体 */}
      <article className="max-w-[210mm] mx-auto bg-white shadow-md border border-stone-200 px-8 py-9 sm:px-12 sm:py-11 text-stone-800 print:shadow-none print:border-none print:px-0 print:py-0">
        {/* 紙面ヘッダー */}
        <header className="border-b-2 border-emerald-800 pb-4 mb-5">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span>恵泉キリスト教会 主日礼拝週報</span>
            <time className="font-medium text-stone-700">
              {formatDate(current.publishedDate)}
            </time>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-snug">
            {current.title}
          </h2>
          {current.subtitle && (
            <p className="text-xs sm:text-sm text-emerald-900 font-medium mt-1">
              {current.subtitle}
            </p>
          )}
        </header>

        {/* 礼拝プログラム・案内ボックス */}
        {(current.scripture ||
          current.hymn ||
          current.preacher ||
          current.presider ||
          current.location ||
          current.streamingUrl) && (
          <section className="bg-stone-50 border border-stone-200 rounded-md p-3.5 mb-6 text-xs leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6">
              {current.scripture && (
                <div>
                  <span className="font-semibold text-stone-600">聖書箇所：</span>
                  <span>{current.scripture}</span>
                </div>
              )}
              {current.preacher && (
                <div>
                  <span className="font-semibold text-stone-600">説教奉仕：</span>
                  <span>{current.preacher}</span>
                </div>
              )}
              {current.location && (
                <div>
                  <span className="font-semibold text-stone-600">会場：</span>
                  <span>{current.location}</span>
                </div>
              )}
              {current.hymn && (
                <div>
                  <span className="font-semibold text-stone-600">賛美：</span>
                  <span>{current.hymn}</span>
                </div>
              )}
              {current.presider && (
                <div>
                  <span className="font-semibold text-stone-600">司会：</span>
                  <span>{current.presider}</span>
                </div>
              )}
              {current.streamingUrl && (
                <div className="sm:col-span-2">
                  <span className="font-semibold text-stone-600">オンライン配信：</span>
                  <a
                    href={current.streamingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-800 underline break-all"
                  >
                    {current.streamingUrl}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 礼拝メッセージ要旨 */}
        {messageHtml && (
          <section className="mb-7">
            <h3 className="text-sm font-bold text-emerald-900 border-l-4 border-emerald-800 pl-2.5 mb-3">
              礼拝メッセージ要旨
            </h3>
            <div
              className="prose prose-sm max-w-none text-stone-800 leading-relaxed space-y-2.5 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-stone-900 [&_h3]:mt-4 [&_h3]:mb-1.5"
              dangerouslySetInnerHTML={{ __html: messageHtml }}
            />
          </section>
        )}

        {/* 教会からのお知らせ・報告 */}
        {announcementsHtml && (
          <section className="pt-5 border-t border-stone-200">
            <h3 className="text-sm font-bold text-emerald-900 border-l-4 border-emerald-800 pl-2.5 mb-3">
              教会からのお知らせ・報告
            </h3>
            <div
              className="prose prose-sm max-w-none text-stone-800 leading-relaxed space-y-2 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-stone-900 [&_h3]:mt-3 [&_h3]:mb-1"
              dangerouslySetInnerHTML={{ __html: announcementsHtml }}
            />
          </section>
        )}

        {/* フッター */}
        <footer className="mt-8 pt-3 border-t border-stone-200 text-center text-[10px] text-stone-400">
          恵泉キリスト教会 / Keisen Christian Church
        </footer>
      </article>
    </div>
  );
}
