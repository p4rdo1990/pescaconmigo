import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Mail,
  Instagram,
  Facebook,
  Image as ImageIcon,
  Video as VideoIcon,
  Send,
  Fish,
  Loader2,
  Music2,
  Radio,
  Youtube,
  StopCircle,
  X,
  CalendarDays,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  listMedia,
  createUploadTicket,
  finalizeUpload,
  postMessage,
  verifyAdminPin,
  startLive as startLiveFn,
  stopLive as stopLiveFn,
  createReplayUploadTicket,
  saveLiveReplay,
  listLiveReplays,
  createBooking,
  listBookingCalendar,
} from "@/lib/site.functions";

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
import heroImg from "@/assets/hero.jpg";
import videoCarpaRoyalNuevo from "@/assets/media/video-carpa-royal-nuevo.mp4";
import videoPedro from "@/assets/media/video-pedro-web.mp4";
import videoPicada from "@/assets/media/video-picada-web.mp4";

const FEATURED_PHOTOS = [
  { url: "/media/WhatsApp Image 2026-07-27 at 13.52.14.jpeg", caption: "Gran captura junto al río" },
  { url: "/media/WhatsApp Image 2026-07-27 at 13.47.21 (1).jpeg", caption: "Carpa en la red" },
  { url: "/media/WhatsApp Image 2026-07-27 at 13.47.21 (2).jpeg", caption: "Captura recién salida" },
  { url: "/media/WhatsApp Image 2026-07-27 at 13.47.21.jpeg", caption: "Otra buena carpa" },
];

const FEATURED_VIDEOS = [
  { url: videoCarpaRoyalNuevo, caption: "Carpa royal recién pescada" },
  { url: "/media/WhatsApp Video 2026-07-27 at 13.51.04.mp4", caption: "" },
  { url: "/media/WhatsApp Video 2026-07-27 at 13.51.05.mp4", caption: "" },
  { url: "/media/WhatsApp Video 2026-07-27 at 13.52.38.mp4", caption: "" },
  { url: videoPedro, caption: "" },
  { url: videoPicada, caption: "" },
];

