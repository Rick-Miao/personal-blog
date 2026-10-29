import type { RecordModel } from "pocketbase";
import { pb } from "../../lib/pocketbase";

export type CollectionRecord = RecordModel & {
	status: string;
	score: number;
	progress: number;
	comment: string;
	published: boolean;
	expand?: {
		work?: RecordModel & {
			title: string;
			cover_url: string;
		};
	};
};

// 用于区分不同的列表加载请求
let latestLoadId = 0;

// 退出登录时，让所有尚未完成的加载请求失效
export function invalidateManagedCollectionsLoad() {
	latestLoadId++;
}

export async function loadManagedCollections(
	onEdit: (record: CollectionRecord) => void,
) {
	const container = document.querySelector<HTMLElement>("#manage-list");
	const message = document.querySelector<HTMLElement>("#manage-list-message");

	if (!container || !message) return;

	// 每次加载生成新的请求序号
	const loadId = ++latestLoadId;

	if (!pb.authStore.isValid || !pb.authStore.record) {
		message.textContent = "请先登录管理账号。";
		container.replaceChildren();
		return;
	}

	// 记录开始加载时的登录会话
	const sessionToken = pb.authStore.token;

	// 只有当前会话的最新请求才允许更新界面
	const canRender = () =>
		loadId === latestLoadId &&
		pb.authStore.isValid &&
		pb.authStore.token === sessionToken;

	message.textContent = "正在读取收藏……";
	container.replaceChildren();

	try {
		const records = await pb
			.collection("collections")
			.getFullList<CollectionRecord>({
				expand: "work",
				requestKey: null,
			});

		// 防止退出后或旧请求返回时重新显示私人收藏
		if (!canRender()) return;

		message.textContent = `共 ${records.length} 条收藏`;

		for (const record of records) {
			const work = record.expand?.work;
			if (!work) continue;

			const card = document.createElement("div");
			card.className =
				"flex items-center gap-4 rounded-lg border border-[var(--line-divider)] p-3";

			const cover = document.createElement("img");
			cover.src = work.cover_url || "/favicon.svg";
			cover.alt = work.title;
			cover.className = "w-16 h-20 object-cover rounded";

			const info = document.createElement("div");
			info.className = "flex-1 min-w-0";

			const title = document.createElement("p");
			title.className = "font-bold";
			title.textContent = work.title;

			const details = document.createElement("p");
			details.className = "text-sm opacity-70";
			details.textContent = `${record.status} · ${record.score}/10 · 进度 ${record.progress}`;

			const visibility = document.createElement("p");
			visibility.className = "text-sm opacity-70";
			visibility.textContent = record.published ? "公开" : "私人";

			const editButton = document.createElement("button");
			editButton.type = "button";
			editButton.className = "btn-regular rounded-lg px-3 py-2";
			editButton.textContent = "编辑";

			editButton.addEventListener("click", () => {
				// 防止退出后旧卡片继续打开编辑器
				if (!canRender()) return;

				onEdit(record);
			});

			info.append(title, details, visibility);
			card.append(cover, info, editButton);
			container.appendChild(card);
		}
	} catch (error) {
		// 过期请求不显示错误
		if (!canRender()) return;

		console.error("[Manage Collections]", error);
		message.textContent = "读取收藏失败，请查看 Console。";
	}
}

export function initializeManageList(
	onEdit: (record: CollectionRecord) => void,
) {
	const button = document.querySelector<HTMLButtonElement>(
		"#refresh-collections",
	);

	if (!button || button.dataset.initialized === "true") return;

	button.dataset.initialized = "true";

	button.addEventListener("click", () => {
		void loadManagedCollections(onEdit);
	});

	if (pb.authStore.isValid && pb.authStore.record) {
		void loadManagedCollections(onEdit);
	}
}
