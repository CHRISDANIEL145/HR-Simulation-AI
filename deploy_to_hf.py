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
    
    # List files to upload
    print("\n📁 Files to upload:")
    for root, dirs, files in os.walk("huggingface-space"):
        for file in files:
            filepath = os.path.join(root, file)
            print(f"   - {filepath}")
    
    # Upload the huggingface-space folder
    try:
        upload_folder(
            folder_path="huggingface-space",
            repo_id=repo_id,
            repo_type="space",
            commit_message="Deploy complete premium UI application",
            allow_patterns=["*"],
        )
        print(f"\n✅ Files uploaded successfully!")
        print(f"\n🎉 Your app is deploying at:")
        print(f"   https://huggingface.co/spaces/{repo_id}")
        print(f"\n⚠️  Don't forget to add your GROQ_API_KEY secret in Space settings!")
    except Exception as e:
        print(f"❌ Upload error: {e}")

if __name__ == "__main__":
    deploy()
