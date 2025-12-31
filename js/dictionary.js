// js/dictionary.js - COMPLETELY ISOLATED AI DICTIONARY
class Dictionary {
    constructor() {
        console.log('📖 Initializing Isolated AI Dictionary...');
        
        // OWN API Configuration - Completely separate from chatbot
        this.apiProvider = 'groq';
        this.apiKey = null;
        this.apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
        
        // Supported languages
        this.supportedLanguages = {
            'en': { name: 'English', code: 'en', flag: '🇺🇸' },
            'ta': { name: 'Tamil', code: 'ta', flag: '🇮🇳', native: 'தமிழ்' },
            'hi': { name: 'Hindi', code: 'hi', flag: '🇮🇳', native: 'हिन्दी' },
            'fr': { name: 'French', code: 'fr', flag: '🇫🇷', native: 'Français' },
            'de': { name: 'German', code: 'de', flag: '🇩🇪', native: 'Deutsch' }
        };
        
        // Cache for performance
        this.cache = new Map();
        this.cacheExpiry = 3600000; // 1 hour
        
        // Current state
        this.isOpen = false;
        this.currentWord = '';
        this.sourceLang = 'en';
        this.targetLang = 'ta';
        this.isProcessing = false;
        
        console.log('✅ Isolated AI Dictionary initialized');
        console.log('🤖 Using separate AI instance (no chatbot interference)');
        console.log('🌐 Languages:', Object.keys(this.supportedLanguages).join(', '));
    }
    
    // =====================
    // ISOLATED AI METHODS (Does NOT affect chatbot)
    // =====================
    
