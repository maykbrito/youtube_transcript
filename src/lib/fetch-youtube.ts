/** source: https://github.com/lucasliet/youtube-transcript-mcp/tree/main */
/**
 * Retrieves the YouTube watch page HTML, handling consent when necessary.
 * @param videoId The YouTube video ID.
 * @param fetchImpl Function used to perform the HTTP requests.
 * @returns The HTML string of the watch page.
 */
export async function fetchWatchHtml(videoId: string, fetchImpl = fetchText) {
	const url = `https://www.youtube.com/watch?v=${videoId}`;
	let html = await fetchImpl(url, { "Accept-Language": "en-US" });
	if (html.includes('action="https://consent.youtube.com/s"')) {
		const v = html.match(/name="v" value="(.*?)"/);
		if (!v) throw new Error("consent_cookie_create_failed");
		html = await fetchImpl(url, {
			"Accept-Language": "en-US",
			Cookie: `CONSENT=YES+${v[1]}`,
		});
		if (html.includes('action="https://consent.youtube.com/s"'))
			throw new Error("consent_cookie_invalid");
	}
	return html;
}

/**
 * Performs a GET request and returns the body as text.
 * @param url The target URL.
 * @param headers Optional request headers.
 * @returns Resolves with the response text or throws on HTTP error.
 */
export async function fetchText(url: string, headers = {}) {
	const res = await fetch(url, { headers });
	if (!res.ok) throw new Error(String(res.status));
	return res.text();
}

/**
 * Extracts a YouTube video ID from a full URL or short link.
 * @param url The YouTube video URL.
 * @returns The 11-character video ID or null when not found.
 */
/**
 * Extracts an 11-character YouTube video identifier from a URL string.
 * @param url The input YouTube URL or short link.
 * @returns The detected video identifier or null when extraction fails.
 */
export function extractVideoId(url: string) {
	const match = url.match(
		/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)([\w-]{11})/,
	);
	return match ? match[1] : null;
}

/**
 * @typedef {object} TranscriptYtArgs
 * @property {string} videoUrl Full YouTube video URL.
 * @property {string[]} [preferredLanguages] Optional ordered language codes preference, e.g., ['pt-BR','en'].
 */

interface TranscriptYtArgs {
	videoUrl: string;
	preferredLanguages?: string[];
}

/**
 * @typedef {object} TranscriptSegment
 * @property {string} text The caption text content.
 * @property {number} startInMs Segment start time in milliseconds.
 * @property {number} duration Segment duration in milliseconds.
 */
export interface TranscriptSegment {
	text: string;
	startInMs: number;
	duration: number;
}

/**
 * Retrieves YouTube transcript segments from a video URL.
 * Returns null on any failure; logs categorized errors.
 * @param {TranscriptYtArgs} args The request payload with videoUrl and optional preferredLanguages.
 * @returns {Promise<TranscriptSegment[] | null>} A list of transcript segments or null when unavailable.
 */
export async function transcriptYt(args: TranscriptYtArgs) {
	try {
		const id = extractVideoId(args.videoUrl);
		if (!id) {
			logError("invalid_url", "unable_to_extract_video_id");
			return null;
		}
		const html = await fetchWatchHtml(id);
		const apiKey = extractInnertubeApiKey(html);
		if (!apiKey) {
			logError("inaccessible", "innertube_api_key_not_found");
			return null;
		}
		const data = await fetchInnertubePlayer(apiKey, id);
		assertPlayability(data?.playabilityStatus);
		const tracks =
			data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
		const audioTracks =
			data?.captions?.playerCaptionsTracklistRenderer?.audioTracks || [];
		const defaultCaptionTrackIndex =
			typeof audioTracks?.[0]?.defaultCaptionTrackIndex === "number"
				? audioTracks[0].defaultCaptionTrackIndex
				: undefined;
		const defaultTranslationSourceTrackIndices =
			data?.captions?.playerCaptionsTracklistRenderer
				?.defaultTranslationSourceTrackIndices;
		if (!Array.isArray(tracks) || tracks.length === 0) {
			logError("no_captions", "no_caption_tracks_found");
			return null;
		}
		const picked = chooseTrack(
			tracks,
			args.preferredLanguages,
			defaultCaptionTrackIndex,
			defaultTranslationSourceTrackIndices,
		);
		if (!picked) {
			logError("no_captions", "no_suitable_track_found");
			return null;
		}
		const xml = await fetch(picked.url, {
			headers: { "Accept-Language": "en-US" },
		}).then((r) => {
			if (!r.ok) throw new Error(`yt_request_failed_${r.status}`);
			return r.text();
		});
		const segments = normalizeSegments(parseSegments(xml));
		if (!segments.length) {
			logError("no_captions", "no_segments_after_parsing");
			return null;
		}
		return segments;
	} catch (err) {
		const msg = err instanceof Error ? String(err.message) : "";
		if (msg.includes("yt_request_failed_") || msg === "ip_blocked")
			logError("network_error", msg);
		else if (
			msg === "video_unavailable" ||
			msg === "video_unplayable" ||
			msg === "age_restricted" ||
			msg === "request_blocked"
		)
			logError("inaccessible", msg);
		else logError("other_error", msg || "unexpected_error");
		return null;
	}
}

