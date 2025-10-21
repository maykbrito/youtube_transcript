import type { APIRoute } from "astro";
import { transcriptYt, lastError } from "../../lib/fetch-youtube";

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const videoUrl = url.searchParams.get("videoUrl");

	if (!videoUrl) {
		return new Response(JSON.stringify({ message: "Video URL is required" }), {
			status: 400,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
	// Try to list caption tracks for the video
	const transcription = await transcriptYt({
		videoUrl,
		preferredLanguages: ["pt", "en"],
	});

	let textOnlyTranscription = "";
	for (const track of transcription || []) {
		textOnlyTranscription += ` ${track.text}`;
	}

	if (!textOnlyTranscription) {
		return new Response(
			JSON.stringify({
				message: "No transcript available.",
				reason: lastError?.message ?? null,
				category: lastError?.category ?? null,
			}),
			{
				status: 404,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}

	return new Response(
		JSON.stringify({ transcription: textOnlyTranscription }),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
};
