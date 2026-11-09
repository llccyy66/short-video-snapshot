import { createFileRoute } from '@tanstack/react-router';
import { Check, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { PageIntro, ReadingOptions } from '@/components/workspace';
import { useSettings, setSettings } from '@/lib/settings';
import { usingMock } from '@/lib/api';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute('/settings')({head:()=>pageHead('偏好设置','设置默认视频总结详细度和截图密度。'),component:SettingsPage});
function SettingsPage(){const settings=useSettings();return <div className="page-content"><PageIntro eyebrow="PREFERENCES" title="按你的节奏，阅读。" subtitle="为下一次阅读，选好习惯。" /><div className="preferences"><section className="settings-section"><h2 className="flex items-center gap-2"><SlidersHorizontal size={16} />阅读偏好</h2><ReadingOptions {...settings} onLevel={level=>{setSettings({level});toast.success('已保存阅读偏好');}} onDensity={density=>{setSettings({density});toast.success('已保存截图偏好');}} /><p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Check size={13} />已自动保存在当前浏览器</p></section><section className="settings-section"><h2>工作空间</h2><div className="setting-row"><div><h3>当前模式</h3><p>{usingMock?'演示数据，不会处理真实视频或调用 AI 服务。':'已连接视频处理服务。'}</p></div><span className="status-label"><span className="status-dot" />{usingMock?'设计预览':'在线服务'}</span></div><div className="setting-row"><div><h3>阅读记录</h3><p>演示模式下，阅读记录仅保留在当前浏览器，不会跨设备同步。</p></div></div></section><section className="settings-section"><h2>关于智读</h2><div className="setting-row"><div><h3>智读 ZBILI</h3><p>把看过的，变成自己的。</p></div><span className="text-xs text-muted-foreground">0.1 · 前端设计版</span></div></section></div></div>;}