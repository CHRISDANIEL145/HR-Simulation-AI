"""
Deploy HR-AI Interview Platform to Hugging Face Spaces
Run: python deploy_to_hf.py
"""

from huggingface_hub import HfApi, create_repo, upload_folder
import os

# Configuration
SPACE_NAME = "HR-AI-Interview"  # Change this to your desired space name
USERNAME = "Danielchris145"      # Your HuggingFace username

def deploy():
    print("🚀 Deploying to Hugging Face Spaces...")
    
    api = HfApi()
    
    # Create the space (Docker SDK)
    repo_id = f"{USERNAME}/{SPACE_NAME}"
    
    try:
        create_repo(
            repo_id=repo_id,
            repo_type="space",
            space_sdk="docker",
            private=False,
            exist_ok=True
        )
        print(f"✅ Space created/exists: https://huggingface.co/spaces/{repo_id}")
    except Exception as e:
        print(f"Note: {e}")
    
    # Upload the huggingface-space folder
    try:
        upload_folder(
            folder_path="huggingface-space",
            repo_id=repo_id,
            repo_type="space",
        )
        print(f"✅ Files uploaded successfully!")
        print(f"\n🎉 Your app is deploying at:")
        print(f"   https://huggingface.co/spaces/{repo_id}")
        print(f"\n⚠️  Don't forget to add your GROQ_API_KEY secret in Space settings!")
    except Exception as e:
        print(f"❌ Upload error: {e}")

if __name__ == "__main__":
    deploy()
