import shutil

# app.py
import streamlit as st
import requests
from pathlib import Path
import tempfile
import base64 
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv() 

def get_download_link(file_path, link_text, mime_type):
    with open(file_path, 'rb') as f:
        data = f.read()
    b64 = base64.b64encode(data).decode()
    return f'<a href="data:{mime_type};base64,{b64}" download="{file_path.name}" class="download-button">{link_text}</a>'

def main():
    st.set_page_config(
        page_title="PaperSynth - AI Research Paper Workbench",
        page_icon="🔬",
        initial_sidebar_state="collapsed"
    )

    # Custom CSS
    st.markdown("""
        <style>
        /* CSS Variables for theming */
        :root {{
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --bg-accent: #f1f5f9;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --border-color: #e2e8f0;
            --about-bg: #f8fafc;
            --about-border: #667eea;
            --footer-bg: #1f2937;
            --footer-text: #ffffff;
        }}
        
        /* Remove scrollbars and ensure proper layout */
        .stApp {{
            overflow: hidden !important;
        }}
        
        .main {{
            overflow: visible !important;
            max-height: 100vh !important;
        }}
        
        /* Hide scrollbars but keep functionality */
        .stApp, .main, [data-testid="stAppViewContainer"] {{
            scrollbar-width: none !important; /* Firefox */
            -ms-overflow-style: none !important; /* Internet Explorer 10+ */
        }}
        
        .stApp::-webkit-scrollbar, .main::-webkit-scrollbar, [data-testid="stAppViewContainer"]::-webkit-scrollbar {{
            width: 0px !important;
            background: transparent !important; /* Chrome/Safari/Opera */
        }}
        
        /* Apply theme to Streamlit elements */
        .stApp > div:first-child {{
            background-color: var(--bg-primary);
            color: var(--text-primary);
        }}
        
        /* Main container */
        .main {{ 
            padding: 1.5rem; 
            max-width: 800px;
            background-color: var(--bg-primary);
            color: var(--text-primary);
        }}
        
        /* About section styling - enhanced visibility */
        .about-section {{
            background: var(--about-bg) !important;
            border: 3px solid var(--about-border) !important;
            border-radius: 12px !important;
            padding: 1.5rem !important;
            margin: 1.5rem 0 !important;
            box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3) !important;
            position: relative !important;
        }}
        
        .about-section::before {{
            content: '';
            position: absolute;
            top: -3px;
            left: -3px;
            right: -3px;
            bottom: -3px;
            background: linear-gradient(135deg, var(--about-border), #764ba2);
            border-radius: 15px;
            z-index: -1;
        }}
        
        .about-content {{
            background: var(--about-bg) !important;
            color: var(--text-primary) !important;
            padding: 1rem !important;
            border-radius: 8px !important;
            position: relative;
            z-index: 1;
        }}
        
        /* Remove default streamlit spacing */
        .block-container {{
            padding-top: 1rem;
            padding-bottom: 1rem;
            background-color: var(--bg-primary);
        }}
        
        /* Theme toggle button */
        .theme-toggle {{
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }}
        
        .theme-toggle:hover {{
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }}
        
        /* Consistent button styling for all buttons */
        .stButton>button {{ 
            width: 100% !important; 
            margin-top: 0.5rem !important;
            padding: 0.5rem 1rem !important;
            border-radius: 0.5rem !important;
            border: none !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            font-weight: 600 !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
        }}
        .stButton>button:hover {{
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
        }}
        
        /* Consistent info boxes */
        .info-box {{ 
            padding: 1.2rem;
            border-radius: 0.8rem;
            background: var(--bg-secondary);
            border-left: 4px solid #667eea;
            margin: 1rem 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            color: var(--text-primary);
        }}
        
        /* Success message styling */
        .success-message {{
            padding: 1.2rem;
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
            border-radius: 0.8rem;
            margin: 1rem 0;
            border-left: 4px solid #10b981;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
            font-weight: 500;
        }}
        
        /* Presenter notes styling */
        .presenter-notes {{
            padding: 1.2rem;
            background: var(--bg-secondary);
            border-left: 4px solid #6366f1;
            border-radius: 0.8rem;
            margin: 1rem 0;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
            color: var(--text-primary);
        }}
        
        /* Footer styling */
        .footer-section {{
            background: var(--footer-bg);
            color: var(--footer-text);
            border-radius: 0.8rem;
            padding: 1.5rem;
            margin: 1rem 0;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }}
        
        /* Consistent tab styling */
        .stTabs [data-baseweb="tab-list"] {{
            gap: 0.5rem;
        }}
        .stTabs [data-baseweb="tab"] {{
            padding: 0.5rem 1rem;
            border-radius: 0.5rem 0.5rem 0 0;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
        }}
        .stTabs [aria-selected="true"] {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }}
        
        /* File uploader styling */
        .stFileUploader > div > div {{
            background-color: var(--bg-secondary);
            border: 2px dashed var(--border-color);
            border-radius: 0.8rem;
            padding: 1rem;
        }}
        
        /* Download button consistency */
        .stDownloadButton > button {{
            width: 100%;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            font-weight: 600;
            margin: 0.5rem 0;
            transition: all 0.2s ease;
        }}
        .stDownloadButton > button:hover {{
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }}
        
        /* Radio button styling */
        .stRadio > div {{
            background-color: var(--bg-secondary);
            border-radius: 0.5rem;
            padding: 0.5rem;
        }}
        </style>
    """, unsafe_allow_html=True)

    # Header
    st.title("PaperSynth - AI Research Paper Workbench")
    
    # About section - always visible
    st.markdown("""
    <div class="about-section">
        <h3>About PaperSynth</h3>
        <div class="about-content">
            <strong>Transform research papers into multiple formats:</strong><br><br>
            📄 <strong>Structured Summary</strong>: Key findings, methodology, conclusions, and implications<br>
            🎵 <strong>Audio Summary</strong>: Professional voiceover explanation<br>
            📊 <strong>Visual Abstract</strong>: AI-generated graphical representation<br>
            📽️ <strong>PowerPoint</strong>: Ready-to-use presentation with speaker notes
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Main content with settings
    st.markdown("---")
    col1, col2 = st.columns([3, 1], gap="medium")
    
    with col1:
        uploaded_file = st.file_uploader(
            "Upload Research Paper (PDF)",
            type=["pdf"],
            help="Maximum file size: 10MB"
        )
    
    with col2:
        summary_length = st.radio(
            "Summary Length",
            options=["short", "medium", "long"],
            index=1,  # Default to "medium"
            horizontal=True,
            help="Choose the level of detail for the summary"
        )
    
    if uploaded_file:
        # Initialize session state
        if 'processed_papers' not in st.session_state:
            st.session_state.processed_papers = 0
        if 'temp_dir' not in st.session_state:
            st.session_state.temp_dir = None
        if 'processed_data' not in st.session_state:
            st.session_state.processed_data = None
            
        # Show file details
        file_details = {
            "Filename": uploaded_file.name,
            "Size": f"{uploaded_file.size/1024/1024:.2f} MB",
            "Type": uploaded_file.type
        }
        st.json(file_details)
        
        # Add clear files button and process button side by side
        st.markdown("---")
        col1, col2, col3 = st.columns([2, 2, 1], gap="small")
        with col1:
            process_button = st.button("🚀 Process Paper", type="primary")
        with col2:
            if st.session_state.temp_dir is not None or st.session_state.processed_data is not None:
                if st.button("🗑️ Clear All", help="Clear all files and results"):
                    try:
                        if st.session_state.temp_dir is not None:
                            shutil.rmtree(st.session_state.temp_dir, ignore_errors=True)
                        st.session_state.temp_dir = None
                        st.session_state.processed_data = None
                        st.success("✅ All files and results cleared!")
                        st.rerun()  # Refresh the page to update UI
                    except:
                        pass

        if process_button:
            try:
                # Clean up old temporary directory if exists
                if st.session_state.temp_dir is not None:
                    try:
                        shutil.rmtree(st.session_state.temp_dir, ignore_errors=True)
                    except:
                        pass  # Ignore errors if directory doesn't exist
                    st.session_state.temp_dir = None
                    
                with st.spinner("Processing your paper... This may take a few minutes."):
                    # Create temporary directory that persists in session
                    if st.session_state.temp_dir is None:
                        st.session_state.temp_dir = tempfile.mkdtemp()
                    temp_dir = Path(st.session_state.temp_dir)
                    
                    # Send to backend with authorization
                    files = {"file": uploaded_file}
                    headers = {"Authorization": f"Bearer {os.getenv('API_AUTH_TOKEN')}"}
                    response = requests.post(
                        "http://localhost:8000/process-paper/",
                        files=files,
                        headers=headers,
                        params={"summary_length": summary_length}
                    )
                    
                if response.status_code == 200:
                    data = response.json()
                    st.session_state.processed_papers += 1
                    
                    # Store processed data in session state
                    st.session_state.processed_data = data
                    
                    # Success message
                    st.markdown("""
                        <div class="success-message">
                            Paper processed successfully! Navigate through the tabs below to see the results.
                        </div>
                    """, unsafe_allow_html=True)
                
                else:
                    st.error(f"Error: {response.text}")
                    st.info("Please check if the backend server is running.")
            
            except Exception as e:
                st.error(f"Error: {str(e)}")
                st.info("""
                    Please ensure:
                    1. The backend server is running
                    2. Your PDF is not corrupted  
                    3. The file size is under 10MB
                """)

        # Display results if data is available (either from current processing or previous session)
        if st.session_state.processed_data is not None:
            data = st.session_state.processed_data
            
            # Ensure temp directory exists
            if st.session_state.temp_dir is None:
                st.session_state.temp_dir = tempfile.mkdtemp()
            temp_dir = Path(st.session_state.temp_dir)
            
            # Display results in tabs
            tab1, tab2, tab3, tab4 = st.tabs([
                "📄 Summary",
                "🎨 Visual", 
                "🎵 Audio",
                "📽️ Presentation"
            ])
            
            with tab1:
                st.markdown("### Structured Summary")
                st.markdown(data["summary"])
                
                # Get and save PDF (download if not exists)
                pdf_path = temp_dir / "summary.pdf"
                if not pdf_path.exists():
                    headers = {"Authorization": f"Bearer {os.getenv('API_AUTH_TOKEN')}"}
                    pdf_response = requests.get(data["summary_pdf"], headers=headers)
                    if pdf_response.status_code == 200:
                        pdf_path.write_bytes(pdf_response.content)
                
                if pdf_path.exists():
                    with open(pdf_path, "rb") as f:
                        st.download_button(
                            "📥 Download Full Summary (PDF)",
                            f,
                            file_name="research_summary.pdf",
                            mime="application/pdf",
                            help="Download the complete summary with all details",
                            use_container_width=True
                        )
            
            with tab2:
                st.markdown("### Graphical Abstract")
                
                # Get and save image (download if not exists)
                img_path = temp_dir / "abstract.png"
                if not img_path.exists():
                    headers = {"Authorization": f"Bearer {os.getenv('API_AUTH_TOKEN')}"}
                    img_response = requests.get(data["graphical_abstract"], headers=headers)
                    if img_response.status_code == 200:
                        img_path.write_bytes(img_response.content)
                
                if img_path.exists():
                    st.image(img_path, caption="AI-Generated Graphical Abstract")
                    
                    # Add description
                    st.markdown("""
                        <div class="info-box">
                            This graphical abstract was generated using Stable Diffusion XL, 
                            optimized for scientific visualization. It represents the key concepts 
                            and findings from your paper.
                        </div>
                    """, unsafe_allow_html=True)
                    
                    with open(img_path, "rb") as f:
                        st.download_button(
                            "📥 Download Graphical Abstract",
                            f,
                            file_name="graphical_abstract.png",
                            mime="image/png",
                            use_container_width=True
                        )
            
            with tab3:
                st.markdown("### Audio Summary")
                
                # Get and save audio (download if not exists)
                audio_path = temp_dir / "summary.mp3"
                if not audio_path.exists():
                    headers = {"Authorization": f"Bearer {os.getenv('API_AUTH_TOKEN')}"}
                    audio_response = requests.get(data["voiceover"], headers=headers)
                    if audio_response.status_code == 200:
                        audio_path.write_bytes(audio_response.content)
                
                if audio_path.exists():
                    # Audio player with description
                    st.markdown("""
                        <div class="info-box">
                            Listen to an AI-voiced summary of your paper's key points. 
                            Perfect for quick review or sharing with colleagues.
                        </div>
                    """, unsafe_allow_html=True)
                    
                    st.audio(audio_path)
                    
                    with open(audio_path, "rb") as f:
                        st.download_button(
                            "📥 Download Audio Summary",
                            f,
                            file_name="audio_summary.mp3",
                            mime="audio/mp3",
                            use_container_width=True
                        )
            
            with tab4:
                st.markdown("### PowerPoint Presentation")
                
                # Get and save presentation (download if not exists)
                pres_path = temp_dir / "presentation.pptx"
                if not pres_path.exists():
                    headers = {"Authorization": f"Bearer {os.getenv('API_AUTH_TOKEN')}"}
                    pres_response = requests.get(data["presentation"], headers=headers)
                    if pres_response.status_code == 200:
                        pres_path.write_bytes(pres_response.content)
                
                if pres_path.exists():
                    # Presentation description
                    st.markdown("""
                        <div class="info-box">
                            A ready-to-use presentation has been generated with:
                            - Title and overview slides
                            - Key findings and methodology
                            - Graphical abstract integration
                            - Conclusions and implications
                            - Speaker notes for each slide
                        </div>
                    """, unsafe_allow_html=True)
                    
                    # Presenter notes preview
                    st.markdown("""
                        <div class="presenter-notes">
                            <strong>Presenter Tips:</strong><br>
                            - Review the speaker notes for each slide
                            - Customize the content as needed
                            - Practice the presentation flow
                            - Consider your audience's background
                        </div>
                    """, unsafe_allow_html=True)
                    
                    with open(pres_path, "rb") as f:
                        st.download_button(
                            "📥 Download PowerPoint Presentation",
                            f,
                            file_name="research_presentation.pptx",
                            mime="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                            help="Download the complete presentation with speaker notes",
                            use_container_width=True
                        )

    # Footer
    st.markdown("---")
    st.markdown("""
        <div class="footer-section">
            🤖 Powered by <strong>Google Gemini</strong>, <strong>Stable Diffusion XL</strong>, and <strong>ElevenLabs</strong><br>
            🔬 Made for researchers, by researchers
        </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()