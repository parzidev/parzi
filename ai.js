// Chat bot functionality for Parzi AI
async function sendMessage(message, sessionId = null) {
    try {
        const response = await fetch('https://ai.parzi.dev/api/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                session_id: sessionId
            }),
        });

        const data = await response.json();

        if (data.success) {
            console.log('Yanıt:', data.message);
            return {
                message: data.message,
                sessionId: data.session_id
            };

        } else {
            console.error('Hata:', data.error);
            return null;
        }
    } catch (error) {
        console.error('API hatası:', error);
        return null;
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Create chat interface
    createChatInterface();

    const messages = document.getElementById('messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const toggleChat = document.getElementById('toggle-chat');
    const chatContainer = document.querySelector('.chat-container');
    let currentSessionId = null;

    // Toggle chat visibility
    toggleChat.addEventListener('click', function () {
        chatContainer.classList.toggle('chat-minimized');
        const icon = toggleChat.querySelector('i');
        if (chatContainer.classList.contains('chat-minimized')) {
            icon.className = 'fas fa-chevron-down';
        } else {
            icon.className = 'fas fa-chevron-up';
        }
    });

    // Send message function
    async function handleSendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        userInput.value = '';

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot typing';
        typingIndicator.innerHTML = '<div class="message-content">...</div>';
        messages.appendChild(typingIndicator);
        messages.scrollTop = messages.scrollHeight;

        // Send to API
        const response = await sendMessage(message, currentSessionId);

        // Remove typing indicator
        if (typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
        }

        if (response) {
            // Add bot response to chat
            addMessage(response.message, 'bot');
            currentSessionId = response.sessionId;
        } else {
            addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'bot');
        }
    }

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    // Event listeners
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
});

// Create chat interface HTML and CSS
function createChatInterface() {
    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    chatContainer.innerHTML = `
        <div class="chat-header">
            <h3>Parzi AI Chat</h3>
            <button id="toggle-chat">
                <i class="fas fa-chevron-up"></i>
            </button>
        </div>
        <div class="chat-body">
            <div class="messages" id="messages">
                <div class="message bot">
                    <div class="message-content">Merhaba! Size nasıl yardımcı olabilirim?</div>
                </div>
            </div>
            <div class="chat-input">
                <input type="text" id="user-input" placeholder="Mesajınızı yazın...">
                <button id="send-button">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    // Create style element
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .chat-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            background-color: var(--card-bg);
            transition: all 0.3s ease;
        }
        
        .chat-header {
            padding: 15px;
            background-color: var(--accent-color);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }
        
        .chat-header h3 {
            margin: 0;
            font-size: 16px;
        }
        
        .chat-header button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
        }
        
        .chat-body {
            height: 400px;
            display: flex;
            flex-direction: column;
        }
        
        .messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
        }
        
        .message {
            margin-bottom: 10px;
            max-width: 80%;
        }
        
        .message.user {
            margin-left: auto;
        }
        
        .message-content {
            padding: 10px 15px;
            border-radius: 18px;
            display: inline-block;
        }
        
        .user .message-content {
            background-color: var(--accent-color);
            color: white;
            border-radius: 18px 18px 0 18px;
        }
        
        .bot .message-content {
            background-color: var(--secondary-bg);
            color: var(--text-color);
            border-radius: 18px 18px 18px 0;
        }
        
        .chat-input {
            display: flex;
            padding: 10px;
            border-top: 1px solid var(--border-color);
        }
        
        .chat-input input {
            flex: 1;
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: 20px;
            margin-right: 10px;
            background-color: var(--input-bg);
            color: var(--text-color);
        }
        
        .chat-input button {
            background-color: var(--accent-color);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .chat-minimized .chat-body {
            display: none;
        }
    `;

    // Add elements to document
    document.head.appendChild(styleElement);
    document.body.appendChild(chatContainer);
} 