/**
 * Extracts the INNERTUBE_API_KEY from a YouTube watch page HTML content.
 * @param html The HTML string of the watch page.
 * @returns The API key string or null when not found.
 */
export function extractInnertubeApiKey(html: string) {
	const m = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
	return m ? m[1] : null;
}

/**
 * Calls the YouTube Innertube player endpoint and returns JSON.
 * @param apiKey The Innertube API key.
 * @param videoId The YouTube video ID.
 * @returns The parsed JSON response object.
 */
export async function fetchInnertubePlayer(apiKey: string, videoId: string) {
	const url = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json", "Accept-Language": "en-US" },
		body: JSON.stringify({
			context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
			videoId,
		}),
	});
	if (res.status === 429) throw new Error("ip_blocked");
	if (!res.ok) throw new Error(`yt_request_failed_${res.status}`);
	return res.json();
}

/**
 * @typedef {object} TranscriptSegment
 * @property {string} text The caption text content.
 * @property {number} startInMs Segment start time in milliseconds.
 * @property {number} duration Segment duration in milliseconds.
 */
export interface TranscriptSegment {
	text: string;
	startInMs: number;
	duration: number;
}

/**
 * Normalizes, deduplicates and sorts segments by start time.
 * @param {TranscriptSegment[]} items The raw segments list.
 * @returns {TranscriptSegment[]} Cleaned segment list.
 */
export function normalizeSegments(items: TranscriptSegment[]) {
	const seen = new Set<string>();
	const cleaned = items
		.filter((s) => s && typeof s.text === "string")
		.map((s) => ({
			text: s.text.trim(),
			startInMs: s.startInMs,
			duration: s.duration,
		}))
		.filter((s) => s.text.length > 0);
	const dedup = cleaned.filter((s) => {
		const k = `${s.startInMs}|${s.text}`;
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
	return dedup.sort((a, b) => a.startInMs - b.startInMs);
}

/**
 * Parses YouTube caption XML into normalized segments.
 * Supports <transcript><text> and <timedtext><body><p> formats.
 * @param {string} xml The caption XML content.
 * @returns {TranscriptSegment[]} The list of normalized segments.
 */
export function parseSegments(xml: string) {
	const t1 = parseTranscriptTexts(xml);
	if (t1.length) return t1;
	return parseTimedtext(xml);
}

/**
 * Parses the <transcript><text> format.
 * @param {string} xml The XML content.
 * @returns {TranscriptSegment[]} Segments list.
 */
export function parseTranscriptTexts(xml: string) {
	const segments = [];
	const textMatches = xml.matchAll(
		/<text[^>]*start="([^"]+)"[^>]*dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g,
	);
	for (const match of textMatches) {
		const text = decodeHtml(String(match[3] || "")).trim();
		if (text) {
			const startMs = Math.round(Number(match[1] || 0) * 1000);
			const durationMs = Math.round(Number(match[2] || 0) * 1000);
			segments.push({ text, startInMs: startMs, duration: durationMs });
		}
	}
	return segments;
}

/**
 * Parses the <timedtext><body><p> format.
 * @param {string} xml The XML content.
 * @returns {TranscriptSegment[]} Segments list.
 */
