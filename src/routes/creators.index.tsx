import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { CreatorCard, PageIntro } from '@/components/workspace';
import { libraryQuery } from '@/lib/queries';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute('/creators/')({ head:()=>pageHead('博主档案','阅读博主画像、观点母题与完整视频档案。'), loader:({context})=>context.queryClient.ensureQueryData(libraryQuery), component: Creators });
function Creators() {
  const {data} = useSuspenseQuery(libraryQuery);
  const [search,setSearch] = useState('');
  const filtered=data.filter(c=>c.name.includes(search));
  return <div className="page-content"><PageIntro eyebrow="CREATOR ARCHIVE" title="从观点，看见一个人。" subtitle="跨越视频与时间，整理创作者持续表达的核心主张。" /><div className="flex items-center justify-between gap-4"><label className="search-field"><Search /><input aria-label="搜索博主" placeholder="搜索博主…" value={search} onChange={e=>setSearch(e.target.value)} /></label><span className="text-xs text-muted-foreground">{filtered.length} 份档案</span></div><div className="creator-grid mt-7">{filtered.map(c=><CreatorCard creator={c} key={c.id} />)}</div>{!filtered.length && <div className="empty-state">没有找到相关博主</div>}</div>;
}