// ==UserScript==
// @name         Reddit Batch Translator (Clean Arch & Chunking)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Dịch Reddit theo batch, chia nhỏ chunk theo số từ, có summary rolling để giữ ngữ cảnh.
// @match        *://*.reddit.com/*
// @match        *://sh.reddit.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 1. TẦNG DOMAIN & INTERFACE (Trừu tượng)
    // ==========================================

    class ITranslator {
        // Thay đổi signature: Nhận thêm previousContext và trả về { translations: [], summary: "" }
        async translateBatch(texts, previousContext = "") {
            throw new Error("Method 'translateBatch()' must be implemented.");
        }
    }

    // ==========================================
    // 2. TẦNG INFRASTRUCTURE (Implementations)
    // ==========================================

    class GoogleBatchTranslator extends ITranslator {
        async translateBatch(texts, previousContext = "") {
            if (!texts || texts.length === 0) return { translations: [], summary: "" };

            const separator = '\n\n|||\n\n';
            const joinedText = texts.join(separator);

            return new Promise((resolve) => {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t`;
                const data = "q=" + encodeURIComponent(joinedText);

                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                    },
                    data: data,
                    onload: function(res) {
                        if (res.status === 200) {
                            try {
                                const parsed = JSON.parse(res.responseText);
                                let fullTranslation = "";
                                parsed[0].forEach(item => {
                                    if (item[0]) fullTranslation += item[0];
                                });
                                const translatedArray = fullTranslation.split(/\|\|\|/).map(t => t.trim());

                                // Google Translate không sinh được tóm tắt, nên trả về mảng và summary rỗng
                                resolve({ translations: translatedArray, summary: "" });
                            } catch (e) {
                                console.error("Lỗi parse JSON:", e);
                                resolve({ translations: texts.map(() => "[Lỗi parse dữ liệu dịch]"), summary: "" });
                            }
                        } else {
                            resolve({ translations: texts.map(() => "[Lỗi mạng / Rate Limit]"), summary: "" });
                        }
                    },
                    onerror: function(err) {
                        console.error("Lỗi kết nối:", err);
                        resolve({ translations: texts.map(() => "[Lỗi kết nối API]"), summary: "" });
                    }
                });
            });
        }
    }

    class LLMBatchTranslator extends ITranslator {
	// Nhận config từ bên ngoài truyền vào
        constructor(apiUrl, apiKey, modelName) {
            super();
            this.apiUrl = apiUrl;
            this.apiKey = apiKey;
            this.modelName = modelName;
        }

        async translateBatch(texts, previousContext = "") {
            if (!texts || texts.length === 0) return { translations: [], summary: "" };

            // Bổ sung yêu cầu tạo tóm tắt vào Prompt
            let systemPrompt = `Dịch nội dung từ bài post/comment trên Reddit sau sang Tiếng Việt. Lưu ý là việc dịch chay word-by-word có thể không được tự nhiên, nên hãy dịch theo văn phong hoặc cách nói của người Việt. Nếu thấy chỗ nào lủng củng, rườm rà, dài dòng với người Việt, thì hãy viết lại sao cho dễ hiểu hơn. Thuật ngữ cứ để tiếng Anh.
CRITICAL: You must return the output STRICTLY as a valid JSON object. This object MUST contain two keys:
1. "translations": an array of strings, matching the exact order and size of the input array.
2. "summary": a short string summarizing the overall context of what you just translated (to be used as context for the next batch).
Do not include markdown code blocks.`;

            // Nếu có ngữ cảnh từ mẻ trước, bơm vào cho AI hiểu đầu đuôi
            if (previousContext) {
                systemPrompt += `\n\nNgữ cảnh từ phần trước của bài viết (để bạn hiểu liền mạch câu chuyện): "${previousContext}"`;
            }

            const payload = {
                model: this.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: JSON.stringify(texts) }
                ],
                response_format: { type: "json_object" }
            };

            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: this.apiUrl,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": this.apiKey
                    },
                    data: JSON.stringify(payload),
                    onload: function(res) {
                        if (res.status === 200) {
                            try {
                                const responseData = JSON.parse(res.responseText);
                                const contentText = responseData.choices[0].message.content;

                                const parsedObject = JSON.parse(contentText);
                                const finalArray = parsedObject.translations || texts.map(() => "[Thiếu key translations]");
                                const newSummary = parsedObject.summary || "";

                                resolve({ translations: finalArray, summary: newSummary });
                            } catch (e) {
                                console.error("Lỗi parse JSON từ LLM:", e, res.responseText);
                                resolve({ translations: texts.map(() => "[Lỗi format LLM JSON]"), summary: previousContext });
                            }
                        } else {
                            console.error("LLM API Error:", res.status, res.responseText);
                            resolve({ translations: texts.map(() => "[Lỗi API trả về]"), summary: previousContext });
                        }
                    },
                    onerror: function(err) {
                        console.error("Lỗi mạng LLM:", err);
                        resolve({ translations: texts.map(() => "[Lỗi mạng]"), summary: previousContext });
                    }
                });
            });
        }
    }

    class RedditDOMManager {
        constructor() {
            this.selectors = 'h1, shreddit-post p, shreddit-comment p, div[slot="text-body"] p, .md p';
        }

        extractPendingNodes() {
            const elements = document.querySelectorAll(this.selectors);
            const nodes = [];
            for (let el of elements) {
                if (!el.dataset.translated && el.innerText.trim().length > 1) {
                    nodes.push({
                        element: el,
                        originalText: el.innerText.trim()
                    });
                }
            }
            return nodes;
        }

        injectTranslations(nodes, translatedTexts) {
            nodes.forEach((node, index) => {
                const translatedText = translatedTexts[index];
                if (translatedText && translatedText.length > 0) {
                    const viNode = document.createElement('div');
                    viNode.style.color = '#10b981';
                    viNode.style.marginTop = '6px';
                    viNode.style.paddingLeft = '10px';
                    viNode.style.borderLeft = '2px solid #10b981';
                    viNode.style.fontSize = '0.95em';
                    viNode.style.fontStyle = 'italic';
                    viNode.innerText = translatedText;

                    node.element.dataset.translated = "true";
                    node.element.appendChild(viNode);
                }
            });
        }
    }

    // ==========================================
    // 3. TẦNG APPLICATION (Orchestrator)
    // ==========================================

    class TranslationApp {
        constructor(domManager, translator, maxWordsPerBatch = 600) {
            this.domManager = domManager;
            this.translator = translator;
            this.maxWordsPerBatch = maxWordsPerBatch; // Giới hạn số từ mỗi mẻ
        }

        // Hàm hỗ trợ chia mảng nodes thành các chunk dựa trên số lượng từ
        chunkNodes(nodes) {
            const chunks = [];
            let currentChunk = [];
            let currentWordCount = 0;

            for (let node of nodes) {
                // Đếm nhẩm số từ (tách bằng space)
                const wordCount = node.originalText.split(/\s+/).length;

                // Nếu vượt quá giới hạn và chunk hiện tại đã có data -> Đóng mẻ hiện tại lại
                if (currentWordCount + wordCount > this.maxWordsPerBatch && currentChunk.length > 0) {
                    chunks.push(currentChunk);
                    currentChunk = [];
                    currentWordCount = 0;
                }

                currentChunk.push(node);
                currentWordCount += wordCount;
            }

            // Đẩy mẻ cuối cùng vào
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }

            return chunks;
        }

        async execute() {
            const nodes = this.domManager.extractPendingNodes();
            if (nodes.length === 0) {
                console.log("✅ Không có đoạn text mới nào cần dịch trên màn hình.");
                return;
            }

            // Chia các nodes ra thành từng mẻ
            const chunks = this.chunkNodes(nodes);
            console.log(`⏳ Bắt đầu dịch. Tổng cộng ${nodes.length} đoạn, chia làm ${chunks.length} mẻ.`);

            let rollingContext = "";

            // Xử lý tuần tự từng mẻ
            for (let i = 0; i < chunks.length; i++) {
                const currentChunkNodes = chunks[i];
                console.log(`🔄 Đang dịch mẻ ${i + 1}/${chunks.length}... (Số đoạn: ${currentChunkNodes.length})`);

                const texts = currentChunkNodes.map(n => n.originalText);

                // Gọi AI dịch và truyền ngữ cảnh từ mẻ trước
                const result = await this.translator.translateBatch(texts, rollingContext);

                // Dịch xong mẻ nào là nhét luôn vào DOM mẻ đấy để người dùng không phải chờ lâu
                this.domManager.injectTranslations(currentChunkNodes, result.translations);

                // Cập nhật ngữ cảnh cho mẻ tiếp theo
                rollingContext = result.summary;

                // Delay một chút giữa các batch để tránh bị API rate limit
                await new Promise(r => setTimeout(r, 1000));
            }

            console.log("✅ Đã dịch xong toàn bộ các mẻ trên màn hình!");
        }
    }

    // ==========================================
    // 4. BOOTSTRAP (Khởi tạo và chạy)
    // ==========================================

    const domManager = new RedditDOMManager();

    const translatorService = new LLMBatchTranslator(
        "https://openrouter.ai/api/v1/chat/completions", 
        "Bearer YOUR_API_KEY", 
        "google/gemma-4-26b-a4b-it:free"
    );
    // const translatorService = new GoogleBatchTranslator();

    // Khởi tạo App, set giới hạn mỗi batch khoảng 600 từ (có thể chỉnh lại tuỳ LLM)
    const app = new TranslationApp(domManager, translatorService, 600);

    console.log("🚀 Đã load tool dịch Reddit (v3.0 - Có chia nhỏ & Summary)! Bấm Option + T (trên Mac) để chạy.");

    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyT') {
            app.execute();
        }
    });

})();
