export default class extends Extension {
    constructor() {
        this.host = "https://banlong.vip";
    }

    async search(key, page) {
        if (!page) page = '1';
        let response = await fetch(this.host + "/tim-kiem?q=" + key.replace(" ", "+") + "&page=" + page);
        if (response.ok) {
            let doc = await response.html();

            let nextPage = /page=(\d+)/.exec(doc.select(".next-page").first().attr("href"));
            if (nextPage) nextPage = nextPage[1];
            else nextPage = "";

            let books = [];
            doc.select(".basis-full").select(".novel-item").forEach(e => {
                let type = e.select("a[href^=danh-muc]").text();
                if (type) {
                    type = "[" + type + "] ";
                }
                books.push({
                    name: type + e.select("h3").text(),
                    href: this.host + e.select("a").first().attr("href"),
                    img: e.select("img").first().attr("src"),
                    desc: e.select(".author ").text() + "<br>" + e.select(".story-info").text(),
                });
            });

            return Response.success(books, nextPage);
        }
    }

    async tab(url, page) {
        if (!page) page = '1';
        let response = await fetch(url + "?page=" + page);
        if (response.ok) {
            let doc = await response.html();
            let nextPage = /page=(\d+)/.exec(doc.select(".next-page").first().attr("href"));
            if (nextPage) nextPage = nextPage[1];
            else nextPage = "";

            let books = [];
            doc.select(".basis-full").first().select(".novel-item").forEach(e => {
                let type = e.select("a[href^=danh-muc]").text();
                if (type) {
                    type = "[" + type + "] ";
                }
                books.push({
                    name: type + e.select("h3").text(),
                    href: this.host + e.select("a").first().attr("href"),
                    img: e.select("img").first().attr("src"),
                    desc: e.select(".author ").text() + " - " + e.select(".story-info").text(),
                });
            });

            return Response.success(books, nextPage);
        }
        return null;
    }

    async home() {
        return Response.success([
            {name: "Top linh phiếu", href: this.host + "/top-linh-phieu-tuan", script: "tab"},
            {name: "Mới nhất", href: this.host + "/truyen-moi-nhat", script: "tab"},
            {name: "Mới cập nhật", href: this.host + "/chuong-moi-cap-nhat", script: "tab"},
            {name: "Top yêu thích", href: this.host + "/truyen-yeu-thich", script: "tab"},
            {name: "Truyện hot", href: this.host + "/truyen-hot", script: "tab"},
            {name: "Thịnh hành tuần", href: this.host + "/truyen-thinh-hanh-trong-tuan", script: "tab"},
            {name: "Hoàn thành", href: this.host + "/truyen-hoan-thanh", script: "tab"}
        ]);
    }

    async genres() {
        let response = await fetch(this.host);
        if (response.ok) {
            let genres = [];
            let doc = await response.html();
            let elements = doc.select(".modal-story-genre li a");
            doc.select(".modal-story-genre li a").forEach(e => {
                genres.push({
                    name: e.text(),
                    href: this.host + "/" + e.attr("href"),
                    script: 'tab'
                });
            });
            return Response.success(genres);
        }
        return null;
    }

    async detail(url) {
        let response = await fetch(url);
        if (response.ok) {
            let doc = await response.html();
            let info = doc.select(".info-story");
            let genres = [];
            info.select("a[href^=the-loai]").forEach(e => {
                genres.push({
                    name: e.attr("title"),
                    href: this.host + "/" + e.attr("href"),
                    script: "tab"
                });
            });
            // Tìm _NX_STORY_ID trong các <script>
            let storyId = null;
            doc.select("script").forEach(s => {
                const m = (s.text() || "").match(/_NX_STORY_ID\s*=\s*'(\d+)'/);
                if (m) storyId = m[1];
            });
            const apiHost = this.host.replace(/^https?:\/\//, match => `${match}api.`);
            return Response.success({
                name: info.select("h1").text().replace(/\s{2,}/gm, " "),
                img: doc.select(".image-story img").attr("src"),
                author: info.select("a[href^=tac-gia]").text(),
                description: doc.select("#tab-info-1 .s-content").html(),
                genres: genres,
                detail: info.select(".story-info").html(),
                ongoing: !info.text().includes("Đã hoàn thành"),
                tocUrl: `${apiHost}/v1/story/${storyId}/chapter_list`,
            });
        }
        return null;
    }

    async toc(url) {
        let chapters = [];
        let page = 1;
        let totalPage = 1;

        try {
            while (totalPage >= page) {
                const pageUrl = `${url}?page=${page}&new=0`;
                const response = await fetch(pageUrl);

                if (!response.ok) {
                    return Response.error("Không thể lấy dữ liệu từ API: " + response.statusText);
                }

                let json = await response.json();
                if (!json || (!json.success)) {
                    return Response.error("API response không hợp lệ: " + JSON.stringify(json));
                }

                if (!json.data || !Array.isArray(json.data)) {
                   return Response.error("Dữ liệu chapters không tồn tại hoặc không đúng định dạng. Data: " + JSON.stringify(json.data));
                }

                json.data.forEach(e => {
                   chapters.push({
                       name: e.name,
                       href: `${this.host}${e.url}`,
                       pay: e.is_vip || false,
                   });
                });

                totalPage = json.total_page;
                page += 1;
            }

            return Response.success(chapters);
        } catch (error) {
            return Response.error("Lỗi khi xử lý dữ liệu: " + error.message);
        }
    }

    async chapter(url) {

        let response = await fetch(url);
        if (response.ok) {
            let doc = await response.html();
            if (doc.select("#chapter-content .content-lock").text().length > 10) {
                return Response.error("Bạn cần trả phí chương này để có thể đọc.")
            }

            return Response.success(doc.select("#chapter-content .s-content").html());
        }
        return null;
    }
}
