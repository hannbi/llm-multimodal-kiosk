import os
# import sounddevice as sd   # 🔥 녹음 불필요 → 주석
# import numpy as np
# import scipy.io.wavfile as wav
# import tempfile
from gpt_response import get_gpt_response
from text_to_speech import speak
# from google.cloud import speech
# import io

# Google 서비스 계정 키 경로 (STT 안 쓰면 필요 없음, 남겨둬도 OK)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/82109/Desktop/V3X_project/v3xProject/secrets/v3x-project-4fab2d807b9f.json"

# SAMPLE_RATE = 16000
# DURATION = 5  # 초 단위 녹음 시간

# 🔥 STT 대신 직접 입력으로 대체
def get_text_input():
    # 1) 하드코딩 (항상 같은 문장)
    # return "아메리카노 하나 주세요"
    
    # 2) 실행할 때마다 입력
    return input("👉 주문 문장을 직접 입력하세요: ")

if __name__ == "__main__":
    # 원래: 녹음 → wav → transcribe
    # audio = record_audio()
    # wav_path = save_temp_wav(audio)
    # text = transcribe(wav_path)
    # os.remove(wav_path)

    # 수정: 터미널 입력 받기
    text = get_text_input()
    print(f"📝 입력된 텍스트: {text}")

    gpt_answer = get_gpt_response(text)
    print(f"🤖 GPT 응답: {gpt_answer}")

    # 필요시 음성 출력 → 디버깅 중이면 주석 처리 가능
    # speak(gpt_answer)