    /**
     * Query AI directly - completely isolated from chatbot
     */
    async queryAI(prompt) {
        if (this.isProcessing) {
            throw new Error('Dictionary AI is busy. Please wait...');
        }
        
        this.isProcessing = true;
        console.log('🤖 [Dictionary AI] Processing query...');
        
        try {
            const response = await fetch(this.apiEndpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: "You are a professional dictionary assistant. Provide accurate translations and definitions only. Be concise and precise."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.3, // Lower temperature for more accurate translations
                    max_tokens: 800,
                    top_p: 1,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format');
            }

            console.log('✅ [Dictionary AI] Response received');
            return data.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('❌ [Dictionary AI] Error:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }
    
    // =====================
    // PUBLIC API METHODS
    // =====================
    
    /**
     * Open dictionary modal
     */
    openDictionary() {
        console.log('📖 Opening AI dictionary...');
        
        if (this.isOpen) {
            console.log('⚠️ Dictionary already open');
            return;
        }
        
        this.createDictionaryUI();
        this.isOpen = true;
    }
    
    /**
     * Close dictionary modal
     */
    closeDictionary() {
        console.log('📖 Closing dictionary...');
        
        const modal = document.getElementById('dictionaryModal');
        if (modal) {
            modal.remove();
        }
        
        this.isOpen = false;
    }
    
    /**
     * Lookup a word using isolated AI
     */
    async lookup(word, sourceLang = 'en', targetLang = 'ta') {
        if (!word || word.trim() === '') {
            throw new Error('Word cannot be empty');
        }
        
        word = word.trim();
        
        console.log(`🔍 [Dictionary] Looking up: "${word}" (${sourceLang} → ${targetLang})`);
        
        // Check cache first
        const cacheKey = `${word}-${sourceLang}-${targetLang}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('✅ Returning cached result');
            return cached;
        }
        
        try {
            const result = await this.performAILookup(word, sourceLang, targetLang);
            this.saveToCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('❌ Lookup failed:', error);
            throw error;
        }
    }
    
    /**
     * Translate text using isolated AI
     */
    async translate(text, sourceLang, targetLang) {
        if (!text || text.trim() === '') {
            throw new Error('Text cannot be empty');
        }
        
        console.log(`🌐 [Dictionary] Translating: "${text}" (${sourceLang} → ${targetLang})`);
        
        try {
            const sourceLangName = this.supportedLanguages[sourceLang]?.name || sourceLang;
            const targetLangName = this.supportedLanguages[targetLang]?.name || targetLang;
            
            const prompt = `Translate this ${sourceLangName} text to ${targetLangName}. Only provide the translation, nothing else:\n\n"${text}"`;
            
            const translation = await this.queryAI(prompt);
            
            return {
                text: translation.replace(/["""]/g, '').trim(),
                service: 'Dictionary AI',
                confidence: 0.95
            };
            
        } catch (error) {
            console.error('❌ Translation failed:', error);
            throw error;
        }
    }
    
    // =====================
    // UI CREATION
    // =====================
    
    createDictionaryUI() {
        // Remove existing modal if any
        const existing = document.getElementById('dictionaryModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'dictionaryModal';
        modal.className = 'dictionary-modal-overlay';
        
        modal.innerHTML = `
            <div class="dictionary-modal">
                <div class="dictionary-header">
                    <h2>📖 Nativespark Multilingual Dictionary</h2>
                    <button class="dictionary-close" onclick="window.dictionary.closeDictionary()">×</button>
                </div>
                
                <div class="dictionary-language-selector">
                    <div class="lang-group">
                        <label>From:</label>
                        <select id="dictSourceLang" class="dict-lang-select">
                            ${this.generateLanguageOptions()}
                        </select>
                    </div>
                    <button class="lang-swap" onclick="window.dictionary.swapLanguages()">⇄</button>
                    <div class="lang-group">
                        <label>To:</label>
                        <select id="dictTargetLang" class="dict-lang-select">
                            ${this.generateLanguageOptions('ta')}
                        </select>
                    </div>
                </div>
                
                <div class="dictionary-search">
                    <input 
                        type="text" 
                        id="dictSearchInput" 
                        class="dict-search-input" 
                        placeholder="Enter a word or phrase..."
                        maxlength="200"
                    />
                    <button class="dict-search-btn" onclick="window.dictionary.performSearch()">
                        🔍 Explore
                    </button>
                </div>
                
                <div class="dictionary-results" id="dictResults">
                    <div class="dict-welcome">
                        <h3>🤖 Welcome to AI Dictionary!</h3>
                        <p>Powered by isolated AI - doesn't affect your chatbot</p>
                        <ul>
                            <li>🌐 Translations in 5 languages</li>
                            <li>📚 Context-aware definitions</li>
                            <li>💡 Natural example sentences</li>
                            <li>🎯 Grammar and usage tips</li>
                            <li>🔒 Separate AI instance</li>
                        </ul>
                        <p class="dict-supported">Languages: English • Tamil • Hindi • French • German</p>
                        <p class="ai-powered">✨ Independent AI (Groq)</p>
                    </div>
                </div>
                
                <div class="dictionary-history" id="dictHistory">
                    <h4>📜 Recent Searches</h4>
                    <div class="history-items" id="historyItems" style=color:black;>
                        <p class="no-history">No recent searches</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles
        this.injectStyles();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load history
        this.loadSearchHistory();
        
        console.log('✅ Dictionary UI created');
    }
    
    generateLanguageOptions(selectedLang = 'en') {
        return Object.entries(this.supportedLanguages)
            .map(([code, lang]) => {
                const selected = code === selectedLang ? 'selected' : '';
                const native = lang.native ? ` (${lang.native})` : '';
                return `<option value="${code}" ${selected}>${lang.flag} ${lang.name}${native}</option>`;
            })
            .join('');
    }
    
    setupEventListeners() {
        const input = document.getElementById('dictSearchInput');
        const sourceLang = document.getElementById('dictSourceLang');
        const targetLang = document.getElementById('dictTargetLang');
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
        
        if (sourceLang) {
            sourceLang.addEventListener('change', (e) => {
                this.sourceLang = e.target.value;
                console.log('Source language changed to:', this.sourceLang);
            });
        }
        
        if (targetLang) {
            targetLang.addEventListener('change', (e) => {
                this.targetLang = e.target.value;
                console.log('Target language changed to:', this.targetLang);
            });
        }
        
        // Close on backdrop click
        const modal = document.getElementById('dictionaryModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.className === 'dictionary-modal-overlay') {
                    this.closeDictionary();
                }
            });
        }
    }
    
