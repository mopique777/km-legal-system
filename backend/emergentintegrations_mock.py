import asyncio

class UserMessage:
    def __init__(self, text):
        self.text = text

class LlmChat:
    def __init__(self, api_key=None, session_id=None, system_message=None):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.model_provider = "openai"
        self.model_name = "gpt-4"

    def with_model(self, provider, model):
        self.model_provider = provider
        self.model_name = model
        return self

    async def send_message(self, message):
        # Mock response for testing
        return f"This is a mock response from {self.model_provider} ({self.model_name}). Original message: {message.text}"
