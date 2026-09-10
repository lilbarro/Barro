import { loadConfig } from './functions.js';

/**
 * AIProvider Module
 *
 * Provides a generic interface to interact with configured AI providers
 * (Gemini, Groq, OpenAI, Ollama) based on the bot's config.yaml.
 */
class AIProvider {
    async request(prompt, options = {}) {
        const config = loadConfig();
        const provider = options.provider || config.ai?.default_provider || 'gemini';
        const signal = options.signal;

        const providerConfig = config.ai?.[provider];
        if (!providerConfig) {
            throw new Error(`Provider ${provider} not found in config.yaml`);
        }

        const apiKey = providerConfig.api_key;
        const model = providerConfig.model;

        if (!apiKey && provider !== 'ollama') {
            throw new Error(`API key not found for provider: ${provider}`);
        }

        const messages = [
            { role: 'system', content: options.systemPrompt || 'You are a professional digital intelligence analyst.' },
            { role: 'user', content: prompt }
        ];

        if (provider === 'gemini') {
            return this._callGemini(apiKey, model, messages, signal);
        } else if (provider === 'groq') {
            return this._callGroq(apiKey, model, messages, signal);
        } else if (provider === 'ollama') {
            return this._callOllama(providerConfig, messages, signal);
        } else {
            throw new Error(`Unsupported AI provider: ${provider}`);
        }
    }

    async _callGemini(apiKey, model, messages, signal) {
        const systemMessage = messages.find(m => m.role === 'system');
        const contents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
                    contents,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
                })
            }
        );

        if (!response.ok) throw new Error(`Gemini API error ${response.status}`);
        const json = await response.json();
        return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No analysis generated.';
    }

    async _callGroq(apiKey, model, messages, signal) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            signal,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) throw new Error(`Groq API error ${response.status}`);
        const json = await response.json();
        return json.choices?.[0]?.message?.content?.trim() || 'No analysis generated.';
    }

    async _callOllama(config, messages, signal) {
        const baseUrl = config.base_url || 'http://127.0.0.1:11434';
        const model = config.model;

        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
            method: 'POST',
            signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                options: { temperature: 0.7 }
            })
        });

        if (!response.ok) throw new Error(`Ollama API error ${response.status}`);
        const json = await response.json();
        return json.message?.content?.trim() || 'No analysis generated.';
    }
}

export default new AIProvider();