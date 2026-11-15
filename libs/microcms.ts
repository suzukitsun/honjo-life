import { createClient } from 'microcms-js-sdk';

export type Bulletin = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  subtitle?: string;
  publishedDate: string;
  scripture?: string;
  preacher?: string;
  venue?: string;
  hymns?: string;
  slideUrl?: string;
  content: string;
  report?: string;
};

if (!process.env.MICROCMS_SERVICE_DOMAIN) {
  throw new Error('MICROCMS_SERVICE_DOMAIN is required');
}

if (!process.env.MICROCMS_API_KEY) {
  throw new Error('MICROCMS_API_KEY is required');
}

export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
});

// 10年分以上の全件を自動でページネーション取得する（上限10件の壁を解消）
export const getBulletins = async () => {
  const contents = await client.getAllContents<Bulletin>({
    endpoint: 'bulletins',
    queries: { orders: '-publishedDate' },
  });
  return contents;
};

export const getBulletinDetail = async (contentId: string) => {
  const data = await client.getListDetail<Bulletin>({
    endpoint: 'bulletins',
    contentId,
  });
  return data;
};
