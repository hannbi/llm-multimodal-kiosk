# text_to_speech.py

import os
from google.cloud import texttospeech

from dotenv import load_dotenv
load_dotenv()

google_cred = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
google_cred = os.path.abspath(google_cred)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_cred

def speak(text, output_path):
    client = texttospeech.TextToSpeechClient()

    synthesis_input = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code="ko-KR",
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
    )

    # TTS 요청
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config,
    )

    # mp3 파일 서버에 저장
    with open(output_path, "wb") as out:
        out.write(response.audio_content)

    return output_path  # 필요하면 리턴
