// ==UserScript==
// @name         Chatwork Custom Translator (UI Config, Factory & Toggle)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Dịch Chatwork có UI config chọn engine, model, và số lượng tin nhắn.
// @match        *://www.chatwork.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 1. TẦNG DOMAIN & INTERFACE
    // ==========================================
    class ITranslator {
        async translateBatch(texts) {
            throw new Error("Method 'translateBatch()' must be implemented.");
        }
    }

    // ==========================================
    // 2. TẦNG INFRASTRUCTURE (Core Dịch thuật & DOM)
    // ==========================================
    class GoogleBatchTranslator extends ITranslator {
        async translateBatch(texts) {
            if (!texts || texts.length === 0) return { translations: [] };
            const separator = '\n\n|||\n\n';
            const joinedText = texts.join(separator);

            return new Promise((resolve) => {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t`;
                const data = "q=" + encodeURIComponent(joinedText);

                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
                    data: data,
                    onload: function(res) {
                        if (res.status === 200) {
                            try {
                                const parsed = JSON.parse(res.responseText);
                                let fullTranslation = "";
                                parsed[0].forEach(item => { if (item[0]) fullTranslation += item[0]; });
                                const translatedArray = fullTranslation.split(/\|\|\|/).map(t => t.trim());
                                resolve({ translations: translatedArray });
                            } catch (e) {
                                resolve({ translations: texts.map(() => "[Lỗi parse dữ liệu dịch]") });
                            }
                        } else {
                            resolve({ translations: texts.map(() => "[Lỗi mạng / Rate Limit]") });
                        }
                    },
                    onerror: () => resolve({ translations: texts.map(() => "[Lỗi kết nối API]") })
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

        async translateBatch(texts) {
            if (!texts || texts.length === 0) return { translations: [] };

            const systemPrompt = `Dịch nội dung từ các tin nhắn Chatwork sau sang Tiếng Việt. Lưu ý là việc dịch chay word-by-word có thể không được tự nhiên, nên hãy dịch theo văn phong hoặc cách nói của người Việt. Nếu thấy chỗ nào lủng củng, rườm rà, dài dòng với người Việt, thì hãy viết lại sao cho dễ hiểu hơn. Thuật ngữ cứ để tiếng Anh.
CRITICAL: You must return the output STRICTLY as a valid JSON object. This object MUST contain a single key:
"translations": an array of strings, matching the exact order and size of the input array. Do not include markdown code blocks.`;

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
                                resolve({ translations: finalArray });
                            } catch (e) {
                                resolve({ translations: texts.map(() => "[Lỗi format LLM JSON]") });
                            }
                        } else {
                            resolve({ translations: texts.map(() => `[Lỗi API: ${res.status}]`) });
                        }
                    },
                    onerror: () => resolve({ translations: texts.map(() => "[Lỗi mạng]") })
                });
            });
        }
    }

    class ChatworkDOMManager {
        constructor() {
            this.selectors = 'div[data-rid] pre, pre._msgArea, .chatTimeLineMessageArea pre';
            this.startToggleRenderLoop();
        }

        startToggleRenderLoop() {
            setInterval(() => {
                const elements = document.querySelectorAll(this.selectors);
                for (let el of elements) {
                    if (el.dataset.translated === "success" || el.innerText.trim().length <= 1 || el.dataset.hasToggle === "true") {
                        continue;
                    }

                    el.dataset.hasToggle = "true";
                    el.dataset.cwIgnore = "false";

                    const btn = document.createElement('button');
                    btn.className = 'cw-toggle-btn';
                    btn.innerHTML = '🔵 Sẽ dịch';
                    btn.style.cssText = 'font-size: 11px; cursor: pointer; border: 1px solid #0056b3; border-radius: 4px; background: #e6f2ff; color: #0056b3; padding: 2px 6px; margin-bottom: 4px; display: inline-block; font-family: sans-serif; transition: all 0.2s;';

                    btn.onclick = (e) => {
                        e.preventDefault();
                        if (el.dataset.cwIgnore === "true") {
                            el.dataset.cwIgnore = "false";
                            btn.innerHTML = '🔵 Sẽ dịch';
                            btn.style.background = '#e6f2ff';
                            btn.style.color = '#0056b3';
                            btn.style.borderColor = '#0056b3';
                            el.style.opacity = '1';
                        } else {
                            el.dataset.cwIgnore = "true";
                            btn.innerHTML = '⚪ Đã bỏ qua';
                            btn.style.background = '#f1f1f1';
                            btn.style.color = '#888';
                            btn.style.borderColor = '#ccc';
                            el.style.opacity = '0.5';
                        }
                    };

                    el.parentNode.insertBefore(btn, el);
                }
            }, 1500);
        }

        extractPendingNodes() {
            const elements = document.querySelectorAll(this.selectors);
            const nodes = [];
            for (let el of elements) {
                if (el.dataset.translated !== "success" && el.dataset.cwIgnore !== "true" && el.innerText.trim().length > 1) {
                    nodes.push({ element: el, originalText: el.innerText.trim() });
                }
            }
            return nodes;
        }

        injectTranslations(nodes, translatedTexts) {
            nodes.forEach((node, index) => {
                const translatedText = translatedTexts[index];
                if (translatedText && translatedText.length > 0) {
                    const isError = translatedText.startsWith("[Lỗi");

                    const nextEl = node.element.nextSibling;
                    if (nextEl && nextEl.classList && nextEl.classList.contains('cw-translation-node')) {
                        node.element.parentNode.removeChild(nextEl);
                    }

                    const viNode = document.createElement('div');
                    viNode.className = 'cw-translation-node';
                    viNode.style.cssText = 'margin-top: 8px; padding: 8px; border-radius: 4px; font-size: 0.95em; font-style: italic; white-space: pre-wrap;';
                    viNode.innerText = translatedText;

                    if (isError) {
                        viNode.style.color = '#dc3545';
                        viNode.style.backgroundColor = '#f8d7da';
                        viNode.style.borderLeft = '3px solid #dc3545';
                        node.element.dataset.translated = "error";
                    } else {
                        viNode.style.color = '#0056b3';
                        viNode.style.backgroundColor = '#f0f8ff';
                        viNode.style.borderLeft = '3px solid #0056b3';
                        node.element.dataset.translated = "success";

                        const prevEl = node.element.previousElementSibling;
                        if (prevEl && prevEl.classList.contains('cw-toggle-btn')) prevEl.remove();
                    }

                    node.element.parentNode.insertBefore(viNode, node.element.nextSibling);
                }
            });
        }
    }

    // ==========================================
    // 3. TẦNG QUẢN LÝ CẤU HÌNH & UI (Mới bổ sung)
    // ==========================================
    class ConfigStore {
        constructor(defaultConfig) {
            this.storageKey = 'cw_translator_settings';
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

            // Vẽ nút Float mở cài đặt
            const floatBtn = document.createElement('div');
            floatBtn.id = 'cw-trans-float-btn';
            floatBtn.innerHTML = '⚙️ Dịch';
            floatBtn.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 9999; background: #333; color: white; padding: 10px 15px; border-radius: 20px; cursor: pointer; font-family: sans-serif; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
            document.body.appendChild(floatBtn);

            // Vẽ Modal Setting
            const modalHtml = `
            <div id="cw-trans-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width: 320px; background: white; z-index: 10000; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); padding: 20px; font-family: sans-serif; color: #333;">
                <h3 style="margin-top:0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Cấu hình Dịch thuật</h3>

                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">Công cụ dịch:</label>
                    <select id="cw-engine" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="LLM" ${config.engine === 'LLM' ? 'selected' : ''}>LLM (OpenRouter)</option>
                        <option value="Google" ${config.engine === 'Google' ? 'selected' : ''}>Google Translate</option>
                    </select>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">Chọn Model LLM:</label>
                    <select id="cw-model" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" ${config.engine === 'Google' ? 'disabled' : ''}>
                        ${this.models.map(m => `<option value="${m}" ${config.model === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">Số tin nhắn / lượt bấm:</label>
                    <input type="number" id="cw-batch" value="${config.batchSize}" min="1" max="20" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>

                <div style="text-align: right;">
                    <button id="cw-cancel" style="padding: 8px 12px; border: none; background: #eee; border-radius: 4px; cursor: pointer; margin-right: 10px;">Đóng</button>
                    <button id="cw-save" style="padding: 8px 12px; border: none; background: #0056b3; color: white; border-radius: 4px; cursor: pointer;">Lưu cấu hình</button>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        bindEvents() {
            const btn = document.getElementById('cw-trans-float-btn');
            const modal = document.getElementById('cw-trans-modal');
            const engineSelect = document.getElementById('cw-engine');
            const modelSelect = document.getElementById('cw-model');
            const batchInput = document.getElementById('cw-batch');
            const saveBtn = document.getElementById('cw-save');
            const cancelBtn = document.getElementById('cw-cancel');

            // Mở modal
            btn.onclick = () => modal.style.display = 'block';

            // Tắt modal
            cancelBtn.onclick = () => modal.style.display = 'none';

            // Disable model dropdown nếu chọn Google
            engineSelect.onchange = (e) => {
                modelSelect.disabled = (e.target.value === 'Google');
            };

            // Lưu config
            saveBtn.onclick = () => {
                const newConfig = {
                    engine: engineSelect.value,
                    model: modelSelect.value,
                    batchSize: parseInt(batchInput.value, 10) || 5
                };
                this.store.save(newConfig);
                modal.style.display = 'none';
                console.log("✅ Đã cập nhật cấu hình dịch:", newConfig);
            };
        }
    }

    class TranslatorFactory {
        constructor(apiUrl, apiKey) {
            this.apiUrl = apiUrl;
            this.apiKey = apiKey;
        }

        // Đẻ ra tool dịch tuỳ theo config ở thời điểm hiện tại
        create(config) {
            if (config.engine === 'Google') {
                return new GoogleBatchTranslator();
            } else {
                return new LLMBatchTranslator(this.apiUrl, this.apiKey, config.model);
            }
        }
    }

    // ==========================================
    // 4. TẦNG APPLICATION
    // ==========================================
    class TranslationApp {
        constructor(domManager, configStore, translatorFactory) {
            this.domManager = domManager;
            this.configStore = configStore;
            this.factory = translatorFactory;
        }

        async execute() {
            // Load config nóng ngay lúc bấm phím
            const config = this.configStore.load();
            const translator = this.factory.create(config);

            const allPendingNodes = this.domManager.extractPendingNodes();
            if (allPendingNodes.length === 0) {
                console.log("✅ Không có tin nhắn mới nào cần dịch.");
                return;
            }

            // Slice mảng dựa vào config batchSize hiện tại
            const targetNodes = allPendingNodes.slice(-config.batchSize);

            console.log(`⏳ Đang dịch ${targetNodes.length} tin bằng [${config.engine}]...`);

            const texts = targetNodes.map(n => n.originalText);
            const result = await translator.translateBatch(texts);

            this.domManager.injectTranslations(targetNodes, result.translations);
            console.log("✅ Đã xử lý xong!");
        }
    }

    // ==========================================
    // 5. BOOTSTRAP (Khai báo hằng số và nối các module)
    // ==========================================

    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    const API_KEY = "Bearer YOUR_API_KEY";

    // Liệt kê các model ông muốn hiện trên UI ở đây
    const AVAILABLE_MODELS = [
        "google/gemma-4-26b-a4b-it:free",
        "google/gemma-4-31b-it:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
    ];

    // Cấu hình mặc định nếu người dùng chưa mở UI lưu lần nào
    const DEFAULT_CONFIG = {
        engine: 'LLM',
        model: AVAILABLE_MODELS[0],
        batchSize: 5
    };

    // Khởi tạo các dịch vụ
    const domManager = new ChatworkDOMManager();
    const configStore = new ConfigStore(DEFAULT_CONFIG);
    const uiManager = new ConfigUIManager(configStore, AVAILABLE_MODELS);
    const factory = new TranslatorFactory(API_URL, API_KEY);

    // Inject tất cả vào App
    const app = new TranslationApp(domManager, configStore, factory);

    console.log(`🚀 Đã load tool dịch Chatwork (v6.0)! Bấm Alt+T để dịch. Chỉnh sửa cấu hình bằng nút [⚙️ Dịch] ở góc trái dưới cùng.`);

    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyT') {
            e.preventDefault();
            app.execute();
        }
    });

})();
