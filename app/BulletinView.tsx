'use client';

import React, { useState, useMemo } from 'react';
import { Bulletin } from '@/libs/microcms';
import { marked } from 'marked';

export default function BulletinView({ bulletins }: { bulletins: Bulletin[] }) {
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>(bulletins[0]?.id || '');

  // 公開データに存在する「年」の一覧を自動抽出（新しい順）
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    bulletins.forEach((b) => {
      if (b.publishedDate) {
        const y = new Date(b.publishedDate).getFullYear();
        if (!isNaN(y)) years.add(String(y));
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [bulletins]);

  // 年とキーワードで絞り込んだ週報リスト
  const filteredBulletins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bulletins.filter((b) => {
      if (selectedYear !== 'ALL' && b.publishedDate) {
        const y = String(new Date(b.publishedDate).getFullYear());
        if (y !== selectedYear) return false;
      }
      if (q) {
        const targetText = [
          b.title,
          b.subtitle,
          b.scripture,
          b.preacher,
          b.content,
          b.report,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!targetText.includes(q)) return false;
      }
      return true;
    });
  }, [bulletins, selectedYear, searchQuery]);

  // 現在表示する週報（絞り込み結果内に選択中のIDがあればそれを、なければ先頭を表示）
  const currentIndex = useMemo(() => {
    if (filteredBulletins.length === 0) return -1;
    const idx = filteredBulletins.findIndex((b) => b.id === selectedId);
    return idx >= 0 ? idx : 0;
  }, [filteredBulletins, selectedId]);

  const bulletin =
    currentIndex >= 0 ? filteredBulletins[currentIndex] : bulletins[0];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  };

  // microCMSのリッチエディタ内の "## " やMarkdown見出しを綺麗に整形
  const formatRichContent = (raw?: string) => {
    if (!raw) return '';
    const cleaned = raw
      .replace(/<p>\s*###\s*(.*?)<\/p>/gi, '<h3>$1</h3>')
      .replace(/<p>\s*##\s*(.*?)<\/p>/gi, '<h2>$1</h2>')
      .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
    return marked.parse(cleaned, { async: false }) as string;
  };

  const contentHtml = formatRichContent(bulletin?.content);
  const reportHtml = formatRichContent(bulletin?.report);

  const hasOlder = currentIndex >= 0 && currentIndex < filteredBulletins.length - 1;
  const hasNewer = currentIndex > 0;
  const isFiltering = selectedYear !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilter = () => {
    setSelectedYear('ALL');
    setSearchQuery('');
    if (bulletins[0]) setSelectedId(bulletins[0].id);
  };

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4 print:bg-white print:p-0">
      {/* A4印刷・PDF保存用の厳密なスタイル定義 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 14mm;
          }
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          h2, h3 {
            break-after: avoid;
            page-break-after: avoid;
          }
          p, li, blockquote {
            orphans: 3;
            widows: 3;
          }
        }
      `}</style>

      {/* 上部コントロールバー（印刷・PDFには含まれない） */}
      <div className="max-w-[210mm] mx-auto mb-6 bg-white p-4 rounded-xl shadow-sm border border-stone-200 space-y-3 print:hidden">
        {/* 1段目：タイトルとA4 PDF印刷ボタン */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              Keisen Christian Church
            </span>
            <h1 className="text-sm font-bold text-stone-800">
              恵泉キリスト教会 週報システム
              <span className="ml-2 text-xs font-normal text-stone-500">
                （全{bulletins.length}号）
              </span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition cursor-pointer"
          >
            A4 PDF保存 / 印刷
          </button>
        </div>

        {/* 2段目：年別絞り込み・キーワード検索・バックナンバー切替 */}
        <div className="pt-2.5 border-t border-stone-100 flex flex-wrap items-center gap-2">
          {/* 年選択 */}
          <select
            aria-label="年別絞り込み"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-700 font-medium focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">全年（{bulletins.length}件）</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>

          {/* キーワード検索 */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="タイトル・聖書箇所・本文を検索..."
            className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-600 w-48 sm:w-56"
          />

          {isFiltering && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-2 py-1.5 text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              クリア
            </button>
          )}

          {/* 前号・リスト・次号 */}
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <button
              type="button"
              onClick={() =>
                hasOlder && setSelectedId(filteredBulletins[currentIndex + 1].id)
              }
              disabled={!hasOlder}
              className="px-2.5 py-1.5 text-xs font-medium bg-white border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="ひとつ前の週報へ"
            >
              ← 前号
            </button>

            <select
              aria-label="バックナンバー選択"
              value={bulletin?.id || ''}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={filteredBulletins.length === 0}
              className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-700 focus:outline-none focus:border-emerald-600 max-w-[220px] sm:max-w-[280px]"
            >
              {filteredBulletins.length === 0 ? (
                <option value="">該当する週報がありません</option>
              ) : (
                filteredBulletins.map((b) => (
                  <option key={b.id} value={b.id}>
                    {formatDate(b.publishedDate)} - {b.title}
                    {b.id === bulletins[0]?.id ? '（最新）' : ''}
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              onClick={() =>
                hasNewer && setSelectedId(filteredBulletins[currentIndex - 1].id)
              }
              disabled={!hasNewer}
              className="px-2.5 py-1.5 text-xs font-medium bg-white border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="ひとつ新しい週報へ"
            >
              次号 →
            </button>
          </div>
        </div>
      </div>

      {/* A4用紙レイアウト本体 */}
      <article className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-md print:shadow-none p-[15mm] sm:p-[18mm] print:p-0 text-stone-800 leading-relaxed">
        {/* ヘッダー */}
        <header className="border-b-2 border-emerald-800 pb-4 mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold tracking-widest text-emerald-800">
              恵泉キリスト教会 礼拝週報
            </span>
            <span className="text-sm font-medium text-stone-600">
              {formatDate(bulletin.publishedDate)}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            {bulletin.title}
          </h2>
          {bulletin.subtitle && (
            <p className="mt-1.5 text-sm sm:text-base text-emerald-800 font-medium">
              {bulletin.subtitle}
            </p>
          )}
        </header>

        {/* 礼拝プログラム・メタ情報 */}
        <section className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6 text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
          {bulletin.scripture && (
            <div>
              <span className="font-bold text-stone-500 mr-2">聖書箇所:</span>
              <span className="font-semibold text-stone-800">{bulletin.scripture}</span>
            </div>
          )}
          {bulletin.preacher && (
            <div>
              <span className="font-bold text-stone-500 mr-2">説教奉仕:</span>
              <span className="text-stone-800">{bulletin.preacher}</span>
            </div>
          )}
          {bulletin.venue && (
            <div>
              <span className="font-bold text-stone-500 mr-2">会場:</span>
              <span className="text-stone-800">{bulletin.venue}</span>
            </div>
          )}
          {bulletin.hymns && (
            <div>
              <span className="font-bold text-stone-500 mr-2">賛美:</span>
              <span className="text-stone-800">{bulletin.hymns}</span>
            </div>
          )}
          {bulletin.slideUrl && (
            <div className="sm:col-span-2 pt-1.5 border-t border-stone-200 mt-1">
              <span className="font-bold text-stone-500 mr-2">スライド資料:</span>
              <a
                href={bulletin.slideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline break-all"
              >
                {bulletin.slideUrl}
              </a>
            </div>
          )}
        </section>

        {/* メッセージ本文 */}
        <section className="mb-8">
          <h3 className="text-base font-bold text-emerald-900 border-l-4 border-emerald-700 pl-3 mb-4">
            礼拝メッセージ要旨
          </h3>
          <div
            className="prose prose-stone max-w-none text-sm sm:text-[15px] print:text-[10.5pt] leading-7 print:leading-[1.65] space-y-3 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-emerald-950 [&>h2]:mt-5 [&>h2]:mb-2 [&>h2]:pb-1 [&>h2]:border-b [&>h2]:border-stone-200 [&>h3]:font-bold [&>h3]:mt-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:border-l-2 [&>blockquote]:border-emerald-600 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-stone-600"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </section>

        {/* お知らせ・報告事項 */}
        {reportHtml && (
          <section className="border-t-2 border-stone-200 pt-6">
            <h3 className="text-base font-bold text-emerald-900 border-l-4 border-emerald-700 pl-3 mb-4">
              教会からのお知らせ・報告
            </h3>
            <div
              className="prose prose-stone max-w-none text-sm print:text-[10pt] leading-6 space-y-2 [&>h2]:text-sm [&>h2]:font-bold [&>h2]:text-emerald-950 [&>h2]:mt-4 [&>h2]:mb-1 [&>ul]:list-disc [&>ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: reportHtml }}
            />
          </section>
        )}

        {/* フッター */}
        <footer className="mt-10 pt-4 border-t border-stone-200 text-center text-xs text-stone-400">
          恵泉キリスト教会（Keisen Christian Church）
        </footer>
      </article>
    </div>
  );
}
