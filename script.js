// Global state
let currentUserType = null;
let currentCreator = null;
let chatHistory = [];
let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Creator data
const CREATORS = [
    { id: 1, name: "Marques Brownlee", specialty: "\"MKBHD\"", avatar: "photos/Marques_Brownlee.jpg", description: "Tech reviewer and YouTuber known for in-depth smartphone and gadget reviews." },
    { id: 2, name: "Austin Evans", specialty: "\"Austin Evans\"", avatar: "photos/AustinEvans.jpeg", description: "Tech YouTuber specializing in PC builds, gaming hardware, and tech reviews." },
    { id: 3, name: "Zack Nelson", specialty: "\"JerryRigEverything\"", avatar: "photos/Zack Nelson.jpeg", description: "Tech YouTuber famous for durability tests and smartphone teardowns." },
    { id: 4, name: "Lewis George Hilsenteger", specialty: "\"Unbox Therapy\"", avatar: "photos/Lewis George Hilsenteger.jpg", description: "Tech YouTuber known for unboxing videos and tech product reviews." }
];

// DOM elements
let homePage, creatorPage, chatPage;
let creatorSearch, searchSuggestions, creatorsGrid;
let messageInput, sendMessageBtn, chatMessages, loadingOverlay;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing app...');
    
    // Get DOM elements
    homePage = document.getElementById('homePage');
    creatorPage = document.getElementById('creatorPage');
    chatPage = document.getElementById('chatPage');
    creatorSearch = document.getElementById('creatorSearch');
    searchSuggestions = document.getElementById('searchSuggestions');
    creatorsGrid = document.getElementById('creatorsGrid');
    messageInput = document.getElementById('messageInput');
    sendMessageBtn = document.getElementById('sendMessageBtn');
    chatMessages = document.getElementById('chatMessages');
    loadingOverlay = document.getElementById('loadingOverlay');
    
    // Verify all elements exist
    const elements = { homePage, creatorPage, chatPage, creatorSearch, searchSuggestions, creatorsGrid, messageInput, sendMessageBtn, chatMessages, loadingOverlay };
    for (const [name, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`❌ Element not found: ${name}`);
        } else {
            console.log(`✅ Element found: ${name}`);
        }
    }
    
    // Initialize app
    initializeApp();
});

function initializeApp() {
    console.log('🔧 Initializing app...');
    
    // Show home page by default
    showPage('home');
    
    // Set up event listeners
    setupEventListeners();
    
    // Populate creators grid
    populateCreatorsGrid();
    
    // Make functions globally accessible
    window.showPage = showPage;
    window.selectRole = selectRole;
    window.selectCreator = selectCreator;
    window.sendMessage = sendMessage;
    window.populateCreatorsGrid = populateCreatorsGrid;
    
    console.log('✅ App initialized successfully');
}

function setupEventListeners() {
    console.log('🎧 Setting up event listeners...');
    
    // Search functionality
    if (creatorSearch) {
        creatorSearch.addEventListener('input', handleCreatorSearch);
        creatorSearch.addEventListener('focus', () => {
            if (creatorSearch.value.length > 0) {
                searchSuggestions.style.display = 'block';
            }
        });
        creatorSearch.addEventListener('blur', () => {
            setTimeout(() => {
                searchSuggestions.style.display = 'none';
            }, 200);
        });
    }
    
    // Message input
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Send message button
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    console.log('✅ Event listeners set up');
}

function showPage(pageName) {
    console.log(`🔄 Showing page: ${pageName}`);
    
    // Get signup page element
    const signupPage = document.getElementById('signupPage');
    
    // Hide all pages
    const pages = [homePage, creatorPage, chatPage, signupPage];
    pages.forEach(page => {
        if (page) {
            page.classList.remove('active');
        }
    });
    
    // Show selected page
    let targetPage;
    switch(pageName) {
        case 'home':
            targetPage = homePage;
            break;
        case 'creator':
            targetPage = creatorPage;
            break;
        case 'chat':
            targetPage = chatPage;
            break;
        case 'signup':
            targetPage = signupPage;
            break;
        default:
            console.error(`❌ Unknown page: ${pageName}`);
            return;
    }
    
    if (targetPage) {
        targetPage.classList.add('active');
        console.log(`✅ Page shown: ${pageName}`);
        
        // Special handling for creator page
        if (pageName === 'creator') {
            setTimeout(() => {
                populateCreatorsGrid();
            }, 100);
        }
    } else {
        console.error(`❌ Target page not found: ${pageName}`);
    }
}

