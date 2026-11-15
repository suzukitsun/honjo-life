import { connection } from 'next/server';
import { getBulletins } from '@/libs/microcms';
import BulletinView from './BulletinView';

export default async function Home() {
  await connection();
  const bulletins = await getBulletins();

  if (!bulletins || bulletins.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-600">
        <p>公開されている週報データがまだありません。microCMSで記事を公開してください。</p>
      </div>
    );
  }

  return <BulletinView bulletins={bulletins} />;
}