export function parseTimedtext(xml: string) {
	const segments = [];
	const paragraphMatches = xml.matchAll(
		/<p[^>]*\bt="(\d+)"[^>]*\bd="(\d+)"[^>]*>([\s\S]*?)<\/p>/g,
	);
	for (const match of paragraphMatches) {
		const start = Number(match[1] || 0);
		const duration = Number(match[2] || 0);
		const inner = String(match[3] || "");
		const text = decodeHtml(inner.replace(/<[^>]+>/g, "")).trim();
		if (text) {
			segments.push({ text, startInMs: start, duration });
		}
	}
	return segments;
}

/**
 * Decodes a subset of HTML entities found in captions.
 * @param {string} s Input string.
 * @returns {string} Decoded string.
 */
export function decodeHtml(s: string) {
	return s
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

interface CaptionTrack {
	kind: string;
	languageCode: string;
	baseUrl: string;
}

/**
 * Chooses the most suitable caption track based on preferences and defaults.
 * @param tracks The available caption tracks from player response.
 * @param preferredLanguages Optional preferred languages.
 * @param defaultCaptionTrackIndex Optional default caption track index.
 * @param defaultTranslationSourceTrackIndices Optional default translation source indices.
 * @returns An object with url and lang, or null when none found.
 */
export function chooseTrack(
	tracks: CaptionTrack[],
	preferredLanguages?: string[],
	defaultCaptionTrackIndex?: number,
	defaultTranslationSourceTrackIndices?: number[],
) {
	const manual = tracks.filter((t) => t.kind !== "asr" && t.baseUrl);
	const asr = tracks.filter((t) => t.kind === "asr" && t.baseUrl);
	const prefs = (preferredLanguages || []).map((x) => x.toLowerCase());
	const scan = (list: CaptionTrack[]) => {
		for (const lang of prefs) {
			const t = list.find(
				(x) =>
					x.languageCode === lang ||
					String(x.languageCode || "")
						.toLowerCase()
						.startsWith(lang),
			);
			if (t) return t;
		}
		return undefined;
	};
	const direct = scan(manual) || scan(asr);
	if (direct)
		return {
			url: String(direct.baseUrl).replace("&fmt=srv3", ""),
			lang: direct.languageCode,
		};
	if (
		typeof defaultCaptionTrackIndex === "number" &&
		tracks[defaultCaptionTrackIndex]?.baseUrl
	) {
		const t = tracks[defaultCaptionTrackIndex];
		return {
			url: String(t.baseUrl).replace("&fmt=srv3", ""),
			lang: t.languageCode,
		};
	}
	if (Array.isArray(defaultTranslationSourceTrackIndices)) {
		for (const idx of defaultTranslationSourceTrackIndices) {
			if (tracks[idx]?.baseUrl) {
				const t = tracks[idx];
				return {
					url: String(t.baseUrl).replace("&fmt=srv3", ""),
					lang: t.languageCode,
				};
			}
		}
	}
	if (manual[0])
		return {
			url: String(manual[0].baseUrl).replace("&fmt=srv3", ""),
			lang: manual[0].languageCode,
		};
	if (asr[0])
		return {
			url: String(asr[0].baseUrl).replace("&fmt=srv3", ""),
			lang: asr[0].languageCode,
		};
	return null;
}

interface PlayabilityStatus {
	status: string;
	reason?: string;
}
/**
 * Validates the playability status extracted from the YouTube player response.
 * @param playabilityStatus The playabilityStatus object from player response.
 * @returns Void when OK; throws for known unplayable states.
 */
export function assertPlayability(playabilityStatus: PlayabilityStatus) {
	const status = playabilityStatus?.status;
	if (!status || status === "OK") return;
	const reason = playabilityStatus?.reason || "";
	if (status === "LOGIN_REQUIRED") {
		if (reason.includes("not a bot")) throw new Error("request_blocked");
		if (reason.includes("inappropriate")) throw new Error("age_restricted");
	}
	if (status === "ERROR" && reason.includes("unavailable"))
		throw new Error("video_unavailable");
	throw new Error("video_unplayable");
}

export const logError = (category: string, message: string) => {
	console.error(`[${category}] ${message}`);
};