function selectRole(role) {
    console.log(`🎯 Role selected: ${role}`);
    currentUserType = role;
    
    if (role === 'user') {
        showPage('creator');
    } else if (role === 'creator') {
        showPage('signup');
    }
}

function selectCreator(creatorId) {
    console.log(`🎯 Creator selected: ${creatorId}`);
    
    // Find creator
    const creator = CREATORS.find(c => c.id === creatorId);
    if (!creator) {
        console.error(`❌ Creator not found: ${creatorId}`);
        alert('Creator not found!');
        return;
    }
    
    currentCreator = creator;
    console.log(`✅ Creator found: ${creator.name}`);
    
    // Reset session for new creator conversation
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log(`🆕 New session started: ${sessionId}`);
    
    // Update chat interface
    updateChatInterface(creator);
    
    // Navigate to chat page
    showPage('chat');
    
    // Focus on message input
    setTimeout(() => {
        if (messageInput) {
            messageInput.focus();
        }
    }, 100);
}

function updateChatInterface(creator) {
    console.log(`🔄 Updating chat interface for: ${creator.name}`);
    
    // Update creator info in chat header
    const creatorAvatar = document.getElementById('creatorAvatar');
    const creatorName = document.getElementById('creatorName');
    const creatorSpecialty = document.getElementById('creatorSpecialty');
    const welcomeCreatorName = document.getElementById('welcomeCreatorName');
    const welcomeSpecialty = document.getElementById('welcomeSpecialty');
    
    if (creatorAvatar) {
        const avatarImg = creatorAvatar.querySelector('.avatar-img');
        if (avatarImg) {
            avatarImg.src = creator.avatar;
            avatarImg.alt = creator.name;
        }
    }
    if (creatorName) creatorName.textContent = creator.name;
    if (creatorSpecialty) creatorSpecialty.textContent = creator.specialty;
    if (welcomeCreatorName) welcomeCreatorName.textContent = creator.name;
    if (welcomeSpecialty) welcomeSpecialty.textContent = creator.specialty;
    
    // Clear previous chat messages except welcome
    if (chatMessages) {
        const welcomeMessage = chatMessages.querySelector('.welcome-message');
        chatMessages.innerHTML = '';
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }
    }
    
    // Reset chat history
    chatHistory = [];
    
    console.log('✅ Chat interface updated');
}

function populateCreatorsGrid() {
    console.log('🔄 Populating creators grid...');
    
    if (!creatorsGrid) {
        console.error('❌ Creators grid not found');
        return;
    }
    
    const creatorsHTML = CREATORS.map(creator => `
        <div class="creator-card" onclick="selectCreator(${creator.id})" data-creator-id="${creator.id}">
            <div class="creator-card-header">
                <div class="creator-card-avatar">
                    <img src="${creator.avatar}" alt="${creator.name}" class="creator-avatar-img">
                </div>
                <div class="creator-card-info">
                    <h3>${creator.name}</h3>
                    <p>${creator.specialty}</p>
                </div>
            </div>
        </div>
    `).join('');
    
    creatorsGrid.innerHTML = creatorsHTML;
    console.log(`✅ Creators grid populated with ${CREATORS.length} creators`);
}

