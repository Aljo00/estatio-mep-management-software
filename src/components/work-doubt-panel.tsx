"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { CheckCircle2, ImagePlus, Mic, Music2, Send, Square, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { roleLabels, type AppRole, type EvidencePhoto, type WorkDoubtMessage, type WorkDoubtThread } from "@/data/mock-data"

type WorkDoubtPanelProps = {
  assignmentId: string
  role: AppRole
  currentUser: string
  threads: WorkDoubtThread[]
  onPostMessage: (assignmentId: string, threadId: string | undefined, message: Omit<WorkDoubtMessage, "id" | "sentAt">, resolveThread: boolean) => void
}

export function WorkDoubtPanel({ assignmentId, role, currentUser, threads, onPostMessage }: WorkDoubtPanelProps) {
  const assignmentThreads = threads.filter((thread) => thread.assignmentId === assignmentId)
  const openCount = assignmentThreads.filter((thread) => thread.status === "Open").length
  const canParticipate = role === "engineer" || role === "supervisor"

  function post(threadId: string | undefined, text: string, photos: EvidencePhoto[], audioUrl: string | undefined, resolveThread: boolean) {
    if (role !== "engineer" && role !== "supervisor") return
    onPostMessage(assignmentId, threadId, { author: currentUser, role, text, photos, audioUrl }, resolveThread)
  }

  return (
    <section className="mt-4 border-t border-slate-100 pt-4" aria-label="Work discussion">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold text-slate-800">Work discussion</h4>
          <p className="mt-1 text-[10px] text-slate-500">Questions and replies stay with this assignment. The PM can follow the full thread.</p>
        </div>
        <Badge variant={openCount ? "secondary" : "outline"} className="text-[10px]">{openCount} open · {assignmentThreads.length} total</Badge>
      </div>

      <div className="space-y-3">
        {assignmentThreads.map((thread) => (
          <article key={thread.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Thread {thread.id}</p>
              <Badge variant={thread.status === "Resolved" ? "outline" : "secondary"} className={thread.status === "Resolved" ? "border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700" : "text-[10px]"}>
                {thread.status === "Resolved" && <CheckCircle2 className="mr-1 size-3" />}{thread.status}
              </Badge>
            </div>

            <div className="space-y-2.5">
              {thread.messages.map((message) => (
                <article key={message.id} className={`max-w-[96%] rounded-lg border p-3 ${message.role === "engineer" ? "ml-auto border-teal-100 bg-teal-50/70" : "mr-auto border-slate-100 bg-slate-50"}`}>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="text-[10px] font-semibold text-slate-700">{message.author} <span className="font-normal text-slate-400">· {roleLabels[message.role]}</span></p>
                    <time className="text-[9px] text-slate-400">{message.sentAt}</time>
                  </div>
                  <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700">{message.text}</p>
                  {message.photos?.length ? <div className="mt-2 flex flex-wrap gap-2">{message.photos.map((photo, index) => <a key={`${photo.url}-${index}`} href={photo.url} target="_blank" rel="noreferrer" title={photo.name} className="overflow-hidden rounded-md border border-slate-200 bg-white"><Image src={photo.url} alt={photo.name} width={120} height={84} unoptimized className="h-20 w-28 object-cover" /></a>)}</div> : null}
                  {message.audioUrl && <audio controls src={message.audioUrl} className="mt-2 h-8 max-w-full" />}
                </article>
              ))}
            </div>

            {thread.status === "Open" && canParticipate && (
              <MessageComposer
                title="Reply to this doubt"
                placeholder="Add the clarification, next step, or follow-up question..."
                submitLabel="Send reply"
                allowResolve={role === "engineer"}
                onSubmit={(text, photos, audioUrl, resolveThread) => post(thread.id, text, photos, audioUrl, resolveThread)}
              />
            )}
          </article>
        ))}

        {assignmentThreads.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[10px] text-slate-500">No questions have been raised on this work yet.</p>}
      </div>

      {role === "supervisor" && (
        <MessageComposer
          title="Raise a doubt"
          placeholder="Describe what is unclear and what you need the Engineer to confirm..."
          submitLabel="Send question"
          onSubmit={(text, photos, audioUrl) => post(undefined, text, photos, audioUrl, false)}
        />
      )}
    </section>
  )
}

function MessageComposer({
  title,
  placeholder,
  submitLabel,
  allowResolve = false,
  onSubmit,
}: {
  title: string
  placeholder: string
  submitLabel: string
  allowResolve?: boolean
  onSubmit: (text: string, photos: EvidencePhoto[], audioUrl: string | undefined, resolveThread: boolean) => void
}) {
  const photoInput = useRef<HTMLInputElement>(null)
  const audioInput = useRef<HTMLInputElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const ownedUrls = useRef(new Set<string>())
  const isMounted = useRef(true)
  const [text, setText] = useState("")
  const [photos, setPhotos] = useState<EvidencePhoto[]>([])
  const [audioUrl, setAudioUrl] = useState<string | undefined>()
  const [recording, setRecording] = useState(false)
  const [resolveThread, setResolveThread] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      const activeRecorder = recorder.current
      if (activeRecorder?.state === "recording") {
        activeRecorder.onstop = null
        activeRecorder.stop()
      }
      mediaStream.current?.getTracks().forEach((track) => track.stop())
      ownedUrls.current.forEach((url) => URL.revokeObjectURL(url))
      ownedUrls.current.clear()
    }
  }, [])

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const nextPhotos = files.map((file) => {
      const url = URL.createObjectURL(file)
      ownedUrls.current.add(url)
      return { name: file.name, url }
    })
    setPhotos((current) => [...current, ...nextPhotos])
    event.target.value = ""
  }

  function removePhoto(index: number) {
    const photo = photos[index]
    if (photo?.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url)
      ownedUrls.current.delete(photo.url)
    }
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))
  }

  function setUploadedAudio(file?: File) {
    if (!file) return
    if (audioUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl)
      ownedUrls.current.delete(audioUrl)
    }
    const url = URL.createObjectURL(file)
    ownedUrls.current.add(url)
    setAudioUrl(url)
    setError("")
  }

  async function startRecording() {
    setError("")
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError("Audio recording is not supported in this browser.")
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!isMounted.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      mediaStream.current = stream
      chunks.current = []
      const nextRecorder = new MediaRecorder(stream)
      recorder.current = nextRecorder
      nextRecorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.current.push(event.data) }
      nextRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: nextRecorder.mimeType || "audio/webm" })
        if (blob.size > 0) {
          if (audioUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(audioUrl)
            ownedUrls.current.delete(audioUrl)
          }
          const url = URL.createObjectURL(blob)
          ownedUrls.current.add(url)
          setAudioUrl(url)
        }
        stream.getTracks().forEach((track) => track.stop())
        mediaStream.current = null
        setRecording(false)
      }
      nextRecorder.start()
      setRecording(true)
    } catch {
      mediaStream.current?.getTracks().forEach((track) => track.stop())
      mediaStream.current = null
      setError("Microphone access was unavailable. Allow microphone access and try again.")
    }
  }

  function stopRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!text.trim() && photos.length === 0 && !audioUrl) {
      setError("Add a message, photo, or audio note before sending.")
      return
    }
    if (recording) {
      setError("Stop the recording before sending this message.")
      return
    }
    photos.forEach((photo) => ownedUrls.current.delete(photo.url))
    if (audioUrl) ownedUrls.current.delete(audioUrl)
    onSubmit(text.trim(), photos, audioUrl, resolveThread)
    setText("")
    setPhotos([])
    setAudioUrl(undefined)
    setResolveThread(false)
    setError("")
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
      <p className="mb-2 text-[10px] font-semibold text-slate-700">{title}</p>
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={2} placeholder={placeholder} className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed outline-none placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-3 focus-visible:ring-teal-700/15" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input ref={photoInput} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
        <input ref={audioInput} type="file" accept="audio/*" className="hidden" onChange={(event) => { setUploadedAudio(event.target.files?.[0]); event.target.value = "" }} />
        <Button type="button" variant="outline" size="sm" className="h-8 bg-white text-[10px]" onClick={() => photoInput.current?.click()}><ImagePlus className="mr-1 size-3.5" />Add photos</Button>
        {recording ? <Button type="button" variant="destructive" size="sm" className="h-8 text-[10px]" onClick={stopRecording}><Square className="mr-1 size-3" />Stop recording</Button> : <Button type="button" variant="outline" size="sm" className="h-8 bg-white text-[10px]" onClick={startRecording}><Mic className="mr-1 size-3.5" />Record audio</Button>}
        <Button type="button" variant="outline" size="sm" className="h-8 bg-white text-[10px]" onClick={() => audioInput.current?.click()}><Music2 className="mr-1 size-3.5" />Upload audio</Button>
        <span className="flex-1" />
        <Button type="submit" size="sm" className="h-8 bg-teal-800 text-[10px] text-white hover:bg-teal-700"><Send className="mr-1 size-3" />{submitLabel}</Button>
      </div>
      {recording && <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-rose-700"><span className="size-1.5 animate-pulse rounded-full bg-rose-600" />Recording voice note…</p>}
      {allowResolve && <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[10px] text-slate-600"><input type="checkbox" checked={resolveThread} onChange={(event) => setResolveThread(event.target.checked)} className="size-3.5 accent-teal-700" />Mark this doubt resolved with my reply</label>}
      {photos.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{photos.map((photo, index) => <div key={`${photo.url}-${index}`} className="relative overflow-hidden rounded-md border border-slate-200 bg-white"><Image src={photo.url} alt={photo.name} width={76} height={56} unoptimized className="h-14 w-[76px] object-cover" /><button type="button" aria-label={`Remove ${photo.name}`} onClick={() => removePhoto(index)} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-slate-900/75 text-white"><X className="size-3" /></button></div>)}</div>}
      {audioUrl && <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2"><audio controls src={audioUrl} className="h-8 min-w-0 flex-1" /><button type="button" aria-label="Remove audio attachment" onClick={() => { if (audioUrl.startsWith("blob:")) { URL.revokeObjectURL(audioUrl); ownedUrls.current.delete(audioUrl) }; setAudioUrl(undefined) }} className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="size-3.5" /></button></div>}
      {error && <p role="alert" className="mt-2 text-[10px] text-rose-700">{error}</p>}
    </form>
  )
}
