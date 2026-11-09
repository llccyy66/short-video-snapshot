import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowUpRight, Copy, Share2, Search, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { JobProgress } from '@/components/job-progress';
import { videoQuery } from '@/lib/queries';
import { LEVEL_LABEL, type Level } from '@/lib/api';
import { fmtDate, fmtTime } from '@/lib/format';
import { pageHead } from '@/lib/page-head';
import desk from '@/assets/reading-desk.jpg';

export const Route = createFileRoute('/videos/$videoId')({
  head:({loaderData})=>pageHead(loaderData?.title ?? '视频阅读','阅读视频总结、逐字稿和带时间戳的原文。'),
  loader:({context,params})=>context.queryClient.ensureQueryData(videoQuery(params.videoId)),
  component:VideoPage,
});
function VideoPage(){
  const {videoId}=Route.useParams();const {data:video}=useSuspenseQuery(videoQuery(videoId));
  const [level,setLevel]=useState<Level>('standard');const [tab,setTab]=useState('summary');const [search,setSearch]=useState('');
  const source=video.platform==='bilibili'?`https://www.bilibili.com/video/${video.bvid}`:`https://www.douyin.com/video/${video.bvid}`;
  const timed=(t:number)=>`${source}${video.platform==='bilibili'?`?t=${Math.floor(t)}`:''}`;
  const blocks=video.summaries[level];
  async function copy(){try{await navigator.clipboard.writeText(`# ${video.title}\n\n${blocks.map(b=>b.kind==='h'?`## ${b.text}`:b.kind==='shot'?`[${fmtTime(b.t)}] ${b.caption}`:b.kind==='li'?`- ${b.text}`:b.text).join('\n\n')}`);toast.success('已复制 Markdown');}catch{toast.error('复制失败，请允许浏览器访问剪贴板');}}
  async function share(){try{await navigator.clipboard.writeText(window.location.href);toast.success('已复制分享链接');}catch{toast.error('复制失败，请从地址栏复制链接');}}
  return <div className="page-content"><div className="mb-6 flex items-center justify-between"><Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft/>返回工作台</Link></Button><span className="text-[10px] text-muted-foreground">VIDEO READING</span></div>{!video.ready&&video.jobId?<JobProgress jobId={video.jobId} refreshKey={['video',videoId]}/>:<div className="video-layout"><article><div className="video-source"><img className="video-cover" src={desk} width={1536} height={1024} alt="阅读主题示意封面，非原视频画面"/><Button asChild size="sm"><a href={source} target="_blank" rel="noreferrer">打开原视频<ArrowUpRight/></a></Button></div><h1 className="article-title">{video.title}</h1><div className="video-meta">{video.creatorId?<Link to="/creators/$creatorId" params={{creatorId:video.creatorId}} className="text-primary">{video.creatorName}</Link>:<span>{video.creatorName || '视频作者'}</span>}<span>·</span><span>{fmtTime(video.duration)}</span><span>·</span><span>{fmtDate(video.publishedAt)}</span><span className="ml-auto">{video.platform==='bilibili'?'B站':'抖音'}</span></div><div className="tab-bar" role="tablist" aria-label="阅读内容">{[{id:'summary',label:'视频总结'},{id:'transcript',label:'逐字稿'}].map(t=><Button key={t.id} role="tab" aria-selected={tab===t.id} variant="ghost" className={tab===t.id?'tab-selected':''} onClick={()=>setTab(t.id)}>{t.label}</Button>)}</div>{tab==='summary'?<><div className="article-controls"><div className="segmented">{(Object.keys(LEVEL_LABEL) as Level[]).map(l=><Button variant="ghost" size="sm" key={l} aria-pressed={level===l} className={level===l?'segment-active':''} onClick={()=>setLevel(l)}>{LEVEL_LABEL[l]}</Button>)}</div><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={()=>void copy()}><Copy/>复制 Markdown</Button><Button variant="ghost" size="icon" title="复制分享链接" aria-label="复制分享链接" onClick={()=>void share()}><Share2/></Button></div></div><div className="article-content">{blocks.map((b,i)=>b.kind==='h'?<h2 key={i} id={`section-${i}`}>{b.text}</h2>:b.kind==='shot'?<div key={i} className="shot-placeholder"><div className="mb-2 flex gap-2 items-center"><ImageIcon size={15}/>关键帧 · {fmtTime(b.t)}</div>{b.caption}<span className="block mt-2 text-[10px]">演示模式，暂未提供原视频截图</span></div>:b.kind==='li'?<li key={i}>{b.t!==undefined&&<a href={timed(b.t)} target="_blank" rel="noreferrer" className="timestamp">{fmtTime(b.t)}</a>}{b.text}</li>:<p key={i}>{b.t!==undefined&&<a href={timed(b.t)} target="_blank" rel="noreferrer" className="timestamp">{fmtTime(b.t)}</a>}{b.text}</p>)}</div></>:<><label className="search-field mb-5"><Search/><input aria-label="搜索逐字稿" value={search} onChange={e=>setSearch(e.target.value)} placeholder="查找逐字稿中的内容…"/></label>{video.transcript.filter(s=>s.text.includes(search)).map((s,i)=><div className="transcript-row" key={i}><a href={timed(s.t)} className="timestamp self-start" target="_blank" rel="noreferrer">{fmtTime(s.t)}</a><p>{s.text}</p></div>)}{!video.transcript.some(s=>s.text.includes(search))&&<div className="empty-state">没有找到相关内容</div>}</>}</article><aside className="article-sidebar"><h3>阅读目录</h3>{blocks.map((b,i)=>b.kind==='h'?<a key={i} href={`#section-${i}`} onClick={()=>setTab('summary')}>{b.text}</a>:null)}<div className="source-note">内容来源<br/>{video.transcriptSource==='subtitle'?'平台字幕':'语音转写'} · {video.platform==='bilibili'?'BILIBILI':'DOUYIN'}<br/><br/>当前为模拟总结与示意封面，不代表原视频内容。</div>{video.platform==='douyin'&&<div className="source-note">抖音时间戳仅供对照，打开链接后需手动定位。</div>}</aside></div>}</div>;
}