const WHATSAPP = "34695466147";
const EMAIL = "[email protected]";
const INSTAGRAM = "https://www.instagram.com/angel.pardo/";
const FACEBOOK = "https://www.facebook.com/angel.pardo.5815?locale=es_ES";
const TIKTOK = "https://www.tiktok.com/@angel.pardo69";
const WA_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "¡Hola Ángel! Me gustaría reservar una jornada de pesca contigo.",
)}`;

export const Route = createFileRoute("/")({
  component: Home,
});

type MediaRow = {
  id: string;
  kind: "photo" | "video";
  url: string;
  caption: string | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  author: string;
  content: string;
  created_at: string;
};

type LiveRow = {
  id: string;
  is_live: boolean;
  platform: string;
  url: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type ReplayRow = {
  id: string;
  title: string;
  storage_path: string;
  created_at: string;
  signedUrl: string | null;
};

const PIN_KEY = "pescaconmigo:pin";

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {isSupabaseConfigured && <LiveBanner />}
      <Hero />
      <main className="mx-auto max-w-6xl px-4 pb-24 space-y-24">
        <Featured />
        {isSupabaseConfigured && <Live />}
        <Booking />
        <Contact />
        {isSupabaseConfigured && <Gallery />}
        {isSupabaseConfigured && <Chat />}
      </main>
      <Footer />
    </div>
  );
}

function Featured() {
  const [selectedPhoto, setSelectedPhoto] = useState<(typeof FEATURED_PHOTOS)[number] | null>(null);

  return (
    <section id="destacados" className="scroll-mt-16 pt-16">
      <SectionTitle
        kicker="En portada"
        title="Capturas y vídeos destacados"
      />
      <p className="mt-3 text-muted-foreground max-w-xl">
        Un vistazo rápido a algunas de mis mejores jornadas.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURED_VIDEOS.map((v) => (
          <div
            key={v.url}
            className="group relative aspect-video overflow-hidden rounded-2xl border border-border bg-card"
          >
            <video
              src={v.url}
              controls
              playsInline
              preload="auto"
              className="h-full w-full bg-black object-contain"
            />
            {v.caption && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-3 text-xs text-foreground/90">
                {v.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {FEATURED_PHOTOS.map((p) => (
          <button
            type="button"
            key={p.url}
            onClick={() => setSelectedPhoto(p)}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card"
            aria-label={`Ver foto: ${p.caption}`}
          >
            <img
              src={p.url}
              alt={p.caption}
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-transparent to-transparent p-3 text-left text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {p.caption}
            </span>
          </button>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.caption}
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />
            <p className="mt-3 text-center text-sm text-white">{selectedPhoto.caption}</p>
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -right-2 -top-2 rounded-full bg-white p-2 text-black shadow-lg"
              aria-label="Cerrar foto"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Hero() {
  return (
    <header className="relative isolate overflow-hidden">
      <img
        src={heroImg}
        alt="Pescador al amanecer en un embalse tranquilo"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-28 md:pt-32 md:pb-40">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary">
          <Fish className="h-4 w-4" />
          <span>pescaconmigo</span>
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-[1.05] max-w-3xl">
          Vive una jornada de pesca inolvidable con{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-accent)" }}
          >
            Ángel Pardo
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Guía de pesca personal. Te llevo a los mejores puntos del Ebro a por siluros gigantes, y también carpas, black bass y mucho más.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <MessageCircle className="h-5 w-5" />
            Reservar por WhatsApp
          </a>
          <a
            href="#galeria"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3 font-semibold backdrop-blur transition-colors hover:bg-card"
          >
            Ver galería
          </a>
        </div>
      </div>
    </header>
  );
}

function Contact() {
  const items = [
    {
      label: "WhatsApp",
      value: "+34 695 466 147",
      href: WA_URL,
      icon: MessageCircle,
    },
    {
      label: "Correo",
      value: EMAIL,
      href: `mailto:${EMAIL}?subject=${encodeURIComponent("Reserva jornada de pesca")}`,
      icon: Mail,
    },
    { label: "Instagram", value: "@angel.pardo", href: INSTAGRAM, icon: Instagram },
    { label: "Facebook", value: "Ángel Pardo", href: FACEBOOK, icon: Facebook },
    { label: "TikTok", value: "@angel.pardo69", href: TIKTOK, icon: Music2 },
  ];
  return (
    <section id="contacto" className="scroll-mt-16">
      <SectionTitle
        kicker="Contacto directo"
        title="Escríbeme y organizamos tu día de pesca"
      />
      <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map((it) => (
          <a
            key={it.label}
            href={it.href}
            target={it.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:border-primary"
          >
            <span
              className="grid h-14 w-14 place-items-center rounded-full text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-accent)" }}
            >
              <it.icon className="h-6 w-6" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {it.label}
              </div>
              <div className="mt-1 text-sm font-semibold group-hover:text-primary break-words">
                {it.value}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <div className="text-sm uppercase tracking-[0.3em] text-primary">
        {kicker}
      </div>
      <h2 className="mt-3 text-3xl md:text-4xl font-bold max-w-2xl">{title}</h2>
    </div>
  );
}

type CalendarBooking = { booking_date: string; status: "pending" | "confirmed" };

function Booking() {
  const today = new Date().toISOString().slice(0, 10);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const formatDate = (value: Date) => {
    const offset = value.getTimezoneOffset();
    return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 10);
  };

  useEffect(() => {
    void listBookingCalendar({ data: { from: formatDate(monthStart), to: formatDate(monthEnd) } })
      .then((rows) => setBookings(rows as CalendarBooking[]))
      .catch(() => setBookings([]));
  }, [month.getFullYear(), month.getMonth()]);

  async function reserve(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      await createBooking({ data: { firstName, lastName, phone, date, notes: notes || undefined } });
      setDone(true);
      const message = `Hola Ángel, quiero reservar una jornada de pesca.\n\nNombre: ${firstName} ${lastName}\nMóvil: ${phone}\nFecha solicitada: ${new Date(`${date}T12:00:00`).toLocaleDateString("es-ES")}${notes ? `\nNotas: ${notes}` : ""}\n\nQuedo pendiente de confirmación.`;
      window.location.assign(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud");
    } finally {
      setSending(false);
    }
  }

  const bookedByDate = new Map(bookings.map((booking) => [booking.booking_date, booking.status]));
  const emptyDays = (monthStart.getDay() + 6) % 7;
  const days = Array.from({ length: monthEnd.getDate() }, (_, index) => index + 1);

  return (
    <section id="reservas" className="scroll-mt-16">
      <SectionTitle kicker="Reserva tu jornada" title="Elige tu fecha y reserva por WhatsApp" />
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Completa tus datos primero. Al enviar, tu solicitud queda registrada y se abrirá WhatsApp con el mensaje preparado para confirmarla con Ángel.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <form onSubmit={reserve} className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <input required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nombre" className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
            <input required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Apellidos" className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
          </div>
          <input required value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="Número de móvil" className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
          <label className="mt-4 block text-sm font-medium">Fecha que quieres reservar</label>
          <input required type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} rows={3} placeholder="Notas o consulta (opcional)" className="mt-4 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
          <div className="mt-5 flex gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p><strong>Pago por Bizum:</strong> 695 466 147. No envíes el pago hasta que Ángel confirme la reserva por WhatsApp.</p>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          {done && <p className="mt-4 flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="h-4 w-4" /> Solicitud guardada. Abriendo WhatsApp…</p>}
          <button type="submit" disabled={sending} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <MessageCircle className="h-5 w-5" /> {sending ? "Guardando reserva…" : "Continuar por WhatsApp"}
          </button>
        </form>

        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full border border-border px-3 py-1 text-sm">←</button>
            <div className="flex items-center gap-2 font-semibold capitalize"><CalendarDays className="h-5 w-5 text-primary" />{month.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</div>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full border border-border px-3 py-1 text-sm">→</button>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {["L", "M", "X", "J", "V", "S", "D"].map((day) => <span key={day} className="py-2">{day}</span>)}
            {Array.from({ length: emptyDays }).map((_, index) => <span key={`empty-${index}`} />)}
            {days.map((day) => {
              const value = formatDate(new Date(month.getFullYear(), month.getMonth(), day));
              const status = bookedByDate.get(value);
              return <div key={value} className={`rounded-lg py-2 text-sm ${status === "confirmed" ? "bg-destructive text-destructive-foreground" : status === "pending" ? "bg-primary/20 text-primary" : "bg-background text-foreground"}`}>{day}</div>;
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-primary/40" />Solicitud pendiente</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-destructive" />Fecha reservada</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const [items, setItems] = useState<Array<MediaRow & { signedUrl?: string }>>([]);
  const [uploading, setUploading] = useState<null | "photo" | "video">(null);
  const [error, setError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const rows = await listMedia();
      setItems(
        (rows as Array<MediaRow & { signedUrl: string | null }>).map((r) => ({
          ...r,
          signedUrl: r.signedUrl ?? undefined,
        })),
      );
    } catch {
      setError("No se pudo cargar la galería");
    }
  }

  async function handleFile(file: File, kind: "photo" | "video") {
    setError(null);
    setUploading(kind);
    try {
      const ext = (file.name.split(".").pop() ?? "").toLowerCase();
      const ticket = await createUploadTicket({
        data: { kind, ext: /^[a-z0-9]{1,5}$/.test(ext) ? ext : undefined },
      });
      const { error: upErr } = await supabase.storage
        .from("media")
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type,
        });
      if (upErr) throw upErr;
      await finalizeUpload({ data: { kind, path: ticket.path } });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir el archivo");
    } finally {
      setUploading(null);
    }
  }

  return (
    <section id="galeria" className="scroll-mt-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionTitle
          kicker="Mis capturas"
          title="Fotos y vídeos de mis jornadas"
        />
        <div className="flex gap-3">
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f, "photo");
              e.target.value = "";
            }}
          />
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f, "video");
              e.target.value = "";
            }}
          />
          <button
            onClick={() => photoRef.current?.click()}
            disabled={uploading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary disabled:opacity-50"
          >
            {uploading === "photo" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            Subir foto
          </button>
          <button
            onClick={() => videoRef.current?.click()}
            disabled={uploading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary disabled:opacity-50"
          >
            {uploading === "video" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <VideoIcon className="h-4 w-4" />
            )}
            Subir vídeo
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-4 text-sm text-destructive">Error: {error}</p>
      )}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Aún no hay fotos ni vídeos. Sube el primero con los botones de arriba.
          </div>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card"
          >
            {it.signedUrl ? (
              it.kind === "photo" ? (
                <img
                  src={it.signedUrl}
                  alt={it.caption ?? "Captura de pesca"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <video
                  src={it.signedUrl}
                  controls
                  playsInline
                  className="h-full w-full bg-black object-contain"
                />
              )
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Chat() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pescaconmigo:author");
    if (saved) setAuthor(saved);

    void supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (data) setMessages(data as MessageRow[]);
      });

    const channel = supabase
      .channel("messages-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((m) => [...m, payload.new as MessageRow]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const a = author.trim();
    const c = content.trim();
    if (!a || !c || sending) return;
    setSending(true);
    localStorage.setItem("pescaconmigo:author", a);
    try {
      await postMessage({
        data: { author: a.slice(0, 40), content: c.slice(0, 500) },
      });
      setContent("");
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="chat" className="scroll-mt-16">
      <SectionTitle
        kicker="Comunidad"
        title="Chat general de pesca"
      />
      <p className="mt-3 text-muted-foreground max-w-xl">
        Habla con otros pescadores en tiempo real. Comparte cebos, spots o cuenta tu última captura.
      </p>
      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
        <div
          ref={scrollRef}
          className="h-96 space-y-3 overflow-y-auto p-4 md:p-6"
        >
          {messages.length === 0 && (
            <div className="grid h-full place-items-center text-center text-muted-foreground">
              Sé el primero en escribir 🎣
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-primary">
                  {m.author}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(m.created_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-foreground/90 whitespace-pre-wrap break-words">
                {m.content}
              </p>
            </div>
          ))}
        </div>
        <form
          onSubmit={send}
          className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-2 border-t border-border p-3"
        >
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={40}
            placeholder="Tu nombre"
            className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            placeholder="Escribe un mensaje..."
            className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!author.trim() || !content.trim() || sending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Enviar
          </button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} pescaconmigo · Ángel Pardo
    </footer>
  );
}

function useOwnerMode() {
  const [isOwner, setIsOwner] = useState(false);
  const [pin, setPin] = useState<string>("");
  useEffect(() => {
    const saved = localStorage.getItem(PIN_KEY);
    if (!saved) return;
    void verifyAdminPin({ data: { pin: saved } })
      .then((r) => {
        if (r.ok) {
          setPin(saved);
          setIsOwner(true);
        } else {
          localStorage.removeItem(PIN_KEY);
        }
      })
      .catch(() => undefined);
  }, []);
  const unlock = async () => {
    const entered = window.prompt("Introduce el PIN de administrador");
    if (!entered) return;
    const r = await verifyAdminPin({ data: { pin: entered } }).catch(() => ({
      ok: false,
    }));
    if (r.ok) {
      localStorage.setItem(PIN_KEY, entered);
      setPin(entered);
      setIsOwner(true);
    } else {
      window.alert("PIN incorrecto");
    }
  };
  const lock = () => {
    localStorage.removeItem(PIN_KEY);
    setPin("");
    setIsOwner(false);
  };
  return { isOwner, pin, unlock, lock };
}

function useLiveStream() {
  const [live, setLive] = useState<LiveRow | null>(null);
  const channelNameRef = useRef(
    `live-feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );

  async function load() {
    const { data } = await supabase
      .from("live_streams")
      .select("*")
      .eq("is_live", true)
      .order("updated_at", { ascending: false })
      .limit(1);
    setLive((data?.[0] as LiveRow | undefined) ?? null);
  }

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(channelNameRef.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_streams" },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { live, reload: load };
}

