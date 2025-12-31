// Translation Widget - Optimized & Fast
class TranslationWidget {
    constructor() {
        this.isTranslated = false;
        this.currentLanguage = 'en';
        this.originalContent = [];
        this.userProfile = this.loadUserProfile();
        this.targetLanguage = this.userProfile?.teachingLanguage || 'en';
        this.translationCache = new Map();
        
        // Prioritized APIs: Fastest first
        this.translationAPIs = [
            { name: 'MyMemory', method: this.translateMyMemory.bind(this) },
            { name: 'GoogleTranslate', method: this.translateGoogleFree.bind(this) },
            { name: 'LibreTranslate', method: this.translateLibreTranslate.bind(this) }
        ];
        this.currentAPIIndex = 0;
        
        this.init();
    }

    loadUserProfile() {
        if (window.userProfile) return window.userProfile;
        
        const sessionData = sessionStorage.getItem('userProfile');
        if (sessionData) {
            try {
                return JSON.parse(sessionData);
            } catch (e) {
                console.warn('Failed to parse session profile');
            }
        }
        return null;
    }

    init() {
        console.log('🌐 Translation Widget initialized');
        console.log('📍 Target Language:', this.targetLanguage);
        this.setupButton();
    }

    setupButton() {
        const btn = document.getElementById('translateBtn');
        const langLabel = document.getElementById('langLabel');

        const langCodes = {
            'en': 'EN', 'ta': 'TA', 'hi': 'HI', 'fr': 'FR', 
            'de': 'DE', 'es': 'ES', 'zh': 'ZH', 'ja': 'JA', 
            'ko': 'KO', 'pt': 'PT', 'it': 'IT', 'ru': 'RU'
        };

        if (langLabel) {
            langLabel.textContent = langCodes[this.targetLanguage] || 'EN';
        }
        
        if (btn) {
            btn.addEventListener('click', () => this.toggleTranslation());
        }
    }

    async toggleTranslation() {
        if (this.isTranslated) {
            this.revertTranslation();
        } else {
            await this.translatePage();
        }
    }

    async translatePage() {
        const btn = document.getElementById('translateBtn');
        const icon = document.getElementById('btnIcon');
        const tooltip = document.getElementById('tooltip');

        if (this.targetLanguage === 'en' || !this.targetLanguage) {
            if (tooltip) tooltip.textContent = 'Already in English';
            if (icon) icon.textContent = 'ℹ️';
            setTimeout(() => {
                if (icon) icon.textContent = '🌐';
                if (tooltip) tooltip.textContent = 'Translate to native language';
            }, 2000);
            return;
        }

        if (btn) btn.classList.add('translating');
        if (icon) icon.textContent = '⏳';
        if (tooltip) tooltip.textContent = 'Translating...';

        try {
            const textNodes = this.getAllTextNodes();
            console.log('📝 Found', textNodes.length, 'text nodes to translate');

            if (textNodes.length === 0) {
                throw new Error('No text content found');
            }

            await this.translateAllNodes(textNodes);

            this.isTranslated = true;
            if (btn) {
                btn.classList.remove('translating');
                btn.classList.add('translated');
            }
            if (icon) icon.textContent = '✓';
            if (tooltip) tooltip.textContent = 'Click to revert to English';

            console.log('✅ Translation complete!');
        } catch (error) {
            console.error('❌ Translation error:', error);
            if (btn) btn.classList.remove('translating');
            if (icon) icon.textContent = '❌';
            if (tooltip) tooltip.textContent = 'Translation failed';
            
            setTimeout(() => {
                if (icon) icon.textContent = '🌐';
                if (tooltip) tooltip.textContent = 'Translate to native language';
            }, 2000);
        }
    }