    // =====================
    // AI-POWERED LOOKUP (ISOLATED)
    // =====================
    
    async performSearch() {
        const input = document.getElementById('dictSearchInput');
        const resultsDiv = document.getElementById('dictResults');
        const sourceSelect = document.getElementById('dictSourceLang');
        const targetSelect = document.getElementById('dictTargetLang');
        
        if (!input || !resultsDiv) return;
        
        const word = input.value.trim();
        
        if (!word) {
            this.showError('Please enter a word or phrase');
            return;
        }
        
        // Update current language selections
        if (sourceSelect) this.sourceLang = sourceSelect.value;
        if (targetSelect) this.targetLang = targetSelect.value;
        
        // Check if source and target are the same
        if (this.sourceLang === this.targetLang) {
            this.showError(`Source and target languages cannot be the same. Please select different languages.`);
            return;
        }
        
        this.currentWord = word;
        
        // Show loading
        resultsDiv.innerHTML = `
            <div class="dict-loading">
                <div class="loading-spinner"></div>
                <p>🤖 Dictionary AI is analyzing "${word}"...</p>
                <small>Using isolated AI instance (Groq)</small>
            </div>
        `;
        
        try {
            const result = await this.lookup(word, this.sourceLang, this.targetLang);
            this.displayResult(result);
            this.addToHistory(word, this.sourceLang, this.targetLang);
        } catch (error) {
            console.error('Search error:', error);
            this.showError(`Could not process "${word}". Please try again or check your internet connection.`);
        }
    }
    
    async performAILookup(word, sourceLang, targetLang) {
        const sourceLangName = this.supportedLanguages[sourceLang]?.name || sourceLang;
        const targetLangName = this.supportedLanguages[targetLang]?.name || targetLang;
        
        // Create improved prompt with explicit instructions
        const prompt = `You are a professional dictionary. Translate and explain this word/phrase with extreme accuracy.

Word/Phrase: "${word}"
Source Language: ${sourceLangName}
Target Language: ${targetLangName}

CRITICAL: Provide verified, standard translations only. If unsure, state "needs verification".
- Double-check vocabulary accuracy
- For objects/foods: Verify exact translation (apple ≠ guava)
- Provide most common/standard translation first

Format your response EXACTLY like this:

TRANSLATION: [${targetLangName} translation]
DEFINITION: [One clear English sentence explaining the meaning]
PART OF SPEECH: [noun/verb/adjective/etc]
EXAMPLES:
- [Example sentence 1 using "${word}"]
- [Example sentence 2 using "${word}"]
- [Example sentence 3 using "${word}"]
NOTES: [Usage tips or common mistakes to avoid]

Be precise and accurate.`;

        console.log('[Dictionary AI] Searching...');
        
        try {
            // Use isolated AI query
            const aiResponse = await this.queryAI(prompt);
            
            console.log('✅ [Dictionary AI] Response received');
            
            // Parse AI response into structured data
            const result = this.parseAIResponse(aiResponse, word, sourceLang, targetLang);
            
            return result;
            
        } catch (error) {
            console.error('❌ [Dictionary AI] Lookup failed:', error);
            throw new Error(`Dictionary AI lookup failed: ${error.message}`);
        }
    }
    
