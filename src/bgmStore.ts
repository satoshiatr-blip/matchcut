// 選んだBGMを覚えておく（数MBの音楽ファイルだけ。試合動画は大きすぎるので保存しない）
const DB = 'matchcut'
const STORE = 'files'

function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

export async function loadBgm(): Promise<File | null> {
  try {
    const db = await open()
    return await new Promise(resolve => {
      const q = db.transaction(STORE).objectStore(STORE).get('bgm')
      q.onsuccess = () => resolve(q.result ?? null)
      q.onerror = () => resolve(null)
    })
  } catch { return null }
}

export async function saveBgm(f: File | null) {
  try {
    const db = await open()
    const tx = db.transaction(STORE, 'readwrite')
    if (f) tx.objectStore(STORE).put(f, 'bgm')
    else tx.objectStore(STORE).delete('bgm')
  } catch { /* 保存できなくても今回の書き出しには影響しない */ }
}