function LiveBanner() {
  const { live } = useLiveStream();
  if (!live) return null;
  return (
    <a
      href={live.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-20 flex items-center justify-center gap-3 bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground hover:opacity-95"
    >
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
      </span>
      <Radio className="h-4 w-4" />
      EN DIRECTO ahora en {live.platform}
      {live.title ? ` · ${live.title}` : ""} — toca para verlo
    </a>
  );
}

function Live() {
  const { live, reload } = useLiveStream();
  const { isOwner, pin, unlock, lock } = useOwnerMode();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const replayRef = useRef<HTMLInputElement>(null);

  async function startLive(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setBusy(true);
    setErr(null);
    try {
      await startLiveFn({
        data: { pin, url: trimmed, title: title.trim() || undefined },
      });
      setUrl("");
      setTitle("");
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al iniciar el directo");
    } finally {
      setBusy(false);
    }
  }

  async function stopLive() {
    setBusy(true);
    setErr(null);
    try {
      await stopLiveFn({ data: { pin } });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al finalizar el directo");
    } finally {
      setBusy(false);
    }
  }

  async function finishAndSaveReplay(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase();
      const replayTitle = title.trim() || live?.title || `Directo de pesca — ${new Date().toLocaleDateString("es-ES")}`;
      if (live) await stopLiveFn({ data: { pin } });
      const ticket = await createReplayUploadTicket({ data: { pin, ext } });
      const { error: uploadError } = await supabase.storage
        .from("media")
        .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      await saveLiveReplay({ data: { pin, path: ticket.path, title: replayTitle } });
      setTitle("");
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar el directo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="directo" className="scroll-mt-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionTitle kicker="En vivo" title="Directo desde el río" />
        {!isOwner ? (
          <button
            onClick={unlock}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            Modo Ángel
          </button>
        ) : (
          <button
            onClick={lock}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            Salir modo admin
          </button>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-8">
        <input
          ref={replayRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void finishAndSaveReplay(file);
            event.target.value = "";
          }}
        />
        {live ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-destructive"></span>
              </span>
              <div>
                <div className="text-xs uppercase tracking-widest text-destructive font-bold">
                  Directo en {live.platform}
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {live.title || "Ángel está pescando en vivo ahora mismo"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={live.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                <Radio className="h-4 w-4" />
                Ver directo
              </a>
              {isOwner && (
                <>
                  <button
                    onClick={stopLive}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:border-destructive disabled:opacity-50"
                  >
                    <StopCircle className="h-4 w-4" />
                    Finalizar
                  </button>
                  <button
                    onClick={() => replayRef.current?.click()}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    <VideoIcon className="h-4 w-4" />
                    Finalizar y guardar vídeo
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">
            Ángel no está emitiendo ahora mismo. Cuando esté en directo lo verás aquí y aparecerá un aviso en la cabecera.
          </div>
        )}

        {isOwner && (
          <form onSubmit={startLive} className="mt-6 grid gap-2 md:grid-cols-[1fr_1fr_auto] border-t border-border pt-6">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL del directo (Instagram, TikTok, YouTube, Facebook...)"
              className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título (opcional)"
              maxLength={80}
              className="rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!url.trim() || busy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
              Empezar directo
            </button>
            {err && <p className="md:col-span-3 text-sm text-destructive">{err}</p>}
            <p className="md:col-span-3 text-xs text-muted-foreground">
              Empieza el directo en tu app (Instagram Live, TikTok Live, YouTube, Facebook...), copia el enlace público y pégalo aquí. Aparecerá en la web con un aviso rojo para todos los visitantes.
            </p>
          </form>
        )}
      </div>
      <ReplayArchive />
    </section>
  );
}

function ReplayArchive() {
  const [replays, setReplays] = useState<ReplayRow[]>([]);

  useEffect(() => {
    void listLiveReplays()
      .then((rows) => setReplays(rows as ReplayRow[]))
      .catch(() => undefined);
  }, []);

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 md:p-8">
      <h3 className="text-xl font-bold">Repeticiones de directos</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Aquí podrás volver a ver los directos que Ángel haya decidido guardar.
      </p>
      {replays.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Todavía no hay directos guardados.</p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {replays.map((replay) => (
            <article key={replay.id} className="overflow-hidden rounded-2xl border border-border bg-background">
              {replay.signedUrl && (
                <video src={replay.signedUrl} controls playsInline preload="metadata" className="aspect-video w-full bg-black" />
              )}
              <div className="p-4">
                <h4 className="font-semibold">{replay.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(replay.created_at).toLocaleDateString("es-ES")}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
