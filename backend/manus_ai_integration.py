import asyncio
import os
from openai import OpenAI

class UserMessage:
    def __init__(self, text):
        self.text = text

class LlmChat:
    def __init__(self, api_key=None, session_id=None, system_message=None):
        self.api_key = api_key or os.getenv("MANUS_AI_KEY")
        self.session_id = session_id
        self.system_message = system_message
        self.model_provider = "openai"
        self.model_name = "gpt-4.1-mini"
        
        # Initialize OpenAI client if key is available
        self.client = None
        if self.api_key and self.api_key != "your_manus_ai_key_here":
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception:
                self.client = None

    def with_model(self, provider, model):
        self.model_provider = provider
        self.model_name = model
        return self

    async def send_message(self, message):
        if self.client:
            try:
                messages = []
                if self.system_message:
                    messages.append({"role": "system", "content": self.system_message})
                messages.append({"role": "user", "content": message.text})
                
                response = self.client.chat.completions.create(
                    model=self.model_name if self.model_provider == "openai" else "gpt-4.1-mini",
                    messages=messages
                )
                return response.choices[0].message.content
            except Exception as e:
                return f"Manus AI Error: {str(e)}"
        
        # Fallback to smart mock if no API key
        await asyncio.sleep(1) # Simulate thinking
        return f"مرحباً! أنا مساعد Manus الذكي. لقد استلمت رسالتك: '{message.text}'. حالياً أعمل في وضع المعاينة، وعند ربط مفتاح API سأتمكن من تقديم تحليل قانوني كامل."
