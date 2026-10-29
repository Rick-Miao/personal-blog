const API_URL =
	"https://api.miaopz.top/api/collections/collections/records?expand=work&perPage=100";

type WorkType = "anime" | "novel";

interface Work {
	title: string;
	type: WorkType;
	cover_url?: string;
}

interface CollectionRecord {
	id: string;
	status: string;
	score: number;
	expand?: {
		work?: Work;
	};
}

interface CollectionResponse {
	items: CollectionRecord[];
}

const initialized = new WeakSet<Element>();

const labels: Record<WorkType, Record<string, string>> = {
	anime: {
		wish: "想看",
		in_progress: "在看",
		completed: "已看完",
		on_hold: "搁置",
		dropped: "弃番",
	},
	novel: {
		wish: "想读",
		in_progress: "在读",
		completed: "已读完",
		on_hold: "搁置",
		dropped: "弃读",
	},
};

async function loadCollectionWall(): Promise<void> {
	const animeContainer = document.querySelector("#anime-list");
	const bookContainer = document.querySelector("#book-list");

	const container = animeContainer ?? bookContainer;

	if (!container || initialized.has(container)) {
		return;
	}

	const type: WorkType = animeContainer ? "anime" : "novel";
	const prefix = type === "anime" ? "anime" : "book";

	initialized.add(container);

	console.log(`[CollectionWall] Loading ${type}`);

	try {
		const response = await fetch(API_URL);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data: CollectionResponse = await response.json();

		const records = data.items.filter(
			(item) => item.expand?.work?.type === type,
		);

		// 防止页面已经切换后更新旧 DOM
		if (!container.isConnected) {
			return;
		}

		container.replaceChildren();

		if (records.length === 0) {
			container.textContent =
				type === "anime"
					? "暂时没有公开的番剧收藏。"
					: "暂时没有公开的小说收藏。";
			return;
		}

		for (const item of records) {
			const work = item.expand?.work;
			if (!work) continue;

			const card = document.createElement("article");
			card.className = `${prefix}-card`;

			const cover = document.createElement("img");
			cover.className = `${prefix}-cover`;
			cover.src = work.cover_url || "/favicon.svg";
			cover.alt = work.title;
			cover.loading = "lazy";

			const title = document.createElement("h2");
			title.className = `${prefix}-title`;
			title.textContent = work.title;

			const status = document.createElement("p");
			status.className = `${prefix}-status`;
			status.textContent = labels[type][item.status] ?? item.status;

			const score = document.createElement("p");
			score.className = `${prefix}-score`;
			score.textContent = item.score ? `★ ${item.score}/10` : "暂无评分";

			card.append(cover, title, status, score);
			container.appendChild(card);
		}

		console.log(`[CollectionWall] Loaded ${records.length} ${type} records`);
	} catch (error) {
		console.error("[CollectionWall] Failed:", error);

		if (container.isConnected) {
			container.textContent = "收藏加载失败，请检查 API。";
		}

		// 允许下次重新初始化
		initialized.delete(container);
	}
}

// Astro 客户端导航完成后初始化
document.addEventListener("astro:page-load", loadCollectionWall);

// 首次执行脚本时初始化
void loadCollectionWall();
