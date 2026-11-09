import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { fmtEta, pct } from '@/lib/format';

export function JobProgress({jobId, refreshKey}: {jobId:string; refreshKey:readonly string[]}) {
  const client=useQueryClient();
  const {data:job}=useQuery({queryKey:['job',jobId],queryFn:()=>api.getJob(jobId),refetchInterval:2000});
  const complete=job?.status==='done';
  const target=refreshKey.join('|');
  useEffect(()=>{if(complete) void client.invalidateQueries({queryKey:target.split('|')});},[complete,client,target]);
  return <div className="processing"><h2>正在整理这份知识</h2><p>演示任务进度 · 不会调用真实视频处理服务</p><div className="flex justify-between text-xs text-muted-foreground mb-3"><span>{job?pct(job.progress):'准备中'}</span>{job?.etaMinutes!==undefined&&<span>{fmtEta(job.etaMinutes)}</span>}</div><progress className="meter" max={1} value={job?.progress ?? 0}/>{job?.stages.map(s=><div className="stage-row" key={s.key}>{s.state==='done'?<CheckCircle2/>:s.state==='running'?<Loader2 className="spinner"/>:<Circle/>}<div>{s.label}{s.detail&&<small>{s.detail}</small>}</div></div>)}</div>;
}