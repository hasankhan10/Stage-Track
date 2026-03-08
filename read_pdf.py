import sys
try:
    from PyPDF2 import PdfReader
    reader = PdfReader("StageTrack_AI_Build_Prompt.pdf")
    text = ""
    for i, page in enumerate(reader.pages):
        text += f"--- Page {i+1} ---\n"
        text += page.extract_text() + "\n"
    with open("extracted_prompt.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
