import React, { useState, useEffect, useRef } from 'react';
import { MainServices } from '../../services/MainServices'; // Adjust path based on your directory structure

function AgenticDashboard() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    // Auto-scroll anchor for mobile PWA viewports
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Trigger auto-scroll every time a new text token or status drops down the stream
    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    // Optional: Fetch historical message logs on initial PWA mount
    // Locate this block near the top of your AgenticDashboard component:
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await MainServices.getRequest('/api/v1/agent/history');
                if (response && response.success) {
                    // THE FIX: Filter out backend structural logs (like role: 'tool') 
                    // and keep only human-readable text interactions
                    const readableHistory = response.data.filter(msg => 
                        (msg.role === 'user' || msg.role === 'assistant') && 
                        typeof msg.content === 'string' && 
                        msg.content.trim() !== ''
                    );

                    setMessages(readableHistory);
                    console.log("Filtered displayable historical messages:", readableHistory);
                }
            } catch (error) {
                console.error("Failed to hydrate chat history state:", error);
            }
        };
        loadHistory();
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userPrompt = input;
        setInput('');
        setIsThinking(true);

        // 1. Immediately append the user message to the UI state
        setMessages((prev) => [...prev, { role: 'user', content: userPrompt }]);

        // 2. Insert a placeholder assistant message that will accumulate incoming tokens
        setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: '', isStreaming: true, systemStatus: null }
        ]);

        try {
            // 3. Connect to your Render backend via the authenticated stream service
            await MainServices.postStreamRequest('/api/v1/agent/talk', { prompt: userPrompt }, (streamEvent) => {
                const { event, data } = streamEvent;
                console.log("Incoming Stream Chunk:", { event, data }); // Inspect this in DevTools!
            
                setMessages((prev) => {
                    if (prev.length === 0) return prev;
            
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    
                    // Target the message, but do NOT mutate it directly
                    const lastMessage = updated[lastIndex];
                    if (!lastMessage || lastMessage.role !== 'assistant') return prev;
            
                    // 1. CHANGE THIS: Match whatever string event prints out in your console log (usually 'message')
                    if (event === 'message' || event === 'content') {
                        let textDelta = data.delta;
                        console.log("Delta 1", data.delta)

                        if (typeof data === 'string') {
                            textDelta = data;
                            console.log("Delta 2")
                        } 
                        else if (data && data.choices?.[0]?.delta?.content) {
                            console.log("Delta 3")
                            textDelta = data.choices[0].delta.content;
                        } 
                        else if (data && data.text) {
                            console.log("Delta 4")
                            textDelta = data.text;
                        }
                        console.log("Delta 5", textDelta)
                        // 2. THE FIX: Create a brand new object reference so React forces a UI re-render
                        updated[lastIndex] = {
                            ...lastMessage,
                            content: lastMessage.content + textDelta
                        };
                    } 
                    // Scenario B: Handling tool calls
                    else if (event === 'tool_call') {
                        updated[lastIndex] = {
                            ...lastMessage,
                            systemStatus: `Executing database pipeline: ${data.name}...`
                        };
                    } 
                    // Scenario C: Handling tool outcome returns
                    else if (event === 'tool_result') {
                        updated[lastIndex] = {
                            ...lastMessage,
                            systemStatus: `Database updated cleanly. Finalizing answer...`
                        };
                    }
                    // Scenario D: Handling stream end tags
                    else if (event === 'done') {
                        updated[lastIndex] = {
                            ...lastMessage,
                            isStreaming: false,
                            systemStatus: null
                        };
                    }
            
                    return updated;
                });
            
                if (event === 'done') {
                    setIsThinking(false);
                }
            });

        } catch (error) {
            console.error("Stream generation loop crashed:", error);
            setMessages((prev) => [
                ...prev,
                { role: 'system', content: 'Connection lost. Please check your cloud infrastructure status.' }
            ]);
            setIsThinking(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Header Area */}
            <header style={styles.header}>
                <h1 style={styles.headerTitle}>Wealth Ledger Agent</h1>
                <span style={styles.statusBadge}>Cloud Sync Online</span>
            </header>

            {/* Scrollable Chat Window Frame */}
            <div style={styles.chatWindow}>
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        style={{
                            ...styles.messageBubble,
                            ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble)
                        }}
                    >
                        <div style={styles.roleLabel}>
                            {msg.role === 'user' ? 'You' : 'System Agent'}
                        </div>
                        
                        {msg.content && <p style={styles.messageText}>{msg.content}</p>}
                        
                        {/* Real-time Tool Execution Status Overlay */}
                        {msg.systemStatus && (
                            <div style={styles.statusContainer}>
                                <div style={styles.spinner}></div>
                                <span style={styles.statusText}>{msg.systemStatus}</span>
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Visual indicator when initial handshakes are processing */}
                {isThinking && messages[messages.length - 1]?.content === '' && !messages[messages.length - 1]?.systemStatus && (
                    <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
                        <span style={styles.thinkingText}>Thinking...</span>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Submission Bar */}
            <form onSubmit={handleSendMessage} style={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask agent or log transaction (e.g., spent $12 on lunch)"
                    disabled={isThinking}
                    style={styles.inputField}
                />
                <button 
                    type="submit" 
                    disabled={isThinking || !input.trim()} 
                    style={{
                        ...styles.sendButton,
                        ...((isThinking || !input.trim()) ? styles.disabledButton : {})
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

// Minimalistic CSS-in-JS style configurations optimized for Mobile PWA containers
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#111827',
        color: '#f3f4f6',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
        padding: '16px',
        backgroundColor: '#1f2937',
        borderBottom: '1px solid #374151',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: { fontSize: '18px', margin: 0, fontWeight: '600' },
    statusBadge: { fontSize: '12px', color: '#10b981', backgroundColor: '#065f46', padding: '4px 8px', borderRadius: '12px' },
    chatWindow: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    messageBubble: {
        maxWidth: '85%',
        padding: '12px 16px',
        borderRadius: '16px',
        lineHeight: '1.5',
        fontSize: '15px'
    },
    userBubble: {
        backgroundColor: '#2563eb',
        color: '#ffffff',
        alignSelf: 'flex-end',
        borderBottomRightRadius: '4px'
    },
    assistantBubble: {
        backgroundColor: '#1f2937',
        color: '#f3f4f6',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: '4px',
        border: '1px solid #374151'
    },
    roleLabel: { fontSize: '11px', opacity: 0.7, marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' },
    messageText: { margin: 0, whiteSpace: 'pre-wrap' },
    inputArea: {
        display: 'flex',
        padding: '16px',
        backgroundColor: '#1f2937',
        borderTop: '1px solid #374151',
        gap: '12px'
    },
    inputField: {
        flex: 1,
        backgroundColor: '#374151',
        border: 'none',
        borderRadius: '8px',
        padding: '12px',
        color: '#ffffff',
        fontSize: '15px',
        outline: 'none'
    },
    sendButton: {
        backgroundColor: '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '0 20px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    disabledButton: { backgroundColor: '#4b5563', cursor: 'not-allowed', opacity: 0.6 },
    thinkingText: { color: '#9ca3af', fontStyle: 'italic' },
    statusContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #374151',
        color: '#60a5fa',
        fontSize: '13px'
    },
    spinner: {
        width: '14px',
        height: '14px',
        border: '2px solid #3b82f6',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    }
};

export default AgenticDashboard;