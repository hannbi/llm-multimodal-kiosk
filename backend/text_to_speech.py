# text_to_speech.py

import os
import io
from google.cloud import texttospeech
import playsound
import pygame

# Google 서비스 계정 키 경로 설정 (절대 경로 or 상대 경로)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/은빈/Desktop/V3X_project/v3xProject/secrets/v3x-project-4fab2d807b9f.json"


def speak(text):
    client = texttospeech.TextToSpeechClient()

    synthesis_input = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code="ko-KR",
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )

   # 메모리 버퍼에 mp3 저장
    mp3_data = io.BytesIO(response.audio_content)

    # pygame으로 메모리 재생
    pygame.mixer.init()
    pygame.mixer.music.load(mp3_data, "mp3")  # 두 번째 인자로 형식 지정
    pygame.mixer.music.play()

    while pygame.mixer.music.get_busy():
        continue
    
    pygame.mixer.music.unload()

# 테스트용
# if __name__ == "__main__":
#     speak("어서오세요. V three X 카페입니다. 주문 도와드리겠습니다.")
