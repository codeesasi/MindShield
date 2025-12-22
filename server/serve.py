import os
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate

# Configure LangSmith for logging
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["LANGCHAIN_API_KEY"] = "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"  # Replace with your actual API key

# Initialize Ollama chat model
llm = ChatOllama(
    model="gemma3:latest",
    temperature=0.7,
    base_url="http://localhost:11434"  # Default Ollama URL
)

# Example 1: Simple chat
print("=== Example 1: Simple Chat ===")
messages = [
    SystemMessage(content="You are a helpful AI assistant."),
    HumanMessage(content="What is the capital of France?")
]
response = llm.invoke(messages)
print(f"Response: {response.content}\n")

# Example 2: Using ChatPromptTemplate
print("=== Example 2: Using Prompt Template ===")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a {role} assistant."),
    ("human", "{question}")
])

chain = prompt | llm

response = chain.invoke({
    "role": "friendly and knowledgeable",
    "question": "Explain quantum computing in simple terms."
})
print(f"Response: {response.content}\n")

# Example 3: Streaming responses
print("=== Example 3: Streaming Response ===")
messages = [
    SystemMessage(content="You are a creative storyteller."),
    HumanMessage(content="Tell me a short story about a robot learning to paint.")
]

print("Streaming response:")
for chunk in llm.stream(messages):
    print(chunk.content, end="", flush=True)
print("\n")

# Example 4: Interactive chat loop
print("=== Example 4: Interactive Chat (type 'quit' to exit) ===")
chat_history = [
    SystemMessage(content="You are a helpful AI assistant. Keep responses concise.")
]

while True:
    user_input = input("\nYou: ")
    if user_input.lower() in ['quit', 'exit', 'q']:
        print("Goodbye!")
        break
    
    chat_history.append(HumanMessage(content=user_input))
    
    response = llm.invoke(chat_history)
    print(f"Assistant: {response.content}")
    
    chat_history.append(response)