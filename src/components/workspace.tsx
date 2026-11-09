import { Link, useRouterState } from '@tanstack/react-router';
import { BookOpen, Library, History, Settings2, ArrowUpRight, Plus, PanelLeftClose, Menu, X, CircleHelp } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { usingMock, type Creator, type Density, type Level, LEVEL_LABEL, DENSITY_LABEL } from '@/lib/api';
import { cn } from '@/lib/utils';

const nav = [{ to: '/', label: '开始阅读', icon: BookOpen }, { to: '/creators', label: '博主档案', icon: Library }, { to: '/history', label: '阅读历史', icon: History }] as const;

export function Workspace({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [open, setOpen] = useState(false);
  return <div className="workspace">
    <header className="mobile-header"><Link to="/" className="brand"><BookOpen />智读<span>ZBILI</span></Link><Button variant="ghost" size="icon" aria-label="展开导航" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button></header>
    {open && <div className="nav-scrim" onClick={() => setOpen(false)} />}
    <aside className={cn('sidebar', open && 'sidebar-open')}>
      <Link to="/" className="brand"><span className="brand-mark"><BookOpen /></span>智读<span>ZBILI</span></Link>
      <div className="sidebar-caption">个人知识工作台</div>
      <Button asChild className="new-reading"><Link to="/" onClick={() => setOpen(false)}><Plus />新建阅读</Link></Button>
      <nav className="nav-list">{nav.map(({to,label,icon: Icon}) => <Button key={to} asChild variant="ghost" className={cn('nav-item', (to === '/' ? pathname === '/' || pathname.startsWith('/videos') : pathname.startsWith(to)) && 'nav-active')}><Link to={to} onClick={() => setOpen(false)}><Icon />{label}{to === '/' && <span className="nav-dot" />}</Link></Button>)}</nav>
      <div className="sidebar-section-label">我的档案 <span>02</span></div>
      <Link to="/creators/$creatorId" params={{creatorId:'bili-up-1001'}} className="sidebar-profile"><span className="avatar avatar-mint">钱</span><span>老钱聊经济<small>263 个视频</small></span></Link>
      <Link to="/creators/$creatorId" params={{creatorId:'dy-user-yujie'}} className="sidebar-profile"><span className="avatar avatar-rose">鱼</span><span>鱼姐的理财课<small>42 个视频</small></span></Link>
      <div className="sidebar-bottom"><div className="quiet-note"><span className="status-dot" />{usingMock ? '演示工作台' : '已连接服务'}</div><Button asChild variant="ghost" className="nav-item"><Link to="/settings"><Settings2 />偏好设置</Link></Button><div className="account"><span className="avatar avatar-neutral">阅</span><span>我的工作空间<small>保持好奇，独立思考</small></span><PanelLeftClose size={16} className="text-muted-foreground" /></div></div>
    </aside>
    <main className="main-area"><div className="topbar"><span>工作台 <span className="mx-3 text-border">/</span> {pathname.startsWith('/creators') ? '博主档案' : pathname.startsWith('/history') ? '阅读历史' : pathname.startsWith('/settings') ? '偏好设置' : pathname.startsWith('/videos') ? '视频阅读' : '开始阅读'}</span><span className="topbar-note"><CircleHelp size={15} />{usingMock ? '模拟数据 · 设计预览' : '智读工作台'}</span></div>{children}<footer className="workspace-footer"><span>智读 ZBILI</span><span>把看过的，变成自己的。</span></footer></main>
  </div>;
}

export function PageIntro({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions}</div>;
}

export function ReadingOptions({ level, density, onLevel, onDensity }: {level: Level; density: Density; onLevel: (v: Level) => void; onDensity: (v: Density) => void}) {
  return <div className="reading-options"><div><span className="option-label">总结详细度</span><div className="segmented">{(Object.keys(LEVEL_LABEL) as Level[]).map(v => <Button key={v} size="sm" variant="ghost" aria-pressed={level===v} className={level===v ? 'segment-active' : ''} onClick={()=>onLevel(v)}>{LEVEL_LABEL[v]}</Button>)}</div></div><div><label className="option-label" htmlFor="density">截图密度</label><select id="density" value={density} onChange={e=>onDensity(e.target.value as Density)}>{(Object.keys(DENSITY_LABEL) as Density[]).map(v=><option key={v} value={v}>{DENSITY_LABEL[v]}</option>)}</select></div></div>;
}

export function CreatorCard({ creator }: {creator: Creator}) {
  return <Link to="/creators/$creatorId" params={{creatorId:creator.id}} className={cn('creator-card',creator.platform==='douyin' && 'creator-card-rose')}><div className="flex items-start justify-between"><span className={cn('avatar avatar-large',creator.platform==='douyin' ? 'avatar-rose' : 'avatar-mint')}>{creator.name.slice(0,1)}</span><span className="platform-label">{creator.platform==='bilibili'?'BILIBILI':'DOUYIN'}<ArrowUpRight size={14} /></span></div><h3>{creator.name}</h3><p>{creator.status==='building'?'正在整理视频与观点…':creator.portrait}</p><div className="creator-stats"><span><b>{creator.stats.videos}</b> 视频</span><span><b>{creator.stats.motifs}</b> 母题</span><span className="ml-auto status-label"><span className="status-dot" />{creator.status==='ready'?'已建档':'整理中'}</span></div></Link>;
}