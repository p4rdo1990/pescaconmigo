import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_PIN = () => process.env.ADMIN_PIN ?? "ebro2026";

const admin = async () =>
  (await import("@/integrations/supabase/client.server")).supabaseAdmin;

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "Instagram";
  if (u.includes("tiktok.com")) return "TikTok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "Facebook";
  if (u.includes("twitch.tv")) return "Twitch";
  return "En directo";
}

const httpUrl = z
  .string()
  .trim()
  .min(8)
  .max(2000)
  .refine((v) => /^https:\/\//i.test(v), "La URL debe empezar por https://");

const bookingDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida");

/** Public gallery: rows + short-lived signed URLs (bucket stays private). */
export const listMedia = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id,kind,url,caption,created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error("No se pudo cargar la galería");
  const rows = data ?? [];
  const paths = rows.map((r) => r.url);
  const signedMap = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabaseAdmin.storage
      .from("media")
      .createSignedUrls(paths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
    }
  }
  return rows.map((r) => ({ ...r, signedUrl: signedMap.get(r.url) ?? null }));
});

/** Step 1 of upload: server picks the path and returns a one-time signed upload token. */
export const createUploadTicket = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        kind: z.enum(["photo", "video"]),
        ext: z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z0-9]{1,5}$/)
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const allowed =
      data.kind === "photo"
        ? ["jpg", "jpeg", "png", "webp", "heic", "gif"]
        : ["mp4", "mov", "webm", "m4v"];
    const ext =
      data.ext && allowed.includes(data.ext)
        ? data.ext
        : data.kind === "photo"
          ? "jpg"
          : "mp4";
    const path = `${data.kind}s/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const { data: ticket, error } = await supabaseAdmin.storage
      .from("media")
      .createSignedUploadUrl(path);
    if (error || !ticket) throw new Error("No se pudo preparar la subida");
    return { path: ticket.path, token: ticket.token };
  });

/** Step 2: register the uploaded object, only if it really exists in storage. */
export const finalizeUpload = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        kind: z.enum(["photo", "video"]),
        path: z
          .string()
          .trim()
          .regex(/^(photos|videos)\/[A-Za-z0-9._-]{1,80}$/),
        caption: z.string().trim().max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const folder = data.path.split("/")[0];
    const name = data.path.split("/")[1];
    const { data: found } = await supabaseAdmin.storage
      .from("media")
      .list(folder, { search: name, limit: 1 });
    if (!found?.some((f) => f.name === name)) {
      throw new Error("El archivo no se subió correctamente");
    }
    const { error } = await supabaseAdmin
      .from("media")
      .insert({ kind: data.kind, url: data.path, caption: data.caption || null });
    if (error) throw new Error("No se pudo guardar el archivo");
    return { ok: true };
  });

/** Public chat post, validated and sanitised server-side. */
export const postMessage = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        author: z.string().trim().min(1).max(40),
        content: z.string().trim().min(1).max(500),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { error } = await supabaseAdmin.from("messages").insert({
      author: data.author,
      content: data.content,
    });
    if (error) throw new Error("No se pudo enviar el mensaje");
    return { ok: true };
  });

/** Stores a booking request before opening WhatsApp with the reservation summary. */
export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        firstName: z.string().trim().min(2).max(40),
        lastName: z.string().trim().min(2).max(80),
        phone: z.string().trim().regex(/^[0-9+ ()-]{9,20}$/, "Número de móvil no válido"),
        date: bookingDate,
        notes: z.string().trim().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("booking_requests")
      .select("id")
      .eq("booking_date", data.date)
      .in("status", ["pending", "confirmed"])
      .limit(1);
    if (existingError) throw new Error("No se pudo comprobar la fecha");
    if (existing?.length) throw new Error("Esa fecha ya tiene una reserva o una solicitud pendiente");
    const { error } = await supabaseAdmin.from("booking_requests").insert({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      booking_date: data.date,
      notes: data.notes || null,
      status: "pending",
    });
    if (error) throw new Error("No se pudo guardar la reserva");
    return { ok: true };
  });

export const listBookingCalendar = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ from: bookingDate, to: bookingDate }).parse(data))
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: rows, error } = await supabaseAdmin
      .from("booking_requests")
      .select("booking_date,status")
      .gte("booking_date", data.from)
      .lte("booking_date", data.to)
      .in("status", ["pending", "confirmed"]);
    if (error) throw new Error("No se pudo cargar el calendario");
    return rows ?? [];
  });

export const verifyAdminPin = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ pin: z.string().max(100) }).parse(data))
  .handler(async ({ data }) => ({ ok: data.pin === ADMIN_PIN() }));

export const startLive = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        pin: z.string().max(100),
        url: httpUrl,
        title: z.string().trim().max(80).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (data.pin !== ADMIN_PIN()) throw new Error("PIN incorrecto");
    const supabaseAdmin = await admin();
    await supabaseAdmin
      .from("live_streams")
      .update({ is_live: false, updated_at: new Date().toISOString() })
      .eq("is_live", true);
    const { error } = await supabaseAdmin.from("live_streams").insert({
      is_live: true,
      platform: detectPlatform(data.url),
      url: data.url,
      title: data.title || null,
    });
    if (error) throw new Error("No se pudo iniciar el directo");
    return { ok: true };
  });

export const stopLive = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ pin: z.string().max(100) }).parse(data))
  .handler(async ({ data }) => {
    if (data.pin !== ADMIN_PIN()) throw new Error("PIN incorrecto");
    const supabaseAdmin = await admin();
    const { error } = await supabaseAdmin
      .from("live_streams")
      .update({ is_live: false, updated_at: new Date().toISOString() })
      .eq("is_live", true);
    if (error) throw new Error("No se pudo finalizar el directo");
    return { ok: true };
  });

/** Creates a short-lived ticket for the administrator to upload a replay. */
export const createReplayUploadTicket = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        pin: z.string().max(100),
        ext: z.string().trim().toLowerCase().regex(/^[a-z0-9]{1,5}$/).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (data.pin !== ADMIN_PIN()) throw new Error("PIN incorrecto");
    const ext = data.ext && ["mp4", "mov", "webm", "m4v"].includes(data.ext) ? data.ext : "mp4";
    const path = `replays/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const supabaseAdmin = await admin();
    const { data: ticket, error } = await supabaseAdmin.storage
      .from("media")
      .createSignedUploadUrl(path);
    if (error || !ticket) throw new Error("No se pudo preparar el vídeo");
    return { path: ticket.path, token: ticket.token };
  });

