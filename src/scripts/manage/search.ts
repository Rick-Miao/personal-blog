import { getBangumiSubject, searchBangumi } from "../../lib/bangumi";
import { setSelectedWork } from "./selected-work";

export function initializeSearch() {
	const form = document.querySelector<HTMLFormElement>("#search-form");
	const results = document.querySelector<HTMLElement>("#search-results");
	const message = document.querySelector<HTMLElement>("#search-message");

	if (!form || !results || !message || form.dataset.initialized === "true") {
		return;
	}

	form.dataset.initialized = "true";

	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		const keyword = form.querySelector<HTMLInputElement>("#search-keyword");
		const type = form.querySelector<HTMLSelectElement>("#search-type");

		if (!keyword || !type || !keyword.value.trim()) return;

		results.replaceChildren();
		message.textContent = "正在搜索……";

		try {
			const data = await searchBangumi(keyword.value, Number(type.value));

			message.textContent = `找到 ${data.data?.length ?? 0} 条结果（当前页）`;

			for (const work of data.data ?? []) {
				const card = document.createElement("div");
				card.className =
					"flex items-center gap-4 rounded-lg p-3 border border-[var(--line-divider)]";

				const img = document.createElement("img");
				img.src = work.images?.small || "/favicon.svg";
				img.alt = work.name_cn || work.name;
				img.className = "w-16 h-20 object-cover rounded";

				const info = document.createElement("div");

				const title = document.createElement("p");
				title.textContent = work.name_cn || work.name;
				title.className = "font-bold";

				const id = document.createElement("p");
				id.textContent = `Bangumi ID: ${work.id}`;
				id.className = "text-sm opacity-70";

				const selectButton = document.createElement("button");
				selectButton.type = "button";
				selectButton.textContent = "选择作品";
				selectButton.className = "btn-regular rounded-lg px-4 py-2 ml-auto";

				selectButton.addEventListener("click", async () => {
					message.textContent = "正在获取作品详情……";

					try {
						const details = await getBangumiSubject(work.id);
						setSelectedWork(details);

						const editor =
							document.querySelector<HTMLElement>("#collection-editor");
						const selectedTitle = document.querySelector<HTMLElement>(
							"#selected-work-title",
						);

						if (editor && selectedTitle) {
							editor.classList.remove("hidden");
							selectedTitle.textContent = details.name_cn || details.name;
						}

						message.textContent = `已选择：${details.name_cn || details.name}`;
					} catch (error) {
						console.error("[Bangumi Detail]", error);
						message.textContent = "获取作品详情失败。";
					}
				});

				info.append(title, id);
				card.append(img, info, selectButton);
				results.appendChild(card);
			}
		} catch (error) {
			console.error("[Bangumi Search]", error);
			message.textContent = "搜索请求失败，请查看 Console 错误。";
		}
	});
}