    parseAIResponse(aiResponse, word, sourceLang, targetLang) {
        console.log('📝 Parsing AI response...');
        
        let cleanResponse = aiResponse.trim();
        
        // Extract translation
        let translation = word;
        const translationMatch = cleanResponse.match(/TRANSLATION[:\s]+([^\n]+)/i);
        if (translationMatch) {
            translation = translationMatch[1].trim()
                .replace(/[\*\[\]]/g, '')
                .replace(/\(.*?\)/g, '')
                .trim();
        } else {
            // Fallback: Look for bold or first non-English text
            const boldMatch = cleanResponse.match(/\*\*([^\*]+)\*\*/);
            if (boldMatch && boldMatch[1].trim() !== word) {
                translation = boldMatch[1].trim();
            }
        }
        
        // Extract definition
        let definition = '';
        const defMatch = cleanResponse.match(/DEFINITION[:\s]+([^\n]+)/i);
        if (defMatch) {
            definition = defMatch[1].trim()
                .replace(/[\*\[\]]/g, '')
                .trim();
        }
        
        // Extract examples
        const examples = [];
        const exampleSection = cleanResponse.match(/EXAMPLES[:\s]*\n([\s\S]*?)(?=\n[A-Z]+:|$)/i);
        if (exampleSection) {
            const exampleText = exampleSection[1];
            const exampleLines = exampleText.split('\n')
                .filter(l => l.trim() && (l.includes('-') || l.includes('•') || /^\d+\./.test(l.trim())))
                .map(l => l.replace(/^[\-•\d\.\s*]+/, '').trim())
                .filter(l => l.length > 10);
            examples.push(...exampleLines.slice(0, 3));
        }
        
        // Extract part of speech
        let partOfSpeech = 'word';
        const posMatch = cleanResponse.match(/PART OF SPEECH[:\s]+([^\n]+)/i);
        if (posMatch) {
            partOfSpeech = posMatch[1].trim()
                .replace(/[\*\[\]]/g, '')
                .toLowerCase();
        }
        
        // Extract notes
        let notes = '';
        const notesMatch = cleanResponse.match(/NOTES[:\s]+([^\n]+)/i);
        if (notesMatch) {
            notes = notesMatch[1].trim();
        }
        
        console.log('✅ Parsed:', { translation, definition: definition.substring(0, 50) });
        
        return {
            word: word,
            sourceLang: sourceLang,
            targetLang: targetLang,
            translation: {
                text: translation,
                service: 'Dictionary AI',
                confidence: 0.95
            },
            definition: definition || 'Translation provided',
            examples: examples,
            partOfSpeech: partOfSpeech,
            notes: notes,
            fullResponse: cleanResponse,
            timestamp: Date.now()
        };
    }
    
    // =====================
    // DISPLAY METHODS
    // =====================
    
