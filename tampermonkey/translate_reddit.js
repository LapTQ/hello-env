// ==UserScript==
// @name         Reddit Custom Translator (Auto Retry Errors)
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Dịch Reddit theo batch, có UI config, tự động dịch lại các đoạn lỗi mạng hoặc chưa load.
// @match        *://*.reddit.com/*
// @match        *://sh.reddit.com/*
// @grant        GM_xmlhttpRequest
// @connect      openrouter.ai
// @connect      translate.googleapis.com
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 1. TẦNG DOMAIN & INTERFACE
    // ==========================================
    class ITranslator {
        async translateBatch(texts, previousContext = "") {
            throw new Error("Method 'translateBatch()' must be implemented.");
        }
    }

    // ==========================================
    // 2. TẦNG INFRASTRUCTURE
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
        constructor(apiUrl, apiKey, modelName) {
            super();
            this.apiUrl = apiUrl;
            this.apiKey = apiKey;
            this.modelName = modelName;
        }

        async translateBatch(texts, previousContext = "") {
            if (!texts || texts.length === 0) return { translations: [], summary: "" };

            let systemPrompt = `Dịch nội dung từ bài post/comment trên Reddit sau sang Tiếng Việt. Không dịch chay word-by-word hay sentence-by-sentence, rất không được tự nhiên. Diễn đạt lại cho trôi chảy như tiếng Việt tự nhiên, súc tích hơn, cô đọng hơn, và lược bỏ những từ/câu/ý nào lủng củng, rườm rà, dài dòng với người Việt. Thuật ngữ cứ để tiếng Anh.
CRITICAL: You must return the output STRICTLY as a valid JSON object. This object MUST contain two keys:
1. "translations": an array of strings, matching the exact order and size of the input array.
2. "summary": a short string summarizing the overall context of what you just translated (to be used as context for the next batch).
Do not include markdown code blocks.`;

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
                // CHỈ BỎ QUA NẾU ĐÃ DỊCH THÀNH CÔNG. Lấy cả thẻ chưa dịch và thẻ bị lỗi (error).
                if (el.dataset.translated !== "success" && el.innerText.trim().length > 1) {
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
                    const isError = translatedText.startsWith("[Lỗi");

                    // TÌM VÀ XÓA DÒNG BÁO LỖI CŨ (nếu đây là lượt retry)
                    const existingViNode = node.element.querySelector('.rd-translation-node');
                    if (existingViNode) {
                        node.element.removeChild(existingViNode);
                    }

                    const viNode = document.createElement('div');
                    viNode.className = 'rd-translation-node'; // Gắn class để dễ tracking/dọn dẹp
                    viNode.style.marginTop = '6px';
                    viNode.style.paddingLeft = '10px';
                    viNode.style.fontSize = '0.95em';
                    viNode.style.fontStyle = 'italic';
                    viNode.innerText = translatedText;

                    if (isError) {
                        // Thất bại: Gắn cờ error và tô màu đỏ cảnh báo
                        viNode.style.color = '#dc3545';
                        viNode.style.borderLeft = '2px solid #dc3545';
                        node.element.dataset.translated = "error";
                    } else {
                        // Thành công: Gắn cờ success và tô màu xanh ngọc
                        viNode.style.color = '#10b981';
                        viNode.style.borderLeft = '2px solid #10b981';
                        node.element.dataset.translated = "success";
                    }

                    node.element.appendChild(viNode);
                }
            });
        }
    }

    // ==========================================
    // 3. TẦNG QUẢN LÝ CẤU HÌNH & UI
    // ==========================================
    class ConfigStore {
        constructor(defaultConfig) {
            this.storageKey = 'reddit_translator_settings';
            this.defaultConfig = defaultConfig;
        }
        load() {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? { ...this.defaultConfig, ...JSON.parse(saved) } : this.defaultConfig;
        }
        save(config) {
            localStorage.setItem(this.storageKey, JSON.stringify(config));
        }
    }

    class ConfigUIManager {
        constructor(configStore, availableModels) {
            this.store = configStore;
            this.models = availableModels;
            this.renderUI();
            this.bindEvents();
        }

        renderUI() {
            const config = this.store.load();

            const floatContainer = document.createElement('div');
            floatContainer.id = 'rd-trans-float-container';
            floatContainer.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 9999; display: flex; gap: 10px;';

            const configBtn = document.createElement('button');
            configBtn.id = 'rd-trans-config-btn';
            configBtn.innerHTML = '⚙️ Cấu hình';
            configBtn.style.cssText = 'background: #ff4500; color: white; padding: 10px 15px; border: none; border-radius: 20px; cursor: pointer; font-family: sans-serif; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s;';
            configBtn.onmouseover = () => configBtn.style.transform = 'scale(1.05)';
            configBtn.onmouseout = () => configBtn.style.transform = 'scale(1)';

            const runBtn = document.createElement('button');
            runBtn.id = 'rd-trans-run-btn';
            runBtn.innerHTML = '🚀 Dịch ngay';
            runBtn.style.cssText = 'background: #10b981; color: white; padding: 10px 15px; border: none; border-radius: 20px; cursor: pointer; font-family: sans-serif; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: bold; transition: all 0.2s;';
            runBtn.onmouseover = () => runBtn.style.transform = 'scale(1.05)';
            runBtn.onmouseout = () => runBtn.style.transform = 'scale(1)';

            floatContainer.appendChild(configBtn);
            floatContainer.appendChild(runBtn);
            document.body.appendChild(floatContainer);

            const modalHtml = `
            <div id="rd-trans-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width: 320px; background: white; z-index: 10000; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); padding: 20px; font-family: sans-serif; color: #333;">
                <h3 style="margin-top:0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Cấu hình Dịch Reddit</h3>

                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">Công cụ dịch:</label>
                    <select id="rd-engine" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="LLM" ${config.engine === 'LLM' ? 'selected' : ''}>LLM (OpenRouter)</option>
                        <option value="Google" ${config.engine === 'Google' ? 'selected' : ''}>Google Translate</option>
                    </select>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">Chọn Model LLM:</label>
                    <select id="rd-model" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" ${config.engine === 'Google' ? 'disabled' : ''}>
                        ${this.models.map(m => `<option value="${m}" ${config.model === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">Số từ tối đa / mẻ:</label>
                    <input type="number" id="rd-batch" value="${config.maxWordsPerBatch}" min="100" max="2000" step="100" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>

                <div style="text-align: right;">
                    <button id="rd-cancel" style="padding: 8px 12px; border: none; background: #eee; border-radius: 4px; cursor: pointer; margin-right: 10px;">Đóng</button>
                    <button id="rd-save" style="padding: 8px 12px; border: none; background: #ff4500; color: white; border-radius: 4px; cursor: pointer;">Lưu cấu hình</button>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        bindEvents() {
            const configBtn = document.getElementById('rd-trans-config-btn');
            const modal = document.getElementById('rd-trans-modal');
            const engineSelect = document.getElementById('rd-engine');
            const modelSelect = document.getElementById('rd-model');
            const batchInput = document.getElementById('rd-batch');
            const saveBtn = document.getElementById('rd-save');
            const cancelBtn = document.getElementById('rd-cancel');

            configBtn.onclick = () => modal.style.display = 'block';
            cancelBtn.onclick = () => modal.style.display = 'none';

            engineSelect.onchange = (e) => {
                modelSelect.disabled = (e.target.value === 'Google');
            };

            saveBtn.onclick = () => {
                const newConfig = {
                    engine: engineSelect.value,
                    model: modelSelect.value,
                    maxWordsPerBatch: parseInt(batchInput.value, 10) || 600
                };
                this.store.save(newConfig);
                modal.style.display = 'none';
                console.log("✅ Đã cập nhật cấu hình dịch Reddit:", newConfig);
            };
        }
    }

    class TranslatorFactory {
        constructor(apiUrl, apiKey) {
            this.apiUrl = apiUrl;
            this.apiKey = apiKey;
        }

        create(config) {
            if (config.engine === 'Google') {
                return new GoogleBatchTranslator();
            } else {
                return new LLMBatchTranslator(this.apiUrl, this.apiKey, config.model);
            }
        }
    }

    // ==========================================
    // 4. TẦNG APPLICATION (Orchestrator)
    // ==========================================
    class TranslationApp {
        constructor(domManager, configStore, translatorFactory) {
            this.domManager = domManager;
            this.configStore = configStore;
            this.factory = translatorFactory;
        }

        chunkNodes(nodes, maxWords) {
            const chunks = [];
            let currentChunk = [];
            let currentWordCount = 0;

            for (let node of nodes) {
                const wordCount = node.originalText.split(/\s+/).length;
                if (currentWordCount + wordCount > maxWords && currentChunk.length > 0) {
                    chunks.push(currentChunk);
                    currentChunk = [];
                    currentWordCount = 0;
                }
                currentChunk.push(node);
                currentWordCount += wordCount;
            }

            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            return chunks;
        }

        async execute() {
            const config = this.configStore.load();
            const translator = this.factory.create(config);

            const nodes = this.domManager.extractPendingNodes();
            if (nodes.length === 0) {
                console.log("✅ Không có đoạn text mới hoặc lỗi nào cần dịch trên màn hình.");
                return;
            }

            const chunks = this.chunkNodes(nodes, config.maxWordsPerBatch);
            console.log(`⏳ Bắt đầu dịch bằng [${config.engine}]. Tổng cộng ${nodes.length} đoạn, chia làm ${chunks.length} mẻ.`);

            let rollingContext = "";

            for (let i = 0; i < chunks.length; i++) {
                const currentChunkNodes = chunks[i];
                console.log(`🔄 Đang dịch mẻ ${i + 1}/${chunks.length}... (Số đoạn: ${currentChunkNodes.length})`);

                const texts = currentChunkNodes.map(n => n.originalText);

                const result = await translator.translateBatch(texts, rollingContext);
                this.domManager.injectTranslations(currentChunkNodes, result.translations);

                rollingContext = result.summary;

                await new Promise(r => setTimeout(r, 1000));
            }

            console.log("✅ Đã dịch xong toàn bộ các mẻ trên màn hình!");
        }
    }

    // ==========================================
    // 5. BOOTSTRAP (Khởi tạo và chạy)
    // ==========================================

    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    const API_KEY = "Bearer YOUR_API_KEY";

    const AVAILABLE_MODELS = [
        "google/gemma-4-26b-a4b-it:free",
        "google/gemma-4-31b-it:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "nvidia/nemotron-nano-9b-v2:free",
        "openai/gpt-oss-20b:free",
    ];

    const DEFAULT_CONFIG = {
        engine: 'LLM',
        model: AVAILABLE_MODELS[0],
        maxWordsPerBatch: 600
    };

    const domManager = new RedditDOMManager();
    const configStore = new ConfigStore(DEFAULT_CONFIG);
    const uiManager = new ConfigUIManager(configStore, AVAILABLE_MODELS);
    const factory = new TranslatorFactory(API_URL, API_KEY);

    const app = new TranslationApp(domManager, configStore, factory);

    console.log("🚀 Đã load tool dịch Reddit (v4.2 - Tự động dịch lại lỗi)! Nhấn vào '🚀 Dịch ngay' để chạy.");

    document.getElementById('rd-trans-run-btn').addEventListener('click', () => {
        app.execute();
    });

    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyT') {
            e.preventDefault();
            app.execute();
        }
    });

})();
