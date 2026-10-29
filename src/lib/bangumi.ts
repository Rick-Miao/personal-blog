const BANGUMI_API = "https://api.bgm.tv/v0";

export async function searchBangumi(keyword: string, type: number) {
	const response = await fetch(`${BANGUMI_API}/search/subjects?limit=10`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			keyword: keyword.trim(),
			sort: "match",
			filter: {
				type: [type],
			},
		}),
	});

	if (!response.ok) {
		throw new Error(`Bangumi search failed: HTTP ${response.status}`);
	}

	return response.json();
}

export async function getBangumiSubject(id: number) {
	const response = await fetch(`${BANGUMI_API}/subjects/${id}`);

	if (!response.ok) {
		throw new Error(`Bangumi detail failed: HTTP ${response.status}`);
	}

	return response.json();
}
