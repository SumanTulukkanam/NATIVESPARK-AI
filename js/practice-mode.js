class AIPracticeMode {
    constructor() {
     this.currentExercise = null;
    this.practiceHistory = [];
    this.sessionScore = 0;
    this.sessionQuestions = 0;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    
    // ✅ API Configuration
    this.apiProvider = 'groq';
    this.apiKey = null;
    this.apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.3-70b-versatile'; // ✅ ADD THIS LINE
    
    console.log('🎯 Practice Mode initialized with Groq API');
        // Practice types
        this.practiceTypes = {
            translation: 'Translation Practice',
            vocabulary: 'Vocabulary Builder',
            sentence: 'Sentence Construction',
            conversation: 'Conversation Practice',
            listening: 'Listening Comprehension',
            grammar: 'Grammar Correction'
        };
        
        this.init();
    }

  async init() {
    console.log('🎯 Initializing AI Practice Mode...');
    
    // ✅ Test API connection
    try {
        await this.testAPIConnection();
        console.log('✅ Groq API connected successfully');
    } catch (error) {
        console.error('❌ API connection failed:', error);
        alert('⚠️ API connection failed. Please check your internet connection and API key.');
    }
    
    console.log('✅ AI Practice Mode ready');
}

// ✅ ADD THIS METHOD
async testAPIConnection() {
    const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 10
        })
    });
    
    if (!response.ok) {
        throw new Error(`API test failed: ${response.status}`);
    }
    
    return true;
}



    // ================================================
    // MAIN PRACTICE INTERFACE
    // ================================================
    
    openPracticeMode() {
        console.log('🎯 Opening Practice Mode...');
        
        const modal = this.createPracticeModal();
        document.body.appendChild(modal);
        
        setTimeout(() => modal.classList.add('active'), 10);
    }

    createPracticeModal() {
        const modal = document.createElement('div');
        modal.id = 'practiceModal';
        modal.className = 'practice-modal-overlay';
        modal.innerHTML = `
            <div class="practice-modal">
                <div class="practice-header">
                    <h2>🎯 AI Practice Mode</h2>
                    <button class="close-btn" onclick="window.practiceMode.closePracticeMode()">×</button>
                </div>
                
                <div class="practice-content">
                    <!-- Type Selection -->
                    <div id="practiceTypeSelection" class="practice-section">
                        <h3>Choose Practice Type</h3>
                        <div class="practice-types-grid">
                            ${this.renderPracticeTypes()}
                        </div>
                    </div>
                    
                    <!-- Exercise Area -->
                    <div id="practiceExercise" class="practice-section hidden">
                        <div class="exercise-header">
                            <button class="back-btn" onclick="window.practiceMode.backToSelection()">← Back</button>
                            <div class="session-stats">
                                <span>Score: <strong id="sessionScore">0</strong></span>
                                <span>Questions: <strong id="sessionQuestions">0</strong></span>
                            </div>
                        </div>
                        
                        <div class="exercise-content" id="exerciseContent">
                            <!-- Dynamic exercise content -->
                        </div>
                        
                        <div class="exercise-controls">
                            <button class="btn-primary" id="checkAnswerBtn" onclick="window.practiceMode.checkAnswer()">
                                Check Answer ✓
                            </button>
                            <button class="btn-secondary" id="nextQuestionBtn" onclick="window.practiceMode.nextQuestion()" style="display: none;">
                                Next Question →
                            </button>
                            <button class="btn-secondary" onclick="window.practiceMode.getHint()">
                                💡 Get Hint
                            </button>
                        </div>
                        
                        <div id="feedbackArea" class="feedback-area"></div>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    renderPracticeTypes() {
        return Object.entries(this.practiceTypes).map(([key, name]) => `
            <div class="practice-type-card" onclick="window.practiceMode.startPractice('${key}')">
                <div class="practice-type-icon">${this.getTypeIcon(key)}</div>
                <h4>${name}</h4>
                <p>${this.getTypeDescription(key)}</p>
            </div>
        `).join('');
    }

    getTypeIcon(type) {
        const icons = {
            translation: '🔄',
            vocabulary: '📚',
            sentence: '✍️',
            conversation: '💬',
            listening: '👂',
            grammar: '📝'
        };
        return icons[type] || '🎯';
    }

    getTypeDescription(type) {
        const descriptions = {
            translation: 'Practice translating between languages',
            vocabulary: 'Build and test your vocabulary',
            sentence: 'Construct correct sentences',
            conversation: 'Practice real conversations',
            listening: 'Improve listening comprehension',
            grammar: 'Master grammar rules'
        };
        return descriptions[type] || 'Practice your skills';
    }

    // ================================================
    // PRACTICE SESSION MANAGEMENT
    // ================================================
    
    async startPractice(type) {
        console.log(`🎯 Starting ${type} practice...`);
        
        this.currentPracticeType = type;
        this.sessionScore = 0;
        this.sessionQuestions = 0;
        
        // Hide type selection, show exercise area
        document.getElementById('practiceTypeSelection').classList.add('hidden');
        document.getElementById('practiceExercise').classList.remove('hidden');
        
        // Generate first question
        await this.generateQuestion(type);
    }

   async generateQuestion(type) {
    const userProfile = this.getUserProfile();
    
    // ✅ FIX: Use targetLanguage (what they're learning) for practice
    const targetLang = userProfile.targetLanguage || 'en';  // Language they're LEARNING
    const teachingLang = userProfile.teachingLanguage || 'English';  // Language they KNOW
    
    console.log(`🎲 Generating ${type} question...`);
    console.log(`📚 Learning: ${targetLang}, Teaching in: ${teachingLang}`);
    
    const exerciseContent = document.getElementById('exerciseContent');
    exerciseContent.innerHTML = '<div class="loading">🤖 AI is generating your practice question...</div>';
    
    this.resetButtons();
    
    try {
        let prompt = this.buildPromptForType(type, targetLang, teachingLang);
        
        // ✅ DIRECT API CALL - NO AI ASSISTANT
        const response = await this.callGroqAPI(prompt);
        this.currentExercise = this.parseAIResponse(response, type);
        this.renderExercise(type, this.currentExercise);
        
    } catch (error) {
        console.error('❌ Error generating question:', error);
        exerciseContent.innerHTML = `
            <div class="error-message">
                ⚠️ Failed to generate question. Please try again.
                <button onclick="window.practiceMode.generateQuestion('${type}')">Retry</button>
            </div>
        `;
    }
}

// ================================================
// ADD DIRECT GROQ API METHOD
// ================================================

async callGroqAPI(prompt, systemPrompt = 'You are a helpful language learning tutor. Always follow the exact format requested.') {
    console.log('🤖 Calling Groq API directly...');
    
    try {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        const message = data.choices[0].message.content;
        
        console.log('✅ Groq API response received');
        return message;
        
    } catch (error) {
        console.error('❌ Groq API error:', error);
        throw error;
    }
}


    // FIX: Reset button states
    resetButtons() {
        const checkBtn = document.getElementById('checkAnswerBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        const feedbackArea = document.getElementById('feedbackArea');
        
        if (checkBtn) {
            checkBtn.style.display = 'block';
            checkBtn.disabled = false;
            checkBtn.textContent = 'Check Answer ✓';
        }
        
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }
        
        if (feedbackArea) {
            feedbackArea.innerHTML = '';
        }
    }

   buildPromptForType(type, targetLang, teachingLang) {
    const level = this.getUserProfile().level || 'beginner';
    
    const prompts = {
        translation: `Generate a ${level} level translation exercise.
            The user is LEARNING ${targetLang} and speaks ${teachingLang}.
            
            You MUST respond EXACTLY in this format:
            QUESTION: [sentence in ${teachingLang} to translate]
            ANSWER: [correct translation in ${targetLang}]
            EXPLANATION: [brief explanation in ${teachingLang}]
            
            Example for learning Spanish from English:
            QUESTION: I love learning new languages.
            ANSWER: Me encanta aprender nuevos idiomas.
            EXPLANATION: "Me encanta" uses the indirect object pronoun construction.`,
        
        vocabulary: `Generate a ${level} level vocabulary exercise.
            The user is LEARNING ${targetLang} and speaks ${teachingLang}.
            
            You MUST respond EXACTLY in this format:
            WORD: [word in ${targetLang} to learn]
            DEFINITION: [definition in ${teachingLang}]
            OPTIONS: [option1 in ${teachingLang}|option2|option3|option4]
            ANSWER: [correct option number: 1, 2, 3, or 4]
            EXAMPLE: [example sentence in ${targetLang}]
            
            Present a word IN ${targetLang}, and all definitions/options IN ${teachingLang}.`,
        
        sentence: `Generate a ${level} level sentence construction exercise.
            The user is LEARNING ${targetLang} and speaks ${teachingLang}.
            
            You MUST respond EXACTLY in this format:
            WORDS: [word1|word2|word3|word4|word5] (all in ${targetLang})
            ANSWER: [correct sentence in ${targetLang}]
            TRANSLATION: [translation in ${teachingLang}]
            TIP: [grammar tip in ${teachingLang}]
            
            Give words IN ${targetLang} to arrange, with instructions in ${teachingLang}.`,
        
        conversation: `Generate a ${level} level conversation practice.
            The user is LEARNING ${targetLang} and speaks ${teachingLang}.
            
            You MUST respond EXACTLY in this format:
            SCENARIO: [situation description in ${teachingLang}]
            PROMPT: [what to respond to - in ${targetLang}]
            SAMPLE_ANSWER: [good example response in ${targetLang}]
            TRANSLATION: [translation of prompt in ${teachingLang}]
            
            The prompt should be IN ${targetLang}, instructions in ${teachingLang}.`,
        
        grammar: `Generate a ${level} level grammar correction exercise.
            The user is LEARNING ${targetLang} and speaks ${teachingLang}.
            
            You MUST respond EXACTLY in this format:
            SENTENCE: [incorrect sentence in ${targetLang}]
            CORRECT: [corrected sentence in ${targetLang}]
            ERROR_TYPE: [type of error in ${teachingLang}]
            EXPLANATION: [why it was wrong, in ${teachingLang}]
            
            Present sentences IN ${targetLang}, explanations in ${teachingLang}.`,
        
        listening: `Generate a ${level} level listening comprehension exercise.
            The user is LEARNING ${targetLang} and speaks ${teachingLang}.
            
            You MUST respond EXACTLY in this format:
            AUDIO_TEXT: [sentence to be heard - in ${targetLang}]
            QUESTION: [comprehension question in ${teachingLang}]
            OPTIONS: [option1|option2|option3|option4] (all in ${teachingLang})
            ANSWER: [correct option number: 1, 2, 3, or 4]
            TRANSLATION: [full translation in ${teachingLang}]
            
            Audio is IN ${targetLang}, questions/options in ${teachingLang}.`
    };
    
    return prompts[type] || prompts.translation;
}

    // IMPROVED PARSING - FIX FOR COMPREHENSION ERRORS
    parseAIResponse(response, type) {
        console.log('📊 Parsing AI response...');
        
        const exercise = {
            type: type,
            raw: response
        };
        
        // More robust parsing with multiple strategies
        const lines = response.split('\n').filter(line => line.trim());
        
        // Strategy 1: Try exact label matching
        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Use case-insensitive matching and handle various formats
            if (/^QUESTION:/i.test(trimmedLine)) {
                exercise.question = trimmedLine.replace(/^QUESTION:\s*/i, '').trim();
            }
            if (/^ANSWER:/i.test(trimmedLine)) {
                exercise.answer = trimmedLine.replace(/^ANSWER:\s*/i, '').trim();
            }
            if (/^WORD:/i.test(trimmedLine)) {
                exercise.word = trimmedLine.replace(/^WORD:\s*/i, '').trim();
            }
            if (/^DEFINITION:/i.test(trimmedLine)) {
                exercise.definition = trimmedLine.replace(/^DEFINITION:\s*/i, '').trim();
            }
            if (/^OPTIONS:/i.test(trimmedLine)) {
                const optionsStr = trimmedLine.replace(/^OPTIONS:\s*/i, '').trim();
                exercise.options = optionsStr.split('|').map(o => o.trim()).filter(o => o);
            }
            if (/^WORDS:/i.test(trimmedLine)) {
                const wordsStr = trimmedLine.replace(/^WORDS:\s*/i, '').trim();
                exercise.words = wordsStr.split('|').map(w => w.trim()).filter(w => w);
            }
            if (/^SENTENCE:/i.test(trimmedLine)) {
                exercise.sentence = trimmedLine.replace(/^SENTENCE:\s*/i, '').trim();
            }
            if (/^CORRECT:/i.test(trimmedLine)) {
                exercise.correct = trimmedLine.replace(/^CORRECT:\s*/i, '').trim();
            }
            if (/^EXPLANATION:/i.test(trimmedLine)) {
                exercise.explanation = trimmedLine.replace(/^EXPLANATION:\s*/i, '').trim();
            }
            if (/^TRANSLATION:/i.test(trimmedLine)) {
                exercise.translation = trimmedLine.replace(/^TRANSLATION:\s*/i, '').trim();
            }
            if (/^EXAMPLE:/i.test(trimmedLine)) {
                exercise.example = trimmedLine.replace(/^EXAMPLE:\s*/i, '').trim();
            }
            if (/^SCENARIO:/i.test(trimmedLine)) {
                exercise.scenario = trimmedLine.replace(/^SCENARIO:\s*/i, '').trim();
            }
            if (/^PROMPT:/i.test(trimmedLine)) {
                exercise.prompt = trimmedLine.replace(/^PROMPT:\s*/i, '').trim();
            }
            if (/^SAMPLE_ANSWER:/i.test(trimmedLine)) {
                exercise.sampleAnswer = trimmedLine.replace(/^SAMPLE_ANSWER:\s*/i, '').trim();
            }
            if (/^TIP:/i.test(trimmedLine)) {
                exercise.tip = trimmedLine.replace(/^TIP:\s*/i, '').trim();
            }
            if (/^AUDIO_TEXT:/i.test(trimmedLine)) {
                exercise.audioText = trimmedLine.replace(/^AUDIO_TEXT:\s*/i, '').trim();
            }
            if (/^ERROR_TYPE:/i.test(trimmedLine)) {
                exercise.errorType = trimmedLine.replace(/^ERROR_TYPE:\s*/i, '').trim();
            }
        });
        
        // Strategy 2: Fallback - extract first meaningful content if labels failed
        if (!exercise.question && !exercise.word && !exercise.sentence && !exercise.prompt) {
            const meaningfulLines = lines.filter(l => l.length > 10 && !l.startsWith('//'));
            if (meaningfulLines.length > 0) {
                exercise.question = meaningfulLines[0];
                if (meaningfulLines.length > 1) {
                    exercise.answer = meaningfulLines[1];
                }
            }
        }
        
        console.log('✅ Parsed exercise:', exercise);
        return exercise;
    }

    renderExercise(type, exercise) {
        const content = document.getElementById('exerciseContent');
        
        const renderers = {
            translation: () => this.renderTranslationExercise(exercise),
            vocabulary: () => this.renderVocabularyExercise(exercise),
            sentence: () => this.renderSentenceExercise(exercise),
            conversation: () => this.renderConversationExercise(exercise),
            grammar: () => this.renderGrammarExercise(exercise),
            listening: () => this.renderListeningExercise(exercise)
        };
        
        content.innerHTML = renderers[type] ? renderers[type]() : this.renderDefaultExercise(exercise);
        
        // Reset buttons
        this.resetButtons();
    }

    renderTranslationExercise(ex) {
        return `
            <div class="exercise-card">
                <h3>🔄 Translate this sentence</h3>
                <div class="question-text">${ex.question || 'Translate the following...'}</div>
                <textarea id="userAnswer" 
                          placeholder="Type your translation here..." 
                          rows="3"></textarea>
                ${ex.translation ? `<div class="hint-text">💡 Context: ${ex.translation}</div>` : ''}
            </div>
        `;
    }

    renderVocabularyExercise(ex) {
        const options = ex.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
        
        return `
            <div class="exercise-card">
                <h3>📚 What does this word mean?</h3>
                <div class="vocabulary-word">${ex.word || 'Word'}</div>
                <div class="options-container">
                    ${options.map((opt, i) => `
                        <label class="option-label">
                            <input type="radio" name="vocabAnswer" value="${i + 1}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
                ${ex.example ? `<div class="example-text">Example: ${ex.example}</div>` : ''}
            </div>
        `;
    }

    renderSentenceExercise(ex) {
        const words = ex.words || ['word1', 'word2', 'word3', 'word4'];
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        
        return `
            <div class="exercise-card">
                <h3>✍️ Arrange these words correctly</h3>
                <div class="word-bank">
                    ${shuffled.map((word, i) => `
                        <button class="word-chip" data-word="${word}" onclick="window.practiceMode.addWord('${word}', this)">
                            ${word}
                        </button>
                    `).join('')}
                </div>
                <div class="sentence-builder" id="sentenceBuilder">
                    <span class="placeholder">Click words to build sentence...</span>
                </div>
                <button class="btn-secondary" onclick="window.practiceMode.clearSentence()">Clear</button>
                ${ex.translation ? `<div class="hint-text">💡 Meaning: ${ex.translation}</div>` : ''}
            </div>
        `;
    }

    // FIXED: Added microphone support for conversation practice
    renderConversationExercise(ex) {
        return `
            <div class="exercise-card">
                <h3>💬 Conversation Practice</h3>
                <div class="scenario-text">${ex.scenario || 'Respond to this situation...'}</div>
                <div class="conversation-prompt">${ex.question || ex.prompt || 'Respond in the target language'}</div>
                
                <div class="input-with-mic">
                    <textarea id="userAnswer" 
                              placeholder="Type your response or use the microphone..." 
                              rows="4"></textarea>
                    <button class="mic-button" id="micButton" onclick="window.practiceMode.toggleRecording()">
                        🎤
                    </button>
                </div>
                
                <div id="recordingStatus" class="recording-status" style="display: none;">
                    <span class="recording-indicator">🔴</span> Recording...
                </div>
                
                ${ex.translation ? `<div class="hint-text">💡 ${ex.translation}</div>` : ''}
                ${ex.sampleAnswer ? `<div class="sample-answer-hint">Example answer available after checking</div>` : ''}
            </div>
        `;
    }

    renderGrammarExercise(ex) {
        return `
            <div class="exercise-card">
                <h3>📝 Correct the Grammar</h3>
                <div class="incorrect-sentence">${ex.sentence || 'Fix this sentence...'}</div>
                <textarea id="userAnswer" 
                          placeholder="Type the corrected sentence..." 
                          rows="2"></textarea>
                ${ex.tip ? `<div class="hint-text">💡 Tip: ${ex.tip}</div>` : ''}
            </div>
        `;
    }

    renderListeningExercise(ex) {
        const audioText = ex.audioText || ex.question || 'Sample audio text';
        const options = ex.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
        
        return `
            <div class="exercise-card">
                <h3>👂 Listening Comprehension</h3>
                <div class="audio-text" id="audioText" style="display: none;">${audioText}</div>
                <button class="btn-primary" onclick="window.practiceMode.playAudio()">🔊 Play Audio</button>
                <div class="question-text">${ex.question || 'What did you hear?'}</div>
                <div class="options-container">
                    ${options.map((opt, i) => `
                        <label class="option-label">
                            <input type="radio" name="listenAnswer" value="${i + 1}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderDefaultExercise(ex) {
        return `
            <div class="exercise-card">
                <div class="question-text">${ex.question || ex.raw || 'Practice question'}</div>
                <textarea id="userAnswer" 
                          placeholder="Type your answer..." 
                          rows="3"></textarea>
            </div>
        `;
    }

    // ================================================
    // MICROPHONE RECORDING - NEW FEATURE
    // ================================================
    
    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                await this.transcribeAudio(audioBlob);
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            const micButton = document.getElementById('micButton');
            const recordingStatus = document.getElementById('recordingStatus');
            
            if (micButton) {
                micButton.textContent = '⏹️';
                micButton.classList.add('recording');
            }
            
            if (recordingStatus) {
                recordingStatus.style.display = 'block';
            }
            
            console.log('🎤 Recording started');
            
        } catch (error) {
            console.error('❌ Microphone access denied:', error);
            alert('⚠️ Microphone access is required for voice recording. Please enable microphone permissions and try again.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            
            // Update UI
            const micButton = document.getElementById('micButton');
            const recordingStatus = document.getElementById('recordingStatus');
            
            if (micButton) {
                micButton.textContent = '🎤';
                micButton.classList.remove('recording');
            }
            
            if (recordingStatus) {
                recordingStatus.style.display = 'none';
            }
            
            console.log('🎤 Recording stopped');
        }
    }

    async transcribeAudio(audioBlob) {
        const textarea = document.getElementById('userAnswer');
        
        // Check if browser supports Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // Note: This is a simplified version. Full implementation would use the recognition API
            textarea.value = '(Audio transcription would appear here)';
            alert('🎤 Audio recorded! In a full implementation, this would be transcribed using speech recognition.');
        } else {
            alert('🎤 Audio recorded! Speech recognition is not available in this browser.');
        }
    }

    // ================================================
    // ANSWER CHECKING
    // ================================================
    
    async checkAnswer() {
        console.log('✓ Checking answer...');
        
        const checkBtn = document.getElementById('checkAnswerBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        const feedbackArea = document.getElementById('feedbackArea');
        
        checkBtn.disabled = true;
        checkBtn.textContent = '🤖 AI is checking...';
        
        try {
            let userAnswer = this.getUserAnswer();
            
            if (!userAnswer) {
                feedbackArea.innerHTML = '<div class="feedback error">⚠️ Please provide an answer first!</div>';
                checkBtn.disabled = false;
                checkBtn.textContent = 'Check Answer ✓';
                return;
            }
            
            // Get AI feedback
            const feedback = await this.getAIFeedback(userAnswer);
            
            // Display feedback
            this.displayFeedback(feedback);
            
            // Update session stats
            this.sessionQuestions++;
            if (feedback.correct) {
                this.sessionScore++;
            }
            
            document.getElementById('sessionScore').textContent = this.sessionScore;
            document.getElementById('sessionQuestions').textContent = this.sessionQuestions;
            
            // Show next button, hide check button
            checkBtn.style.display = 'none';
            nextBtn.style.display = 'block';
            
        } catch (error) {
            console.error('❌ Error checking answer:', error);
            feedbackArea.innerHTML = '<div class="feedback error">Failed to check answer. Try again.</div>';
            checkBtn.disabled = false;
            checkBtn.textContent = 'Check Answer ✓';
        }
    }

    getUserAnswer() {
        // Get answer based on exercise type
        const textarea = document.getElementById('userAnswer');
        if (textarea && textarea.value.trim()) return textarea.value.trim();
        
        const radio = document.querySelector('input[type="radio"]:checked');
        if (radio) return radio.value;
        
        const sentenceBuilder = document.getElementById('sentenceBuilder');
        if (sentenceBuilder && !sentenceBuilder.querySelector('.placeholder')) {
            const words = Array.from(sentenceBuilder.querySelectorAll('.word-chip'))
                .map(chip => chip.textContent.trim());
            return words.join(' ');
        }
        
        return '';
    }

   async getAIFeedback(userAnswer) {
    const ex = this.currentExercise;
    const type = this.currentPracticeType;
    const profile = this.getUserProfile();
    
    // ✅ Clear distinction
    const targetLang = profile.targetLanguage || 'en';  // What they're learning
    const teachingLang = profile.teachingLanguage || 'English';  // What they know
    
    const prompt = `
You are a language learning tutor helping someone learn ${targetLang}.
The student speaks ${teachingLang} as their native language.

Exercise Type: ${type}
Question/Context: ${ex.question || ex.word || ex.sentence || ex.prompt || 'See exercise'}
Correct Answer (in ${targetLang}): ${ex.answer || ex.correct || ex.sampleAnswer || 'See context'}
Student's Answer: ${userAnswer}

Provide feedback in ${teachingLang} (the language they understand) in EXACTLY this format:
CORRECT: yes or no
SCORE: [number from 0-100]
FEEDBACK: [One clear sentence in ${teachingLang} explaining what was right or wrong]
IMPROVEMENT: [One specific tip in ${teachingLang} for improvement]
ENCOURAGEMENT: [One positive, motivating message in ${teachingLang}]

Be strict but fair. Accept variations in ${targetLang} if meaning is correct.
`;
    
    // ✅ DIRECT API CALL
    const response = await this.callGroqAPI(prompt);
    
    // Parse feedback
    const feedback = {
        correct: false,
        score: 0,
        message: 'Good effort!',
        improvement: 'Keep practicing!',
        encouragement: 'You\'re making progress!'
    };
    
    const lines = response.split('\n').map(l => l.trim()).filter(l => l);
    
    lines.forEach(line => {
        if (/^CORRECT:/i.test(line)) {
            feedback.correct = /yes/i.test(line);
        }
        if (/^SCORE:/i.test(line)) {
            const match = line.match(/\d+/);
            feedback.score = match ? parseInt(match[0]) : 0;
        }
        if (/^FEEDBACK:/i.test(line)) {
            feedback.message = line.replace(/^FEEDBACK:\s*/i, '').trim();
        }
        if (/^IMPROVEMENT:/i.test(line)) {
            feedback.improvement = line.replace(/^IMPROVEMENT:\s*/i, '').trim();
        }
        if (/^ENCOURAGEMENT:/i.test(line)) {
            feedback.encouragement = line.replace(/^ENCOURAGEMENT:\s*/i, '').trim();
        }
    });
    
    if (!feedback.message || feedback.message.length < 5) {
        feedback.message = feedback.correct ? 
            'Your answer is correct!' : 
            'Your answer needs some improvements.';
    }
    
    return feedback;
}


// ================================================
// CONSOLE CONFIRMATION
// ================================================



    displayFeedback(feedback) {
        const feedbackArea = document.getElementById('feedbackArea');
        const isCorrect = feedback.correct || feedback.score >= 80;
        
        // Show sample answer if available and answer was incorrect
        let sampleAnswerHtml = '';
        if (!isCorrect && this.currentExercise.sampleAnswer) {
            sampleAnswerHtml = `<div class="sample-answer">✨ Sample answer: ${this.currentExercise.sampleAnswer}</div>`;
        }
        
        feedbackArea.innerHTML = `
            <div class="feedback ${isCorrect ? 'success' : 'partial'}">
                <div class="feedback-header">
                    <span class="feedback-icon">${isCorrect ? '✅' : '📝'}</span>
                    <span class="feedback-title">${isCorrect ? 'Great job!' : 'Not quite right'}</span>
                    <span class="feedback-score">${feedback.score}%</span>
                </div>
                <div class="feedback-message">${feedback.message}</div>
                ${feedback.improvement ? `<div class="feedback-tip">💡 ${feedback.improvement}</div>` : ''}
                ${this.currentExercise.explanation ? `<div class="feedback-explanation">📚 ${this.currentExercise.explanation}</div>` : ''}
                ${sampleAnswerHtml}
                <div class="feedback-encouragement">${feedback.encouragement || '🌟 Keep practicing!'}</div>
            </div>
        `;
    }

   async getHint() {
    const ex = this.currentExercise;
    const profile = this.getUserProfile();
    const teachingLang = profile.teachingLanguage || 'English';
    
    const prompt = `Give a helpful hint in ${teachingLang} for this exercise without revealing the full answer: ${JSON.stringify(ex)}. Keep it brief and encouraging.`;
    
    try {
        // ✅ DIRECT API CALL
        const hint = await this.callGroqAPI(prompt);
        alert('💡 Hint:\n\n' + hint);
    } catch (error) {
        console.error('Hint error:', error);
        alert('💡 Review the context clues provided in the question!');
    }
}

    async nextQuestion() {
        // Clear recording if active
        if (this.isRecording) {
            this.stopRecording();
        }
        
        await this.generateQuestion(this.currentPracticeType);
    }

    // ================================================
    // UTILITY METHODS
    // ================================================
    
    addWord(word, button) {
        const builder = document.getElementById('sentenceBuilder');
        const placeholder = builder.querySelector('.placeholder');
        
        if (placeholder) {
            builder.innerHTML = '';
        }
        
        const chip = document.createElement('button');
        chip.className = 'word-chip in-sentence';
        chip.textContent = word;
        chip.onclick = () => {
            chip.remove();
            button.disabled = false;
        };
        
        builder.appendChild(chip);
        button.disabled = true;
    }

    clearSentence() {
        const builder = document.getElementById('sentenceBuilder');
        builder.innerHTML = '<span class="placeholder">Click words to build sentence...</span>';
        
        document.querySelectorAll('.word-bank .word-chip').forEach(btn => {
            btn.disabled = false;
        });
    }

   playAudio() {
    const audioText = document.getElementById('audioText').textContent;
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(audioText);
        const userProfile = this.getUserProfile();
        
        // ✅ FIX: Use TARGET language (what they're learning)
        const langMap = {
            'en': 'en-US',
            'English': 'en-US',
            'ta': 'ta-IN',
            'Tamil': 'ta-IN',
            'hi': 'hi-IN',
            'Hindi': 'hi-IN',
            'fr': 'fr-FR',
            'French': 'fr-FR',
            'de': 'de-DE',
            'German': 'de-DE',
            'es': 'es-ES',
            'Spanish': 'es-ES'
        };
        
        // ✅ USE TARGET LANGUAGE (what they're learning)
        const targetLang = userProfile.targetLanguage || 'English';
        utterance.lang = langMap[targetLang] || 'en-US';
        utterance.rate = 0.8; // Slower for learning
        
        console.log(`🔊 Playing audio in ${targetLang} (${utterance.lang})`);
        
        speechSynthesis.speak(utterance);
    } else {
        alert('🔊 Audio: ' + audioText);
    }
}

    backToSelection() {
        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording();
        }
        
        document.getElementById('practiceExercise').classList.add('hidden');
        document.getElementById('practiceTypeSelection').classList.remove('hidden');
        
        if (this.sessionQuestions > 0) {
            const accuracy = Math.round((this.sessionScore / this.sessionQuestions) * 100);
            alert(`📊 Session Complete!\n\nScore: ${this.sessionScore}/${this.sessionQuestions}\nAccuracy: ${accuracy}%\n\n${this.getPerformanceMessage(accuracy)}`);
        }
    }

    getPerformanceMessage(accuracy) {
        if (accuracy >= 90) return '🌟 Outstanding! You\'re mastering this!';
        if (accuracy >= 70) return '👍 Great work! Keep it up!';
        if (accuracy >= 50) return '💪 Good effort! Practice makes perfect!';
        return '📚 Keep practicing! You\'re learning!';
    }

    closePracticeMode() {
        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording();
        }
        
        const modal = document.getElementById('practiceModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    getUserProfile() {
        try {
            return JSON.parse(sessionStorage.getItem('userProfile') || '{}');
        } catch {
            return {};
        }
    }
}

