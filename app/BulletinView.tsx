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

  // 現在表示する週報
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

  // リッチエディタ内の見出し（# / ## / ###）を綺麗に整形
  const formatRichContent = (raw?: string) => {
    if (!raw) return '';
    const cleaned = raw
      .replace(/<p>\s*###\s*(.*?)<\/p>/gi, '<h3>$1</h3>')
      .replace(/<p>\s*##\s*(.*?)<\/p>/gi, '<h2>$1</h2>')
      .replace(/<p>\s*#\s*(.*?)<\/p>/gi, '<p class="font-bold text-stone-900">$1</p>')
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
    <div className="min-h-screen bg-[#F4F6F1] py-3 px-1.5 sm:py-8 sm:px-4 print:bg-white print:p-0">
      {/* A4印刷・PDF保存用のスタイル定義 */}
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
      <div className="max-w-[210mm] mx-auto mb-3 sm:mb-6 bg-white/95 backdrop-blur p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-[#DCE5D2] space-y-2.5 sm:space-y-3 print:hidden">
        {/* 1段目：ロゴ・システム名とA4 PDF印刷ボタン */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.svg"
              alt="HONJO LIFE ロゴ"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <span className="block text-[9px] sm:text-[10px] font-bold tracking-[0.14em] text-[#558B14] uppercase truncate">
                LIFE COMMUNITY HONJO
                <span className="hidden sm:inline"> / KEISEN CHRIST CHURCH</span>
              </span>
              <h1 className="text-xs sm:text-base font-bold text-stone-800 tracking-tight leading-snug">
                恵泉キリスト教会 本荘ライフコミュニティ 週報
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-[#EEF4E6] text-[#4A7A11]">
                  全{bulletins.length}号
                </span>
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-semibold text-white bg-[#5B9516] hover:bg-[#4A7A11] rounded-lg sm:rounded-xl shadow-xs transition cursor-pointer shrink-0"
          >
            A4 PDF / 印刷
          </button>
        </div>

        {/* 2段目：年別絞り込み・キーワード検索・バックナンバー切替 */}
        <div className="pt-2.5 border-t border-stone-100 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
          {/* 年選択＋検索ボックス（スマホでは横並び1行） */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <select
              aria-label="年別絞り込み"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2 py-1.5 text-xs bg-[#F7F9F4] border border-[#D4DFC7] rounded-lg text-stone-700 font-medium focus:outline-none focus:border-[#5B9516] shrink-0"
            >
              <option value="ALL">全年（{bulletins.length}件）</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="タイトル・聖書箇所・本文を検索..."
              className="px-2.5 py-1.5 text-xs bg-[#F7F9F4] border border-[#D4DFC7] rounded-lg text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#5B9516] flex-1 min-w-0 sm:w-52"
            />

            {isFiltering && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-1.5 py-1.5 text-xs text-[#558B14] hover:text-stone-800 underline cursor-pointer shrink-0"
              >
                クリア
              </button>
            )}
          </div>

          {/* 前号・リスト・次号（スマホでも1行横並び） */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={() =>
                hasOlder && setSelectedId(filteredBulletins[currentIndex + 1].id)
              }
              disabled={!hasOlder}
              className="px-2 py-1.5 text-xs font-medium bg-white border border-stone-300 rounded-lg text-stone-700 hover:bg-[#F7F9F4] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
              title="ひとつ前の週報へ"
            >
              ← 前号
            </button>

            <select
              aria-label="バックナンバー選択"
              value={bulletin?.id || ''}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={filteredBulletins.length === 0}
              className="px-2 py-1.5 text-xs bg-[#F7F9F4] border border-[#D4DFC7] rounded-lg text-stone-700 focus:outline-none focus:border-[#5B9516] flex-1 min-w-0 sm:w-64"
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
              className="px-2 py-1.5 text-xs font-medium bg-white border border-stone-300 rounded-lg text-stone-700 hover:bg-[#F7F9F4] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
              title="ひとつ新しい週報へ"
            >
              次号 →
            </button>
          </div>
        </div>
      </div>

      {/* A4用紙レイアウト本体 */}
      <article className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-md rounded-lg sm:rounded-xs print:shadow-none px-4 py-5 sm:p-[18mm] print:p-0 text-stone-800 leading-relaxed relative overflow-hidden">
        {/* 上端のブランドカラーアクセントライン */}
        <div className="h-1.5 bg-gradient-to-r from-[#65A318] via-[#7CB82F] to-[#4A7A11] -mx-4 -mt-5 sm:-mx-[18mm] sm:-mt-[18mm] mb-4 sm:mb-6 print:mx-0 print:mt-0 print:mb-5" />

        {/* 紙面ヘッダー（ロゴ付き） */}
        <header className="border-b-2 border-[#5B9516] pb-3.5 sm:pb-4 mb-4 sm:mb-6 flex items-start justify-between gap-2.5 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5">
              <span className="text-[11px] sm:text-[13px] font-bold tracking-[0.06em] sm:tracking-[0.1em] text-[#4A7A11]">
                恵泉キリスト教会 本荘ライフコミュニティ 礼拝週報
              </span>
              <span className="hidden sm:inline text-stone-300">|</span>
              <time className="text-[11px] sm:text-sm font-semibold text-stone-500 sm:text-stone-600">
                {formatDate(bulletin.publishedDate)}
              </time>
            </div>
            <h2 className="font-serif text-[19px] sm:text-[26px] font-bold text-stone-900 tracking-tight leading-snug">
              {bulletin.title}
            </h2>
            {bulletin.subtitle && (
              <p className="mt-1.5 text-[14px] sm:text-lg text-[#4A7A11] font-semibold leading-snug">
                {bulletin.subtitle}
              </p>
            )}
          </div>

          {/* 紙面右上のHONJO LIFEエンブレム */}
          <div className="flex flex-col items-center shrink-0 pt-0.5">
            <img
              src="/logo.svg"
              alt="HONJO LIFE"
              className="w-10 h-10 sm:w-14 sm:h-14"
            />
            <span className="mt-0.5 sm:mt-1 text-[7px] sm:text-[8px] font-semibold tracking-widest text-[#558B14] uppercase">
              HONJO LIFE
            </span>
          </div>
        </header>

        {/* 礼拝プログラム・メタ情報 */}
        <section className="bg-[#F7FAF3] border border-[#DCE6D0] rounded-xl p-3 sm:p-4 mb-5 sm:mb-6 text-[13px] sm:text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 sm:gap-y-2 gap-x-6">
          {bulletin.scripture && (
            <div>
              <span className="font-bold text-[#4A7A11] mr-1.5">聖書箇所:</span>
              <span className="font-semibold text-stone-800">{bulletin.scripture}</span>
            </div>
          )}
          {bulletin.preacher && (
            <div>
              <span className="font-bold text-[#4A7A11] mr-1.5">説教奉仕:</span>
              <span className="text-stone-800">{bulletin.preacher}</span>
            </div>
          )}
          {bulletin.venue && (
            <div>
              <span className="font-bold text-[#4A7A11] mr-1.5">会場:</span>
              <span className="text-stone-800">{bulletin.venue}</span>
            </div>
          )}
          {bulletin.hymns && (
            <div>
              <span className="font-bold text-[#4A7A11] mr-1.5">賛美:</span>
              <span className="text-stone-800">{bulletin.hymns}</span>
            </div>
          )}
          {bulletin.slideUrl && (
            <div className="sm:col-span-2 pt-1.5 sm:pt-2 border-t border-[#DCE6D0] mt-0.5 sm:mt-1">
              <span className="font-bold text-[#4A7A11] mr-1.5">スライド資料:</span>
              <a
                href={bulletin.slideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4A7A11] hover:text-[#3A610D] underline break-all"
              >
                {bulletin.slideUrl}
              </a>
            </div>
          )}
        </section>

        {/* メッセージ本文 */}
        <section className="mb-7 sm:mb-8">
          <h3 className="font-sans text-[15px] sm:text-[17px] font-extrabold text-[#3D660E] border-l-4 border-[#65A318] pl-2.5 sm:pl-3 mb-3.5 sm:mb-4">
            礼拝メッセージ要旨
          </h3>
          <div
            className="prose prose-stone max-w-none text-[14px] sm:text-[15px] print:text-[10.5pt] leading-[1.8] sm:leading-[1.85] print:leading-[1.68] space-y-3 [&>h2]:font-sans [&>h2]:text-[15px] [&>h2]:sm:text-[17px] [&>h2]:print:text-[12pt] [&>h2]:font-extrabold [&>h2]:text-[#2E4F0A] [&>h2]:mt-5 [&>h2]:sm:mt-6 [&>h2]:mb-2 [&>h2]:pb-1 [&>h2]:border-b-2 [&>h2]:border-[#DCE6D0] [&>h3]:font-sans [&>h3]:text-[14.5px] [&>h3]:sm:text-[15px] [&>h3]:font-bold [&>h3]:text-stone-900 [&>h3]:mt-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:border-l-2 [&>blockquote]:border-[#65A318] [&>blockquote]:bg-[#F9FBF6] [&>blockquote]:py-1 [&>blockquote]:px-3 [&>blockquote]:italic [&>blockquote]:text-stone-700"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </section>

        {/* お知らせ・報告事項 */}
        {reportHtml && (
          <section className="border-t-2 border-[#DCE6D0] pt-5 sm:pt-6">
            <h3 className="font-sans text-[15px] sm:text-[17px] font-extrabold text-[#3D660E] border-l-4 border-[#65A318] pl-2.5 sm:pl-3 mb-3.5 sm:mb-4">
              教会からのお知らせ・報告
            </h3>
            <div
              className="prose prose-stone max-w-none text-[13.5px] sm:text-sm print:text-[10pt] leading-7 space-y-2 [&>h2]:font-sans [&>h2]:text-[14.5px] [&>h2]:sm:text-[15px] [&>h2]:font-extrabold [&>h2]:text-[#2E4F0A] [&>h2]:mt-4 [&>h2]:mb-1.5 [&>ul]:list-disc [&>ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: reportHtml }}
            />
          </section>
        )}

        {/* フッター */}
        <footer className="mt-8 sm:mt-10 pt-4 border-t border-[#E2EAD8] flex items-center justify-center gap-2 text-[11px] sm:text-xs text-stone-400">
          <img src="/logo.svg" alt="" className="w-4 h-4 opacity-80 shrink-0" />
          <span>恵泉キリスト教会 本荘ライフコミュニティ（Keisen Christ Church）</span>
        </footer>
      </article>
    </div>
  );
}
