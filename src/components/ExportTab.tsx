import { useRef, useState } from 'react'
import { exportHighlight, totalDuration } from '../render'
import { IconCheck, IconMusic, IconPhoto, IconSaveVideo } from './icons'
import { Slam } from './brand'
import { Button, Card, FilePicker, GroupLabel, Row, ScreenTitle, Portal, Slider, Toast, Toggle, fmt, useObjectUrl, type ProjectProps } from './ui'

type Props = ProjectProps & { files: Map<string, File>; addFiles: (f: FileList) => void }

export default function ExportTab({ project, setProject, files, addFiles }: Props) {
  const [bgm, setBgm] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ p: 0, label: '' })
  const [result, setResult] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const resultUrl = useObjectUrl(result)

  const needed = [...new Set(project.scenes.map(s => s.sourceKey))]
  const missing = project.sources.filter(s => needed.includes(s.key) && !files.has(s.key))
  const canExport = project.scenes.length > 0 && missing.length === 0 && !busy

  async function run() {
    setBusy(true)
    setError('')
    setResult(null)
    setSaved(false)
    const ac = new AbortController()
    abortRef.current = ac
    const lock = await navigator.wakeLock?.request('screen').catch(() => null)
    const t0 = performance.now()
    try {
      const f = await exportHighlight({ project, files, bgm, signal: ac.signal, onProgress: (p, label) => setProgress({ p, label }) })
      setElapsed((performance.now() - t0) / 1000)
      setResult(f)
      setDone(Date.now())
      setTimeout(() => setSheet(true), 1000)
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : String(e))
    } finally {
      await lock?.release()
      setBusy(false)
    }
  }

  // Webアプリは写真ライブラリへ直接書けないため、共有シートの「ビデオを保存」を経由する
  async function save() {
    if (!result) return
    if (navigator.canShare?.({ files: [result] })) {
      try {
        await navigator.share({ files: [result] })
        setSaved(true)
        setSheet(false)
        setToast('保存しました')
        setTimeout(() => setToast(''), 1800)
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) setError('保存できませんでした。もう一度お試しください')
      }
    } else {
      const a = document.createElement('a')
      a.href = resultUrl!
      a.download = result.name
      a.click()
      setError('この端末では写真に直接保存できないため、ファイルとしてダウンロードしました')
    }
  }

  return (
    <div className="space-y-6">
      <ScreenTitle step="04" en="EXPORT" title="書き出す" sub="音と色味を決めて、1本の動画にします" />

      <div className="grid grid-cols-3 gap-3">
        {[
          ['SCENES', String(project.scenes.length)],
          ['DURATION', fmt(totalDuration(project.scenes))],
          ['QUALITY', '1080p'],
        ].map(([k, v]) => (
          <Card key={k} className="!p-3">
            <p className="text-[10px] text-muted font-bold tracking-wider">{k}</p>
            <p className="text-xl font-black italic tabular-nums">{v}</p>
          </Card>
        ))}
      </div>

      <div>
        <GroupLabel>サウンド</GroupLabel>
        <Card className="space-y-4">
          <Slider label="試合の音（歓声）" display={`${Math.round(project.gameVolume * 100)}%`} min={0} max={1} step={0.05} value={project.gameVolume}
            onChange={v => setProject(p => ({ ...p, gameVolume: v }))} />
          <div className="h-px bg-line" />
          <Row label="BGM" hint="市販の曲はSNS公開で著作権の問題になることがあります">
            {bgm && <button className="text-sm text-danger font-bold" onClick={() => setBgm(null)}>外す</button>}
          </Row>
          <FilePicker accept="audio/*" multiple={false} onFiles={f => setBgm(f[0])}
            className="w-full min-h-12 px-4 rounded-xl bg-raised border border-line !justify-start text-sm">
            <IconMusic className="text-cyan text-lg shrink-0" /><span className="truncate">{bgm ? bgm.name : '音楽ファイルを選ぶ（任意）'}</span>
          </FilePicker>
          {bgm && (
            <Slider label="BGMの音量" display={`${Math.round(project.bgmVolume * 100)}%`} min={0} max={1} step={0.05} value={project.bgmVolume}
              onChange={v => setProject(p => ({ ...p, bgmVolume: v }))} />
          )}
        </Card>
      </div>

      <div>
        <GroupLabel>映像</GroupLabel>
        <Card>
          <Row label="シネマカラー" hint="コントラストを上げ、青みのある色に整える">
            <Toggle label="シネマカラー" checked={project.grade} onChange={v => setProject(p => ({ ...p, grade: v }))} />
          </Row>
        </Card>
      </div>

      {missing.length > 0 && (
        <Card className="!border-amber-400/50 !bg-amber-400/10 space-y-3">
          <p className="text-sm text-amber-200">書き出しには次の動画が必要です</p>
          <ul className="text-xs text-amber-200/80 list-disc pl-5">{missing.map(m => <li key={m.key}>{m.name}</li>)}</ul>
          <FilePicker onFiles={addFiles} className="w-full min-h-11 rounded-xl bg-amber-400 text-ink">動画を選び直す</FilePicker>
        </Card>
      )}

      {busy ? (
        <Card className="space-y-4 !border-cyan/40">
          <div className="flex items-end justify-between">
            <p className="text-sm text-muted">{progress.label}</p>
            <p className="text-3xl font-black italic tabular-nums text-cyan">{Math.round(progress.p * 100)}<span className="text-base">%</span></p>
          </div>
          <div className="h-2 bg-raised rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand to-cyan shadow-[0_0_12px_#3ee0ff] transition-all" style={{ width: `${progress.p * 100}%` }} />
          </div>
          <p className="text-xs text-muted">画面を開いたままにしてください</p>
          <Button className="w-full" onClick={() => abortRef.current?.abort()}>中止</Button>
        </Card>
      ) : (
        <Button variant="primary" disabled={!canExport} onClick={run} className="relative overflow-hidden w-full min-h-16 text-xl italic font-black tracking-wide">
          {canExport && <span className="absolute inset-y-0 left-0 w-1/3 bg-white/25 animate-[shine_2.4s_ease-in-out_infinite]" />}
          <span className="relative">ハイライトを書き出す</span>
        </Button>
      )}

      <Slam word="COMPLETE" trigger={done} sub="HIGHLIGHT READY" />
      <Toast text={toast} />

      {sheet && result && resultUrl && (
        <Portal>
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button className="absolute inset-0 bg-ink/70 backdrop-blur-sm" aria-label="閉じる" onClick={() => setSheet(false)} />
          <div className="relative bg-surface border-t border-line rounded-t-3xl px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] animate-[sheet_.35s_cubic-bezier(.2,.8,.2,1)_both]">
            <div className="mx-auto w-10 h-1.5 rounded-full bg-line mb-4" />
            <p className="text-[11px] font-black italic tracking-[0.25em] text-cyan">HIGHLIGHT READY</p>
            <h3 className="mt-1 text-2xl font-black italic -skew-x-6 origin-left">完成しました</h3>
            <video src={`${resultUrl}#t=1.5`} muted playsInline autoPlay loop className="mt-4 w-full rounded-xl bg-black border border-line" />
            <ol className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <li className="rounded-xl bg-raised border border-line p-3">
                <span className="text-[10px] font-black italic text-cyan">01</span>
                <p className="font-bold">下のボタンをタップ</p>
              </li>
              <li className="rounded-xl bg-raised border border-line p-3">
                <span className="text-[10px] font-black italic text-cyan">02</span>
                <p className="font-bold flex items-center gap-1">「<IconSaveVideo className="shrink-0" />ビデオを保存」</p>
              </li>
            </ol>
            <Button variant="primary" onClick={save} className="mt-4 w-full min-h-16 text-xl font-black italic"><IconPhoto className="text-2xl" />写真に保存</Button>
            <button className="w-full py-3 mt-1 text-sm text-muted" onClick={() => setSheet(false)}>あとで</button>
          </div>
        </div>
        </Portal>
      )}

      {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl p-3">{error}</p>}

      {result && resultUrl && (
        <div>
          <GroupLabel>完成</GroupLabel>
          <Card className="space-y-4 !border-cyan/40">
            <video src={`${resultUrl}#t=1.5`} controls playsInline className="w-full rounded-xl bg-black" />
            <p className="text-xs text-muted">{(result.size / 1e6).toFixed(0)}MB・書き出し{elapsed.toFixed(0)}秒</p>
            {saved
              ? <p className="flex items-center justify-center gap-2 min-h-12 rounded-xl bg-cyan/10 text-cyan font-bold"><IconCheck className="text-xl" />写真に保存済み</p>
              : <Button variant="primary" onClick={save} className="w-full min-h-14 text-lg"><IconPhoto className="text-xl" />写真に保存</Button>}
            {saved && <Button onClick={save} className="w-full text-sm">もう一度保存・共有する</Button>}
          </Card>
        </div>
      )}
    </div>
  )
}
