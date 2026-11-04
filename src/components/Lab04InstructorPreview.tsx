import React, { useState } from 'react';
import JSZip from 'jszip';
import { ArrowLeft, Check, Clipboard, Download, NotebookTabs, ShieldCheck } from 'lucide-react';

type Cell = { kind: 'markdown' | 'code'; source: string };
type Props = { notebook: Cell[]; files: Record<string, string>; onExit: () => void; onSwitchLab: () => void };

function Inline({ value }: { value: string }) {
  return <>{value.split(/(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)]+)/g).map((v,i) => {
    if (v.startsWith('**') && v.endsWith('**')) return <strong key={i}>{v.slice(2,-2)}</strong>;
    if (v.startsWith('`') && v.endsWith('`')) return <code key={i} className="rounded bg-slate-100 px-1 py-0.5 text-xs">{v.slice(1,-1)}</code>;
    if (v.startsWith('https://')) return <a key={i} href={v} target="_blank" rel="noreferrer" className="text-blue-700 underline">{v}</a>;
    return <React.Fragment key={i}>{v}</React.Fragment>;
  })}</>;
}

function MarkdownCell({ source }: { source: string }) {
  const nodes: React.ReactNode[] = [];
  const lines = source.split('\n');
  let fence: string[] | null = null;
  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      if (fence) { nodes.push(<pre key={i} className="my-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{fence.join('\n')}</code></pre>); fence = null; }
      else fence = [];
    } else if (fence) { fence.push(line); }
    else if (!line.trim()) nodes.push(<div key={i} className="h-2"/>);
    else if (line.startsWith('# ')) nodes.push(<h1 key={i} className="mb-3 text-2xl font-semibold"><Inline value={line.slice(2)}/></h1>);
    else if (line.startsWith('## ')) nodes.push(<h2 key={i} className="mt-2 mb-2 text-xl font-semibold"><Inline value={line.slice(3)}/></h2>);
    else if (line.startsWith('### ')) nodes.push(<h3 key={i} className="mt-2 mb-1 text-base font-semibold"><Inline value={line.slice(4)}/></h3>);
    else if (/^[-*] /.test(line)) nodes.push(<p key={i} className="pl-3">• <Inline value={line.slice(2)}/></p>);
    else nodes.push(<p key={i}><Inline value={line}/></p>);
  });
  return <div className="text-[13px] leading-7 text-slate-700">{nodes}</div>;
}

export const Lab04InstructorPreview: React.FC<Props> = ({notebook, files, onExit, onSwitchLab}) => {
  const [copied, setCopied] = useState(-1);
  const download = async () => {
    const archive = new JSZip();
    for (const [path, content] of Object.entries(files)) archive.file('MAI5124_Lab04/' + path, content);
    const blob = await archive.generateAsync({type:'blob', compression:'DEFLATE'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'MAI5124_Lab04_Student_Not_Published.zip';
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copy = async (i: number, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(i); setTimeout(() => setCopied(-1), 1500);
  };
  return <div className="min-h-[calc(100vh-3.5rem)] bg-slate-100">
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-5 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="rounded-md border border-slate-200 p-2" aria-label="Exit instructor preview"><ArrowLeft className="h-4 w-4"/></button>
          <span className="rounded-md bg-slate-950 p-2 text-white"><NotebookTabs className="h-5 w-5"/></span>
          <div><h1 className="text-base font-semibold">Lab 04: Building and Evaluating Software Repair Agents</h1><p className="text-xs text-slate-500">MAI5124 · Jupyter notebook preview</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-800"><ShieldCheck className="h-3.5 w-3.5"/>Instructor only</span>
          <button onClick={onSwitchLab} className="rounded-md border border-slate-200 px-3 py-2 text-xs">Switch lab</button>
          <button onClick={() => void download()} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white"><Download className="h-4 w-4"/>Download Jupyter package</button>
        </div>
      </div>
    </div>
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 lg:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="hidden lg:block"><nav className="sticky top-24 rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Notebook sections</p>
        {[['A','Inspect the defects',1],['B','Reactive agent',8],['C','Intelligent agent',14],['D','Connect Gemini',22],['E','Compare results',26],['F','Technical report',30]].map(([id,title,cell])=><a key={String(id)} href={'#lab04-cell-'+cell} className="block rounded px-2 py-2 text-xs text-slate-600 hover:bg-slate-100"><strong className="mr-2">{id}</strong>{title}</a>)}
      </nav></aside>
      <main className="min-w-0">
        <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs leading-6 text-blue-950"><strong>Instructor preview.</strong> These are the same notebook instructions and code cells students will receive. The preview does not execute Python or TypeScript. Download the package to compile and test in Jupyter on your computer. Student accounts cannot open this preview.</div>
        <div className="space-y-3">{notebook.map((cell,i)=><section id={'lab04-cell-'+i} key={i} className="scroll-mt-24 rounded-lg border border-slate-200 bg-white shadow-sm">
          {cell.kind==='markdown' ? <div className="px-5 py-5 sm:px-8"><MarkdownCell source={cell.source}/></div> :
            <div><div className="flex justify-between border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs text-slate-500"><span>In [{i+1}]: Python</span><button onClick={()=>void copy(i,cell.source)} className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1">{copied===i?<Check className="h-3.5 w-3.5"/>:<Clipboard className="h-3.5 w-3.5"/>}{copied===i?'Copied':'Copy code'}</button></div><pre className="overflow-x-auto px-5 py-4 text-xs leading-6 text-slate-900"><code>{cell.source}</code></pre></div>}
        </section>)}</div>
      </main>
    </div>
  </div>;
};