    getAllTextNodes() {
        const textNodes = [];
        
        // Elements to exclude from translation
       // Elements to exclude from translation
const excludeSelectors = [
    '.head',
    '.translation-widget',
    '.dictionary-modal',
    '.dictionary-btn',
    '#dictionary-modal',
    '[class*="dictionary"]',
    '#zeno-assistant',
    '.zeno-assistant',
    '.assistant-chat',
    '.assistant-toggle',
    '[id*="assistant"]',
    '[class*="assistant"]',
    '.logo',                    // NativeSpark AI logo
    '.user-profile',            // User avatar & name
    '#userName',                // Username
    '#welcomeName',             // Welcome name
    '#userLevel',               // Beginner/Intermediate/Advanced
    '#targetLang',              // Spanish/Tamil/etc
    '#teachingLang',            // English/Tamil/etc
    '.user-header',             // Logout button area
    'header.header',            // Main header
    '.user-avatar' ,
    '.footer'             // User avatar image
];
        
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (!node.textContent.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'CODE', 'PRE'];
                    if (skipTags.includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Check if parent matches any exclude selector
                    for (const selector of excludeSelectors) {
                        if (parent.closest(selector)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        return textNodes;
    }

    async translateAllNodes(textNodes) {
        this.originalContent = [];
        const batchSize = 5; // Process 5 at once for speed
        const batches = [];
        
        for (let i = 0; i < textNodes.length; i += batchSize) {
            batches.push(textNodes.slice(i, i + batchSize));
        }

        console.log(`⚡ Processing ${batches.length} batches with ${this.translationAPIs[this.currentAPIIndex].name}...`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            
            // Process batch in parallel for speed
            const promises = batch.map(async (node) => {
                const originalText = node.textContent.trim();
                
                // Store original - CRITICAL for revert
                this.originalContent.push({
                    node: node,
                    text: originalText
                });

                // Skip short or non-translatable texts
                if (originalText.length < 2 || /^[\d\s\W]+$/.test(originalText)) {
                    return;
                }

                try {
                    const translated = await this.translateWithFallback(originalText);
                    if (translated && translated !== originalText && node.parentElement) {
                        node.textContent = translated;
                    }
                } catch (error) {
                    console.warn('⚠️ Failed:', originalText.substring(0, 30));
                }
            });

            await Promise.all(promises);

            // Shorter delay for faster processing
            if (i < batches.length - 1) {
                await this.delay(150);
            }
            
            const progress = Math.round(((i + 1) / batches.length) * 100);
            console.log(`📊 Progress: ${progress}%`);
        }
        
        console.log(`✅ Stored ${this.originalContent.length} original texts`);
    }

    async translateWithFallback(text) {
        if (this.translationCache.has(text)) {
            return this.translationCache.get(text);
        }

        let translated = await this.translateWithAPI(text, this.currentAPIIndex);
        
        if (!translated || translated === text) {
            for (let i = 0; i < this.translationAPIs.length; i++) {
                if (i !== this.currentAPIIndex) {
                    translated = await this.translateWithAPI(text, i);
                    if (translated && translated !== text) {
                        this.currentAPIIndex = i;
                        break;
                    }
                }
            }
        }

        if (translated) {
            this.translationCache.set(text, translated);
        }

        return translated || text;
    }

    async translateWithAPI(text, apiIndex) {
        try {
            const api = this.translationAPIs[apiIndex];
            return await api.method(text);
        } catch (error) {
            return null;
        }
    }

    async translateMyMemory(text) {
        const maxLength = 500;
        const textToTranslate = text.length > maxLength ? text.substring(0, maxLength) : text;
        
        const encodedText = encodeURIComponent(textToTranslate);
        const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${this.targetLanguage}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }
        return null;
    }

    async translateGoogleFree(text) {
        const maxLength = 1000;
        const textToTranslate = text.length > maxLength ? text.substring(0, maxLength) : text;
        
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${this.targetLanguage}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                return data[0][0][0];
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    async translateLibreTranslate(text) {
        const instances = [
            'https://libretranslate.com/translate',
            'https://translate.argosopentech.com/translate'
        ];

        const maxLength = 5000;
        const textToTranslate = text.length > maxLength ? text.substring(0, maxLength) : text;

        for (const instance of instances) {
            try {
                const response = await fetch(instance, {method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        q: textToTranslate,
                        source: 'en',
                        target: this.targetLanguage,
                        format: 'text'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.translatedText) {
                        return data.translatedText;
                    }
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    revertTranslation() {
        const btn = document.getElementById('translateBtn');
        const icon = document.getElementById('btnIcon');
        const tooltip = document.getElementById('tooltip');

        console.log('🔄 Reverting translation...', this.originalContent.length, 'items');

        // Revert all translations
        let revertedCount = 0;
        this.originalContent.forEach(item => {
            if (item.node && item.node.parentElement && item.text) {
                try {
                    item.node.textContent = item.text;
                    revertedCount++;
                } catch (error) {
                    console.warn('Failed to revert node:', error);
                }
            }
        });

        console.log(`✅ Reverted ${revertedCount} text nodes`);

        // Reset state
        this.isTranslated = false;
        this.originalContent = [];
        this.translationCache.clear();
        
        // Update button UI
        if (btn) btn.classList.remove('translated');
        if (icon) icon.textContent = '🌐';
        if (tooltip) tooltip.textContent = 'Translate to native language';

        console.log('✅ Page reverted to English');
    }
}

// Initialize widget when DOM is ready
function initTranslationWidget() {
    if (document.body && document.getElementById('translateBtn')) {
        window.translationWidget = new TranslationWidget();
        console.log('✅ Translation Widget ready');
    } else {
        setTimeout(initTranslationWidget, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranslationWidget);
} else {
    initTranslationWidget();
}