/** Stores a finished live replay after its file was uploaded to private storage. */
export const saveLiveReplay = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        pin: z.string().max(100),
        path: z.string().trim().regex(/^replays\/[A-Za-z0-9._-]{1,80}$/),
        title: z.string().trim().min(1).max(80),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (data.pin !== ADMIN_PIN()) throw new Error("PIN incorrecto");
    const supabaseAdmin = await admin();
    const fileName = data.path.split("/")[1];
    const { data: found } = await supabaseAdmin.storage
      .from("media")
      .list("replays", { search: fileName, limit: 1 });
    if (!found?.some((file) => file.name === fileName)) {
      throw new Error("El vídeo no se subió correctamente");
    }
    const { error } = await supabaseAdmin.from("live_replays").insert({
      title: data.title,
      storage_path: data.path,
    });
    if (error) throw new Error("No se pudo guardar la repetición");
    return { ok: true };
  });

export const listLiveReplays = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseAdmin = await admin();
  const { data, error } = await supabaseAdmin
    .from("live_replays")
    .select("id,title,storage_path,created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("No se pudieron cargar las repeticiones");
  const rows = data ?? [];
  const { data: signed } = await supabaseAdmin.storage
    .from("media")
    .createSignedUrls(rows.map((row) => row.storage_path), 60 * 60);
  const signedUrls = new Map((signed ?? []).flatMap((item) =>
    item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : [],
  ));
  return rows.map((row) => ({ ...row, signedUrl: signedUrls.get(row.storage_path) ?? null }));
});