function handleCreatorSearch() {
    const query = creatorSearch.value.toLowerCase().trim();
    console.log(`🔍 Searching for: "${query}"`);
    
    if (query.length === 0) {
        searchSuggestions.style.display = 'none';
        return;
    }
    
    // Filter creators
    const filteredCreators = CREATORS.filter(creator => 
        creator.name.toLowerCase().includes(query) ||
        creator.specialty.toLowerCase().includes(query) ||
        creator.description.toLowerCase().includes(query)
    );
    
    if (filteredCreators.length === 0) {
        searchSuggestions.innerHTML = '<div class="suggestion-item">No creators found</div>';
    } else {
        searchSuggestions.innerHTML = filteredCreators.map(creator => 
            `<div class="suggestion-item" onclick="selectCreator(${creator.id})">${creator.name}</div>`
        ).join('');
    }
    
    searchSuggestions.style.display = 'block';
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    console.log(`💬 Sending message: "${message}" with session: ${sessionId}`);
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    messageInput.value = '';
    
    // Show loading
    showLoading();
    
    // Call API with conversation context
    callBedrockAPI(message, currentCreator)
        .then(response => {
            console.log('✅ API response received with context');
            addMessageToChat('ai', response);
        })
        .catch(error => {
            console.error('❌ API error:', error);
            addMessageToChat('ai', 'Sorry, I encountered an error. Please try again.');
        })
        .finally(() => {
            hideLoading();
        });
}

function addMessageToChat(role, content) {
    console.log(`📝 Adding ${role} message to chat`);
    
    if (!chatMessages) {
        console.error('❌ Chat messages container not found');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const avatar = role === 'user' ? 'U' : (currentCreator ? currentCreator.avatar : 'AI');
    
    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <button class="message-avatar-btn">U</button>
            </div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
    } else {
        // Get initials from creator name
        const initials = currentCreator ? currentCreator.name.split(' ').map(n => n[0]).join('') : 'AI';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <button class="message-avatar-btn">${initials}</button>
            </div>
            <div class="message-content">
                <div class="formatted-content">${formatMarkdown(content)}</div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add to chat history
    chatHistory.push({ role, content });
}

function formatMarkdown(text) {
    // Convert markdown to HTML
    return text
        // Links [text](url) - must be first before other formatting
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Bold text **text** or __text__
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic text *text* or _text_
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Code `text`
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Lists - convert * to bullet points
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        // Wrap consecutive list items in ul
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        // Headers # ## ###
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>');
}

function callBedrockAPI(message, creator) {
    console.log(`🌐 Calling Groq API for creator: ${creator.name} with session: ${sessionId}`);
    
    const systemPrompt = `You are ${creator.name}, a ${creator.specialty} expert. ${creator.description}. Respond as this character would, being helpful and knowledgeable in your field. Remember our conversation context and refer to previous messages when relevant.`;
    
    return fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            creator: creator.name,
            systemPrompt: systemPrompt,
            sessionId: sessionId  // Include session ID for conversation context
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        console.log(`💬 Context: ${data.messageCount} messages in session ${data.sessionId}`);
        return data.response;
    });
}

