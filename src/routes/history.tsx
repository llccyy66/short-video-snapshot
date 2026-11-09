import { createFileRoute, Link } from '@tanstack/react-router';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageIntro } from '@/components/workspace';
import { api, LEVEL_LABEL } from '@/lib/api';
import { historyQuery } from '@/lib/queries';
import { fmtAgo } from '@/lib/format';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute('/history')({head:()=>pageHead('阅读历史','回到曾经阅读的视频总结与知识记录。'),loader:({context})=>context.queryClient.ensureQueryData(historyQuery),component:HistoryPage});
function HistoryPage(){
  const {data} = useSuspenseQuery(historyQuery); const queryClient=useQueryClient();
  const [search,setSearch]=useState(''); const [deleting,setDeleting]=useState('');
  async function remove(id:string){setDeleting(id);try{await api.deleteHistory(id);await queryClient.invalidateQueries({queryKey:['history']});}finally{setDeleting('');}}
  const items=data.items.filter(v=>v.title.includes(search));
  return <div className="page-content"><PageIntro eyebrow="READING HISTORY" title="知识，值得再次相遇。" subtitle="你读过的视频，都在这里。" /><label className="search-field mb-8"><Search /><input aria-label="搜索阅读历史" placeholder="搜索阅读历史…" value={search} onChange={e=>setSearch(e.target.value)} /></label>{items.map(v=><div className="history-row" key={v.id}><span className="history-icon"><Video /></span><Link to="/videos/$videoId" params={{videoId:v.videoId}}><h3>{v.title}</h3><p>{v.platform==='bilibili'?'B站':'抖音'} · {LEVEL_LABEL[v.level]}总结</p></Link><span className="row-time">{fmtAgo(v.at)}</span><Button variant="ghost" size="icon" className="ml-auto shrink-0 text-muted-foreground" title="删除记录" aria-label={`删除 ${v.title}`} disabled={deleting===v.id} onClick={()=>void remove(v.id)}><Trash2 /></Button></div>)}{!items.length && <div className="empty-state">{search?'没有找到相关记录':'暂无阅读记录'}<div className="mt-5"><Button asChild variant="outline"><Link to="/">开始阅读</Link></Button></div></div>}</div>;
}