// ================================================
// STYLES (Add to your CSS file)
// ================================================
const practiceStyles = `
.practice-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s;
}

.practice-modal-overlay.active {
    opacity: 1;
}

.practice-modal {
    background: white;
    border-radius: 20px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.practice-header {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 20px 30px;
    border-radius: 20px 20px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.practice-content {
    padding: 30px;
}

.practice-types-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.practice-type-card {
    border: 2px solid #e0e0e0;
    border-radius: 15px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;
}

.practice-type-card:hover {
    border-color: #667eea;
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
}

.practice-type-icon {
    font-size: 48px;
    margin-bottom: 10px;
}

.exercise-card {
    background: #f8f9fa;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 20px;
}

.question-text {
    font-size: 20px;
    font-weight: 600;
    margin: 20px 0;
    color: #333;
}

.vocabulary-word {
    font-size: 36px;
    font-weight: bold;
    color: #667eea;
    text-align: center;
    margin: 20px 0;
}

#userAnswer {
    width: 100%;
    padding: 15px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 16px;
    resize: vertical;
}

/* Microphone Input Styling */
.input-with-mic {
    position: relative;
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.input-with-mic textarea {
    flex: 1;
}

.mic-button {
    padding: 15px 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.3s;
    min-width: 60px;
}

.mic-button:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.mic-button.recording {
    background: #dc3545;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.recording-status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #dc3545;
    font-weight: 600;
    margin-top: 10px;
    padding: 10px;
    background: #fee;
    border-radius: 8px;
}

.recording-indicator {
    font-size: 20px;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
}

.sample-answer {
    background: #e8f5e9;
    padding: 12px;
    border-radius: 8px;
    margin: 10px 0;
    border-left: 3px solid #4caf50;
    font-style: italic;
}

.sample-answer-hint {
    font-size: 14px;
    color: #666;
    font-style: italic;
    margin-top: 10px;
}

.options-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 20px 0;
}

.option-label {
    display: flex;
    align-items: center;
    padding: 15px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.option-label:hover {
    border-color: #667eea;
    background: #f0f4ff;
}

.option-label input[type="radio"] {
    margin-right: 10px;
}

.word-bank {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 20px 0;
    padding: 15px;
    background: #fff;
    border-radius: 10px;
}

.word-chip {
    padding: 10px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
}

.word-chip:hover:not(:disabled) {
    background: #5568d3;
    transform: scale(1.05);
}

.word-chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.word-chip.in-sentence {
    background: #4caf50;
}

.sentence-builder {
    min-height: 60px;
    padding: 15px;
    border: 2px dashed #667eea;
    border-radius: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
}

.sentence-builder .placeholder {
    color: #999;
    font-style: italic;
}

.feedback {
    padding: 20px;
    border-radius: 10px;
    margin-top: 20px;
}

.feedback.success {
    background: #d4edda;
    border-left: 4px solid #28a745;
}

.feedback.partial {
    background: #fff3cd;
    border-left: 4px solid #ffc107;
}

.feedback.error {
    background: #f8d7da;
    border-left: 4px solid #dc3545;
}

.feedback-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    font-size: 20px;
    font-weight: 600;
}

.feedback-icon {
    font-size: 32px;
}

.feedback-score {
    margin-left: auto;
    font-size: 24px;
    font-weight: bold;
    color: #667eea;
}

.feedback-message {
    font-size: 16px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 10px;
}

.feedback-tip {
    background: #e7f3ff;
    padding: 12px;
    border-radius: 8px;
    margin: 10px 0;
    border-left: 3px solid #2196f3;
}

.feedback-explanation {
    background: #f0f4ff;
    padding: 12px;
    border-radius: 8px;
    margin: 10px 0;
    border-left: 3px solid #667eea;
}

.feedback-encouragement {
    font-style: italic;
    color: #666;
    margin-top: 10px;
    text-align: center;
}

.exercise-controls {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.btn-primary, .btn-secondary {
    padding: 12px 24px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-secondary {
    background: #f0f0f0;
    color: #333;
}

.btn-secondary:hover {
    background: #e0e0e0;
}

.session-stats {
    display: flex;
    gap: 20px;
    color: white;
    font-size: 14px;
}

.session-stats strong {
    font-size: 18px;
}

.exercise-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.back-btn {
    padding: 8px 16px;
    background: #f0f0f0;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
}

.back-btn:hover {
    background: #e0e0e0;
}

.hidden {
    display: none !important;
}

.loading {
    text-align: center;
    padding: 40px;
    font-size: 18px;
    color: #666;
}

.error-message {
    text-align: center;
    padding: 30px;
    color: #dc3545;
    background: #f8d7da;
    border-radius: 10px;
}

.error-message button {
    margin-top: 15px;
    padding: 10px 20px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

.hint-text {
    background: #fff9e6;
    padding: 10px;
    border-radius: 8px;
    margin-top: 15px;
    font-size: 14px;
    color: #856404;
    border-left: 3px solid #ffc107;
}

.example-text {
    margin-top: 15px;
    padding: 10px;
    background: #f0f4ff;
    border-radius: 8px;
    font-style: italic;
    color: #555;
}

.scenario-text {
    background: #e8f5e9;
    padding: 15px;
    border-radius: 10px;
    margin: 15px 0;
    border-left: 3px solid #4caf50;
}

.conversation-prompt {
    font-size: 18px;
    font-weight: 600;
    margin: 15px 0;
    color: #667eea;
}

.incorrect-sentence {
    background: #ffebee;
    padding: 15px;
    border-radius: 10px;
    margin: 15px 0;
    font-size: 18px;
    border-left: 3px solid #f44336;
}

.close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 28px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
}

@media (max-width: 768px) {
    .practice-modal {
        width: 95%;
        max-height: 95vh;
    }
    
    .practice-content {
        padding: 20px;
    }
    
    .practice-types-grid {
        grid-template-columns: 1fr;
    }
    
    .exercise-controls {
        flex-direction: column;
    }
    
    .input-with-mic {
        flex-direction: column;
    }
    
    .mic-button {
        width: 100%;
    }
}
`;

// ================================================
// INITIALIZE AND EXPORT
// ================================================

// Auto-inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = practiceStyles;
document.head.appendChild(styleSheet);

// Create instance
const practiceMode = new AIPracticeMode();

// Make globally available
window.practiceMode = practiceMode;

// Export for module usage
export default practiceMode;

console.log('✅ Practice Mode Language Fix Applied');
console.log('📚 System now uses:');
console.log('   - TARGET LANGUAGE (targetLanguage) = What user is LEARNING');
console.log('   - TEACHING LANGUAGE (teachingLanguage) = User\'s native language');
console.log('   - Practice questions IN target language');
console.log('   - Instructions/explanations IN teaching language');