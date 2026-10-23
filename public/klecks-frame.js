// Same-origin iframe: Klecks owns its document and global listeners. Removing the
// frame tears them down without affecting Vue or the other editor's stylesheet.
// Klecks tracks only its own saves, so our PSD autosave never clears its unload
// warning. Suppress that warning inside this frame; pagehide autosave still runs.
window.addEventListener('beforeunload', event => event.stopImmediatePropagation(), { capture: true })

let editor
let saveTimer
let dirty = false
let saveQueue = Promise.resolve()
let database

function reportWarning(message) {
  parent.postMessage({ type: 'drawwat-klecks-warning', message }, location.origin)
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('drawwat-klecks-v1', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('drafts')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function draftRequest(mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('drafts', mode)
    const request = action(transaction.objectStore('drafts'))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

async function saveDraft() {
  clearTimeout(saveTimer)
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    await ready
    if (!dirty) return
    if (!database) throw new Error('浏览器无法保存草稿，请及时生成谜题。')
    dirty = false
    try {
      const psd = await editor.getPSD()
      await draftRequest('readwrite', store => store.put(psd, 'current'))
      reportWarning('')
    } catch (error) {
      dirty = true
      reportWarning('草稿无法保存到浏览器，请及时生成谜题。')
      throw error
    }
  })
  return saveQueue
}

function scheduleSave() {
  dirty = true
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { void saveDraft().catch(() => {}) }, 800)
}

async function exportAsImage() {
  await ready
  const bitmap = await createImageBitmap(await editor.getPNG())
  try {
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height))
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('无法导出画板')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let hasDrawing = false
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
        hasDrawing = true
        break
      }
    }
    if (!hasDrawing) return null
    return await new Promise((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('无法导出画板')),
      'image/webp', 0.9,
    ))
  } finally {
    bitmap.close()
  }
}

async function clearCanvas() {
  await ready
  clearTimeout(saveTimer)
  await saveQueue.catch(() => {})
  if (database) await draftRequest('readwrite', store => store.delete('current'))
  dirty = false
  // Embed supports one project per document; reload to create a clean instance.
  location.reload()
}

const ready = (async () => {
  editor = new window.Klecks({
    embedUrl: new URL('./klecks/', location.href).href,
    onSubmit: (onSuccess, onError) => {
      exportAsImage().then(() => {
        parent.postMessage({ type: 'drawwat-klecks-submit' }, location.origin)
        onSuccess()
      }).catch(onError)
    },
  })
  let project
  try {
    database = await openDatabase()
    const draft = await draftRequest('readonly', store => store.get('current'))
    if (draft) project = await editor.readPSD(await draft.arrayBuffer())
  } catch {
    reportWarning('无法恢复本地草稿，已打开空白画板。')
  }
  editor.openProject(project ?? {
    width: 1000, height: 750,
    layers: [{ name: '背景', opacity: 1, image: { fill: '#fff' } }],
  })
  // The official wrapper initializes asynchronously and has no ready callback.
  await new Promise((resolve, reject) => {
    const started = Date.now()
    const check = async () => {
      try {
        await editor.getPNG()
        resolve()
      } catch {
        if (Date.now() - started > 60000) reject(new Error('画板加载失败，请重试'))
        else setTimeout(check, 150)
      }
    }
    void check()
  })
  document.addEventListener('pointerup', scheduleSave, true)
  document.addEventListener('pointercancel', scheduleSave, true)
  document.addEventListener('keyup', scheduleSave, true)
  document.addEventListener('input', scheduleSave, true)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void saveDraft().catch(() => {})
  })
  window.addEventListener('pagehide', () => { void saveDraft().catch(() => {}) })
})()

window.drawwatCanvas = { ready, saveDraft, exportAsImage, clearCanvas }
ready.catch(error => reportWarning(error.message))