function showLoading() {
    console.log('⏳ Showing loading...');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

function hideLoading() {
    console.log('✅ Hiding loading...');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

// Debug functions
window.debugApp = function() {
    console.log('🐛 Debug Info:');
    console.log('Current user type:', currentUserType);
    console.log('Current creator:', currentCreator);
    console.log('Chat history:', chatHistory);
    console.log('DOM elements:', {
        homePage: !!homePage,
        creatorPage: !!creatorPage,
        chatPage: !!chatPage,
        creatorsGrid: !!creatorsGrid,
        messageInput: !!messageInput
    });
};

console.log('📜 Script loaded successfully');

// Voice Chat Modal Functionality
let voiceRecognition = null;
let isVoiceListening = false;
let isVoiceSpeaking = false;
let voiceMicrophoneBtn = null;
let voiceChatMessages = null;
let voiceStatus = null;
let currentAudio = null;
async function callElevenLabsAPI(text) {
    const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        throw new Error(`TTS error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return audio;
}
function openVoiceChat() {
    const modal = document.getElementById('voiceChatModal');
    modal.classList.add('active');
    
    // Clear previous voice messages if any
    if (voiceChatMessages) {
        voiceChatMessages.innerHTML = '<div class="voice-welcome"><p>🎤 Voice conversation starting...</p></div>';
    }
    
    // Initialize voice recognition for modal
    initVoiceChatRecognition();
    
    // Auto-start listening after a short delay
    setTimeout(() => {
        if (voiceRecognition && !isVoiceListening) {
            toggleVoiceMicrophone();
        }
    }, 500);
}

// Close Voice Chat Modal
function closeVoiceChat() {
    const modal = document.getElementById('voiceChatModal');
    modal.classList.remove('active');
    
    // Stop listening
    if (voiceRecognition && isVoiceListening) {
        voiceRecognition.stop();
    }
    
    // Stop audio playback
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Stop avatar speaking animation - pause video
    const avatarVideo = document.getElementById('avatarVideo');
    const avatarSoundwave = document.getElementById('avatarSoundwave');
    if (avatarVideo) {
        avatarVideo.pause();
    }
    if (avatarSoundwave) {
        avatarSoundwave.classList.remove('active');
    }
    
    // Reset speaking state
    if (isVoiceSpeaking) {
        stopVoiceSpeaking();
    }
}

// Initialize Voice Chat Recognition
function initVoiceChatRecognition() {
    voiceChatMessages = document.getElementById('voiceChatMessages');
    voiceMicrophoneBtn = document.getElementById('voiceMicrophoneBtn');
    voiceStatus = document.getElementById('voiceStatus');
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        voiceRecognition = new SpeechRecognition();
        voiceRecognition.continuous = true;
        voiceRecognition.interimResults = true;
        voiceRecognition.lang = 'en-US';
        
        voiceRecognition.onstart = function() {
            console.log('🎤 Voice listening...');
            isVoiceListening = true;
            voiceMicrophoneBtn.classList.add('listening');
            voiceStatus.textContent = 'Listening...';
        };
        
        voiceRecognition.onresult = function(event) {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            
            if (finalTranscript.trim() && !isVoiceSpeaking) {
                console.log('✅ Voice heard:', finalTranscript);
                sendVoiceMessage(finalTranscript.trim());
            }
        };
        
        voiceRecognition.onerror = function(event) {
            console.error('❌ Voice recognition error:', event.error);
            if (event.error !== 'no-speech') {
                voiceMicrophoneBtn.classList.remove('listening');
                isVoiceListening = false;
                voiceStatus.textContent = 'Error occurred';
            }
        };
        
        voiceRecognition.onend = function() {
            console.log('🎤 Voice stopped listening');
            if (isVoiceListening && !isVoiceSpeaking) {
                setTimeout(() => {
                    if (isVoiceListening && !isVoiceSpeaking) {
                        voiceRecognition.start();
                    }
                }, 100);
            }
        };
    } else {
        console.log('⚠️ Speech recognition not supported');
        voiceStatus.textContent = 'Not supported';
    }
}

// Toggle Voice Microphone
function toggleVoiceMicrophone() {
    if (!voiceRecognition) {
        alert('Speech recognition is not supported. Please use Chrome or Edge.');
        return;
    }
    
    if (isVoiceListening) {
        voiceRecognition.stop();
        voiceMicrophoneBtn.classList.remove('listening');
        isVoiceListening = false;
        voiceStatus.textContent = 'Click to speak';
    } else {
        voiceRecognition.start();
        voiceStatus.textContent = 'Starting...';
    }
}

// Send Voice Message
async function sendVoiceMessage(message) {
    // Don't add user message to voice chat - keep it clean
    // addVoiceMessage('user', message);
    
    // Also add to main chat to maintain history
    addMessageToChat('user', message);
    
    voiceStatus.textContent = 'Thinking...';
    
    try {
        const response = await callBedrockAPI(message, currentCreator);
        
        // Add AI response to voice chat
        addVoiceMessage('ai', response);
        
        // Also add to main chat to maintain history
        addMessageToChat('ai', response);
        
        // Speak the response
        await speakWithElevenLabs(response);
        
    } catch (error) {
        console.error('❌ API error:', error);
        voiceStatus.textContent = 'Error occurred';
        
        // Resume listening on error
        if (isVoiceListening && voiceRecognition) {
            setTimeout(() => {
                if (isVoiceListening && !isVoiceSpeaking) {
                    voiceRecognition.start();
                }
            }, 1000);
        }
    }
}

// Add Message to Voice Chat
function addVoiceMessage(role, content) {
    // Don't add AI messages to chat when video is playing (just keep it clean)
    if (role === 'ai' && isVoiceSpeaking) {
        return; // Skip adding text to chat when speaking
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `voice-message ${role}`;
    
    // Remove links from voice messages
    let cleanContent = content.replace(/\[([^\]]+)\]\([^)]+\)/g, ''); // Remove all links
    
    if (role === 'ai') {
        // Don't stream for AI - just show minimal text or hide it
        messageDiv.style.display = 'none'; // Hide AI messages in voice chat
        messageDiv.textContent = cleanContent;
        voiceChatMessages.appendChild(messageDiv);
    } else {
        // User messages appear instantly
        messageDiv.textContent = cleanContent;
        voiceChatMessages.appendChild(messageDiv);
        voiceChatMessages.scrollTop = voiceChatMessages.scrollHeight;
    }
}

// Stream text with typewriter effect
function streamText(element, text) {
    let index = 0;
    const speed = 15; // milliseconds per character
    
    function typeChar() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            voiceChatMessages.scrollTop = voiceChatMessages.scrollHeight;
            setTimeout(typeChar, speed);
        }
    }
    
    typeChar();
}

// Generate Summary for Voice
function generateVoiceSummary(text) {
    let cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    cleanText = cleanText.replace(/\*\*/g, '');
    cleanText = cleanText.replace(/\*/g, '');
    
    const sentences = cleanText.split(/[.!?]/);
    let summary = '';
    
    for (let i = 0; i < sentences.length && summary.length < 200; i++) {
        summary += sentences[i].trim() + '. ';
    }
    
    if (summary.length < 50) {
        summary = cleanText.substring(0, 200);
    }
    
    return summary.trim();
}

// Speak with ElevenLabs
async function speakWithElevenLabs(text) {
    isVoiceSpeaking = true;
    voiceMicrophoneBtn.classList.add('speaking');
    voiceStatus.textContent = 'Speaking...';
    
    const summary = generateVoiceSummary(text);
    console.log('📝 Voice summary:', summary);
    
    try {
        const audio = await callElevenLabsAPI(summary);
        currentAudio = audio; // Store reference to current audio
        
        // Start avatar speaking animation - activate logo pulse
        audio.onplay = function() {
            const voiceLogo = document.getElementById('voiceLogo');
            const avatarSoundwave = document.getElementById('avatarSoundwave');
            
            if (avatarSoundwave) {
                avatarSoundwave.classList.add('active');
            }
            
            // Start audio analysis for pitch-based scaling
            analyzeAudioAndScaleLogo(audio, voiceLogo);
        };
        
        audio.onended = function() {
            console.log('🔊 Finished speaking');
            isVoiceSpeaking = false;
            currentAudio = null; // Clear reference
            voiceMicrophoneBtn.classList.remove('speaking');
            
            // Stop avatar speaking animation
            const voiceLogo = document.getElementById('voiceLogo');
            const avatarSoundwave = document.getElementById('avatarSoundwave');
            
            if (voiceLogo) {
                voiceLogo.style.transform = 'scale(1)';
            }
            if (avatarSoundwave) {
                avatarSoundwave.classList.remove('active');
            }
            
            // Resume listening
            if (isVoiceListening && voiceRecognition) {
                voiceStatus.textContent = 'Listening...';
                setTimeout(() => {
                    if (isVoiceListening && !isVoiceSpeaking) {
                        voiceRecognition.start();
                    }
                }, 500);
            } else {
                voiceStatus.textContent = 'Click to speak';
            }
        };
        
        audio.onerror = function(event) {
            console.error('❌ Audio error:', event);
            isVoiceSpeaking = false;
            currentAudio = null; // Clear reference
            voiceMicrophoneBtn.classList.remove('speaking');
            
            // Stop avatar speaking animation
            const voiceLogo = document.getElementById('voiceLogo');
            const avatarSoundwave = document.getElementById('avatarSoundwave');
            
            if (voiceLogo) {
                voiceLogo.style.transform = 'scale(1)';
            }
            if (avatarSoundwave) {
                avatarSoundwave.classList.remove('active');
            }
            
            voiceStatus.textContent = 'Error occurred';
        };
        
        audio.play();
    } catch (error) {
        console.error('❌ ElevenLabs error:', error);
        isVoiceSpeaking = false;
        voiceMicrophoneBtn.classList.remove('speaking');
        voiceStatus.textContent = 'Error occurred';
    }
}

// Analyze Audio and Scale Logo
function analyzeAudioAndScaleLogo(audio, logoElement) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);
    
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    function animate() {
        if (audio.ended || audio.paused) {
            if (logoElement) {
                logoElement.style.transform = 'scale(1)';
            }
            return;
        }
        
        requestAnimationFrame(animate);
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average frequency (pitch indicator)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Scale logo based on intensity (0-255, map to 1.0 - 1.4 scale)
        const scale = 1.0 + (average / 255) * 0.4; // Scales from 1.0 to 1.4
        
        if (logoElement) {
            logoElement.style.transform = `scale(${scale})`;
        }
    }
    
    animate();
}

function stopVoiceSpeaking() {
    isVoiceSpeaking = false;
    if (voiceMicrophoneBtn) {
        voiceMicrophoneBtn.classList.remove('speaking');
    }
    if (voiceStatus) {
        voiceStatus.textContent = 'Click to speak';
    }
}

// Validate Email with Regex
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate US Phone Number with Regex
function validatePhone(phone) {
    // Accepts: (555) 123-4567, 555-123-4567, 5551234567, 555 123 4567
    const phoneRegex = /^(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    return phoneRegex.test(phone);
}

// Handle Creator Signup Form
function handleCreatorSignup(event) {
    if (event) {
        event.preventDefault();
    }
    
    // Trigger confetti animation
    triggerSuccessConfetti();
    
    // Show success modal after delay (confetti plays first, then popup)
    setTimeout(() => {
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.classList.add('active');
        } else {
            // Fallback to alert if modal not found
            alert('Thank you for registering with us. We will authenticate your credentials and get back to you soon.');
            showPage('home');
        }
    }, 1000); // 1 second delay (0.5s confetti start + 0.5s extra delay)
}

// Trigger Confetti Animation for Success
function triggerSuccessConfetti() {
    // Multiple bursts from different positions
    const duration = 3000;
    const end = Date.now() + duration;
    
    const colors = ['#0ea5e9', '#06b6d4', '#ffffff', '#0ea5e9', '#06b6d4'];
    
    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });
        
        confetti({
            particleCount: 5,
            angle: 90,
            spread: 55,
            origin: { x: 0.5, y: 0 },
            colors: colors
        });
        
        confetti({
            particleCount: 3,
            angle: 45,
            spread: 40,
            origin: { x: 0.2, y: 0 },
            colors: colors
        });
        
        confetti({
            particleCount: 3,
            angle: 135,
            spread: 40,
            origin: { x: 0.8, y: 0 },
            colors: colors
        });
        
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
    
    // Add a special burst in the center
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.5, x: 0.5 },
            colors: colors
        });
    }, 200);
}

// Go to Home Page from Success Modal
function goToHomePage() {
    console.log('🏠 Going to home page');
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('active');
    }
    showPage('home');
}

// Make functions globally accessible
window.handleCreatorSignup = handleCreatorSignup;
window.goToHomePage = goToHomePage;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    voiceMicrophoneBtn = document.getElementById('voiceMicrophoneBtn');
    voiceChatMessages = document.getElementById('voiceChatMessages');
    voiceStatus = document.getElementById('voiceStatus');
    
    // Attach form handler
    const creatorSignupForm = document.getElementById('creatorSignupForm');
    if (creatorSignupForm) {
        creatorSignupForm.addEventListener('submit', handleCreatorSignup);
        console.log('✅ Creator signup form handler attached');
    }
});
