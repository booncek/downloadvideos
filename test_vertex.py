import vertexai
from vertexai.generative_models import GenerativeModel

# TODO: Replace with your actual Google Cloud Project ID
PROJECT_ID = "downloadvideo-488615" 
REGION = "us-central1"

def verify_vertex_connection():
    try:
        # Initialize the Vertex AI SDK
        vertexai.init(project=PROJECT_ID, location=REGION)
        
        # Load the model
        model = GenerativeModel("gemini-2.5-flash")
        
        # Test a simple prompt
        response = model.generate_content("Is Vertex AI API active? Reply with 'Connection Successful!'")
        
        print("-" * 30)
        print(f"Response: {response.text}")
        print("-" * 30)
        
    except Exception as e:
        print(f"Error connecting to Vertex AI: {e}")
        print("\nTip: Make sure you've run 'gcloud auth application-default login' in your terminal.")

if __name__ == "__main__":
    verify_vertex_connection()