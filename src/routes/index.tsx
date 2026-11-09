import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Link2, Video, Loader2, ShieldCheck, TvMinimal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatorCard, PageIntro, ReadingOptions } from '@/components/workspace';
import { api, LEVEL_LABEL } from '@/lib/api';
import { libraryQuery, historyQuery } from '@/lib/queries';
import { parseLink } from '@/lib/link';
import { fmtAgo } from '@/lib/format';
import { useSettings } from '@/lib/settings';
import { pageHead } from '@/lib/page-head';
import desk from '@/assets/reading-desk.jpg';

export const Route = createFileRoute('/')({
  head: () => pageHead('开始阅读', '整理视频中的知识，阅读总结，探索博主的长期观点。'),
  loader: ({context}) => Promise.all([context.queryClient.ensureQueryData(libraryQuery),context.queryClient.ensureQueryData(historyQuery)]),
  component: Index,
});

function Index() {
  const {data:creators} = useSuspenseQuery(libraryQuery);
  const {data:history} = useSuspenseQuery(historyQuery);
  const settings = useSettings();
  const [level,setLevel] = useState(settings.level);
  const [density,setDensity] = useState(settings.density);
  const [input,setInput] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const navigate = useNavigate();
  async function start() {
    const parsed = parseLink(input);
    if (!parsed) { setError('暂时无法识别这个链接，请粘贴 B站、抖音视频或博主主页链接。'); return; }
    setBusy(true); setError('');
    try {
      if (parsed.kind==='creator') { const result = await api.startCreator({url:parsed.url,id:parsed.id}); await navigate({to:'/creators/$creatorId',params:{creatorId:result.creatorId}}); }
      else { const result = await api.startVideo({url:parsed.url,id:parsed.id,level,density}); await navigate({to:'/videos/$videoId',params:{videoId:result.videoId}}); }
    } catch { setError('暂时无法开始阅读，请稍后重试。'); } finally { setBusy(false); }
  }
  return <div className="page-content">
    <PageIntro eyebrow="READ LESS. UNDERSTAND MORE." title="让每一次观看，都有所沉淀。" subtitle="从一个视频到一位博主，留下值得反复阅读的知识。" />
    <form className="link-editor" onSubmit={e=>{e.preventDefault();void start();}}>
      <label htmlFor="video-link" className="input-heading"><Link2 />你想读懂什么？</label>
      <textarea id="video-link" className="link-textarea" placeholder="粘贴 B站 / 抖音视频链接，或博主主页链接…" value={input} onChange={e=>{setInput(e.target.value);setError('');}} />
      <div className="editor-toolbar"><ReadingOptions level={level} density={density} onLevel={setLevel} onDensity={setDensity} /><Button type="submit" disabled={busy} className="h-10 px-5">{busy?<Loader2 className="spinner" />:null}开始阅读<ArrowRight /></Button></div>
      {error && <p role="alert" className="input-error">{error}</p>}
    </form>
    <div className="editor-meta"><span className="platform-chip"><TvMinimal />BILIBILI</span><span className="platform-chip"><Video />抖音</span><span className="ml-auto flex items-center gap-1"><ShieldCheck size={12} />{parseLink(input)?.label || '视频总结 · 博主建档'}</span></div>
    <div className="section-heading"><h2>我的博主档案 <span>CREATOR ARCHIVE</span></h2><Link to="/creators">全部档案<ArrowUpRight size={13} /></Link></div>
    <div className="creator-grid">{creators.filter(c=>c.status==='ready').slice(0,2).map(c=><CreatorCard key={c.id} creator={c} />)}</div>
    <div className="section-heading"><h2>继续阅读 <span>RECENT READINGS</span></h2><Link to="/history">全部历史<ArrowUpRight size={13} /></Link></div>
    <div className="recent-layout"><div className="history-list">{history.items.slice(0,4).map(item=><div className="history-row" key={item.id}><span className="history-icon"><Video /></span><Link to="/videos/$videoId" params={{videoId:item.videoId}}><h3>{item.title}</h3><p>{item.platform==='bilibili'?'B站':'抖音'}<span className="mx-2">·</span>{LEVEL_LABEL[item.level]}总结</p></Link><span className="row-time">{fmtAgo(item.at)}</span><ArrowUpRight size={14} className="ml-auto shrink-0 text-muted-foreground" /></div>)}</div><div className="editorial"><img src={desk} width={1536} height={1024} loading="lazy" className="editorial-image" alt="阳光下的书桌与翻开的书" /><div className="editorial-caption">不止看过，更要读懂。<small>A LITTLE LESS NOISE. A LITTLE MORE CLARITY.</small></div></div></div>
  </div>;
}