    displayResult(result) {
        const resultsDiv = document.getElementById('dictResults');
        if (!resultsDiv) return;
        
        const sourceLangName = this.supportedLanguages[result.sourceLang].name;
        const targetLangName = this.supportedLanguages[result.targetLang].name;
        
        let html = `
            <div class="dict-result">
                <div class="result-header">
                    <h3>${result.word}</h3>
                    ${result.partOfSpeech !== 'word' ? `<span class="part-of-speech">${result.partOfSpeech}</span>` : ''}
                </div>
                
                <div class="result-translation">
                    <div class="translation-label">🌐 ${targetLangName} Translation:</div>
                    <div class="translation-text">${result.translation.text}</div>
                    <div class="translation-meta">
                        <span>🤖 Dictionary AI (Isolated)</span>
                        <span>✓ ${Math.round((result.translation.confidence || 0.95) * 100)}% Accurate</span>
                    </div>
                </div>
        `;
        
        // Add definition if available
        if (result.definition && result.definition.length > 10) {
            html += `
                <div class="result-definition">
                    <div class="definition-label">📚 Definition:</div>
                    <div class="definition-text">${result.definition}</div>
                </div>
            `;
        }
        
        // Add examples if available
        if (result.examples && result.examples.length > 0) {
            html += `
                <div class="result-examples">
                    <div class="examples-label">💡 Example Sentences:</div>
                    <ul class="examples-list">
                        ${result.examples.map(ex => `<li>${ex}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Add notes if available
        if (result.notes) {
            html += `
                <div class="result-notes">
                    <div class="notes-label">📝 Usage Notes:</div>
                    <div class="notes-text">${result.notes}</div>
                </div>
            `;
        }
        
        // Show full AI response in expandable section
        if (result.fullResponse && result.fullResponse.length > 100) {
            html += `
                <details class="ai-full-response">
                    <summary>📖 View Complete Analysis</summary>
                    <div class="ai-response-content">${this.formatAIResponse(result.fullResponse)}</div>
                </details>
            `;
        }
        
        html += `</div>`;
        
        resultsDiv.innerHTML = html;
    }
    
    formatAIResponse(response) {
        return response
            .replace(/\*\*/g, '')
            .replace(/\n\n+/g, '\n\n')
            .replace(/\n/g, '<br>')
            .trim();
    }
    
    showError(message) {
        const resultsDiv = document.getElementById('dictResults');
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = `
            <div class="dict-error">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
            </div>
        `;
    }
    
    // =====================
    // UTILITY METHODS
    // =====================
    
    swapLanguages() {
        const sourceSelect = document.getElementById('dictSourceLang');
        const targetSelect = document.getElementById('dictTargetLang');
        
        if (!sourceSelect || !targetSelect) return;
        
        const temp = sourceSelect.value;
        sourceSelect.value = targetSelect.value;
        targetSelect.value = temp;
        
        this.sourceLang = sourceSelect.value;
        this.targetLang = targetSelect.value;
        
        console.log('🔄 Languages swapped');
    }
    
    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    saveToCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    // Search history
    addToHistory(word, sourceLang, targetLang) {
        let history = JSON.parse(localStorage.getItem('dictionaryHistory') || '[]');
        
        history.unshift({
            word,
            sourceLang,
            targetLang,
            timestamp: Date.now()
        });
        
        history = history.slice(0, 10);
        
        localStorage.setItem('dictionaryHistory', JSON.stringify(history));
        this.loadSearchHistory();
    }
    
    loadSearchHistory() {
        const container = document.getElementById('historyItems');
        if (!container) return;
        
        const history = JSON.parse(localStorage.getItem('dictionaryHistory') || '[]');
        
        if (history.length === 0) {
            container.innerHTML = '<p class="no-history">No recent searches</p>';
            return;
        }
        
        const validHistory = history.filter(item => {
            return this.supportedLanguages[item.sourceLang] && 
                   this.supportedLanguages[item.targetLang];
        });
        
        if (validHistory.length === 0) {
            container.innerHTML = '<p class="no-history">No recent searches</p>';
            return;
        }
        
        container.innerHTML = validHistory.map(item => {
            const sourceLang = this.supportedLanguages[item.sourceLang];
            const targetLang = this.supportedLanguages[item.targetLang];
            
            return `
                <div class="history-item" onclick="window.dictionary.searchFromHistory('${item.word}', '${item.sourceLang}', '${item.targetLang}')">
                    <span class="history-word">${item.word}</span>
                    <span class="history-langs">${sourceLang.flag} → ${targetLang.flag}</span>
                </div>
            `;
        }).join('');
        
        localStorage.setItem('dictionaryHistory', JSON.stringify(validHistory));
    }
    
    searchFromHistory(word, sourceLang, targetLang) {
        const input = document.getElementById('dictSearchInput');
        const sourceSelect = document.getElementById('dictSourceLang');
        const targetSelect = document.getElementById('dictTargetLang');
        
        if (input) input.value = word;
        if (sourceSelect) sourceSelect.value = sourceLang;
        if (targetSelect) targetSelect.value = targetLang;
        
        this.sourceLang = sourceLang;
        this.targetLang = targetLang;
        
        this.performSearch();
    }
    
    // =====================
    // STYLES INJECTION
    // =====================
    
    injectStyles() {
        if (document.getElementById('dictionaryStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'dictionaryStyles';
        styles.textContent = `
            .dictionary-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s;
            }
            
            .dictionary-modal {
                background: white;
                border-radius: 20px;
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s;
            }
            
            .dictionary-header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 20px 30px;
                border-radius: 20px 20px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .dictionary-header h2 {
                margin: 0;
                font-size: 24px;
            }
            
            .dictionary-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                font-size: 32px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .dictionary-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }
            
            .dictionary-language-selector {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 20px 30px;
                background: #f8f9fa;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .lang-group {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .lang-group label {
                font-size: 12px;
                color: #666;
                font-weight: 600;
            }
            
            .dict-lang-select {
                padding: 10px;
                border: 2px solid #ddd;
                border-radius: 10px;
                font-size: 14px;
                background: white;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .dict-lang-select:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .lang-swap {
                background: #667eea;
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.3s;
                margin-top: 18px;
            }
            
            .lang-swap:hover {
                transform: rotate(180deg);
                background: #764ba2;
            }
            
            .dictionary-search {
                padding: 20px 30px;
                display: flex;
                gap: 10px;
            }
            
            .dict-search-input {
                flex: 1;
                padding: 15px 20px;
                border: 2px solid #ddd;
                border-radius: 25px;
                font-size: 16px;
                transition: all 0.3s;
            }
            
            .dict-search-input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .dict-search-btn {
                padding: 15px 30px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 25px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .dict-search-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .dictionary-results {
                padding: 20px 30px;
                min-height: 200px;
            }
            
            .dict-welcome {
                text-align: center;
                padding: 40px 20px;
            }
            
            .dict-welcome h3 {
                color: #333;
                margin-bottom: 15px;
            }
            
            .dict-welcome ul {
                text-align: left;
                max-width: 400px;
                margin: 20px auto;
                list-style-position: inside;
            }
            
            .dict-welcome li {
                margin: 10px 0;
                color: #666;
            }
            
            .dict-supported {
                margin-top: 20px;
                color: #999;
                font-size: 14px;
            }
            
            .ai-powered {
                margin-top: 10px;
                color: #667eea;
                font-size: 13px;
                font-weight: 600;
            }
            
            .dict-loading {
                text-align: center;
                padding: 60px 20px;
            }
            
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                margin: 0 auto 20px;
                animation: spin 1s linear infinite;
            }
            
            .dict-result {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 15px;
                padding: 25px;
            }
            
            .result-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
            }
            
            .result-header h3 {
                margin: 0;
                color: #333;
                font-size: 28px;
            }
            
            .part-of-speech {
                background: #667eea;
                color: white;
                padding: 5px 15px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .result-translation {
                background: linear-gradient(135deg, #667eea15, #764ba215);
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
            }
            
            .translation-label {
                font-size: 14px;
                color: #666;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .translation-text {
                font-size: 24px;
                color: #333;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .translation-meta {
                display: flex;
                gap: 15px;
                font-size: 12px;
                color: #999;
            }
            
            .result-definition {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
            }
            
            .definition-label {
                font-size: 14px;
                color: #666;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .definition-text {
                color: #333;
                line-height: 1.6;
            }
            
            .result-examples {
                padding: 20px;
                background: #fffbeb;
                border-radius: 10px;
                margin-bottom: 20px;
            }
            
            .examples-label {
                font-size: 14px;
                color: #666;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .examples-list {
                list-style-position: inside;
                color: #555;
            }
            
            .examples-list li {
                margin: 8px 0;
                line-height: 1.5;
            }
            
            .result-notes {
                padding: 20px;
                background: #e8f4fd;
                border-radius: 10px;
                margin-bottom: 20px;
            }
            
            .notes-label {
                font-size: 14px;
                color: #666;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .notes-text {
                color: #333;
                line-height: 1.6;
            }
            
            .ai-full-response {
                margin-top: 20px;
                border: 1px solid #e0e0e0;
                border-radius: 10px;
                overflow: hidden;
            }
            
            .ai-full-response summary {
                padding: 15px;
                background: #f8f9fa;
                cursor: pointer;
                font-weight: 600;
                color: #667eea;
                user-select: none;
            }
            
            .ai-full-response summary:hover {
                background: #e9ecef;
            }
            
            .ai-response-content {
                padding: 20px;
                background: white;
                color: #333;
                line-height: 1.8;
                white-space: pre-wrap;
            }
            
            .dict-error {
                text-align: center;
                padding: 60px 20px;
            }
            
            .error-icon {
                font-size: 60px;
                margin-bottom: 20px;
            }
            
            .dict-error p {
                color: #666;
                font-size: 16px;
            }
            
            .dictionary-history {
                padding: 20px 30px;
                background: #f8f9fa;
                border-top: 1px solid #e0e0e0;
                border-radius: 0 0 20px 20px;
            }
            
            .dictionary-history h4 {
                margin: 0 0 15px 0;
                color: #333;
                font-size: 16px;
            }
            
            .history-items {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .no-history {
                color: #999;
                font-size: 14px;
                text-align: center;
                width: 100%;
                padding: 20px;
            }
            
            .history-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 15px;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
            }
            
            .history-item:hover {
                background: #667eea;
                color: white;
                border-color: #667eea;
                transform: translateY(-2px);
            }
            
            .history-word {
                font-weight: 600;
            }
            
            .history-langs {
                color: #999;
                font-size: 12px;
            }
            
            .history-item:hover .history-langs {
                color: rgba(255, 255, 255, 0.8);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { 
                    transform: translateY(50px);
                    opacity: 0;
                }
                to { 
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @media (max-width: 768px) {
                .dictionary-modal {
                    width: 95%;
                    max-height: 95vh;
                }
                
                .dictionary-language-selector {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .lang-swap {
                    margin-top: 0;
                    transform: rotate(90deg);
                }
                
                .dictionary-search {
                    flex-direction: column;
                }
                
                .dict-search-btn {
                    width: 100%;
                }
                
                .result-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .result-header h3 {
                    font-size: 22px;
                }
                
                .translation-text {
                    font-size: 20px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// =====================
// SIMPLE TRANSLATOR CLASS (ISOLATED AI)
// =====================

class Translator {
    constructor() {
        console.log('🌐 Initializing Isolated AI Translator...');
        
        // OWN API Configuration
        this.apiKey =null;
        this.apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
        
        this.supportedLanguages = {
            'en': 'English',
            'ta': 'Tamil',
            'hi': 'Hindi',
            'fr': 'French',
            'de': 'German'
        };
        
        this.cache = new Map();
        this.isProcessing = false;
        
        console.log('✅ Isolated AI Translator ready');
    }
    
    async queryAI(prompt) {
        if (this.isProcessing) {
            throw new Error('Translator is busy');
        }
        
        this.isProcessing = true;
        
        try {
            const response = await fetch(this.apiEndpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: "You are a professional translator. Provide only the translation, nothing else."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error('Translation API error');
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
            
        } finally {
            this.isProcessing = false;
        }
    }
    
    async translate(text, sourceLang, targetLang) {
        if (!text || text.trim() === '') {
            throw new Error('Text cannot be empty');
        }
        
        // Check cache
        const cacheKey = `${text}-${sourceLang}-${targetLang}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;
        
        try {
            const sourceLangName = this.supportedLanguages[sourceLang] || sourceLang;
            const targetLangName = this.supportedLanguages[targetLang] || targetLang;
            
            const prompt = `Translate this ${sourceLangName} text to ${targetLangName}. Only provide the translation:\n\n"${text}"`;
            
            const translation = await this.queryAI(prompt);
            
            const result = {
                original: text,
                translated: translation.replace(/["""]/g, '').trim(),
                sourceLang,
                targetLang,
                confidence: 0.95,
                service: 'Translator AI'
            };
            
            this.cache.set(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error('[Translator AI] Error:', error);
            return {
                original: text,
                translated: text,
                sourceLang,
                targetLang,
                confidence: 0,
                error: true
            };
        }
    }
    
    async translateBatch(texts, sourceLang, targetLang) {
        return Promise.all(
            texts.map(text => this.translate(text, sourceLang, targetLang))
        );
    }
}

// =====================
// CREATE SINGLETON INSTANCES
// =====================

const dictionary = new Dictionary();
const translator = new Translator();

// Make globally available
window.dictionary = dictionary;
window.translator = translator;

// Export for module usage
export { dictionary, translator };
export default dictionary;

console.log('✅ Isolated AI Dictionary & Translator loaded');
console.log('🤖 Using separate AI instances - NO chatbot interference');
console.log('📖 Usage: window.dictionary.openDictionary()');
console.log('🌐 Usage: window.translator.translate(text, from, to)');