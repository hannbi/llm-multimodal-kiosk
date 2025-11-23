import os
import pyaudio
from google.cloud import speech
from six.moves import queue
import os
from dotenv import load_dotenv

load_dotenv()
google_cred = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
google_cred = os.path.abspath(google_cred)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_cred

if not os.path.exists(google_cred):
    print("❌ GOOGLE_APPLICATION_CREDENTIALS 파일 없음:", google_cred)
else:
    print("✔ GOOGLE_APPLICATION_CREDENTIALS OK:", google_cred)

RATE = 16000
CHUNK = int(RATE / 10)  # 100ms

class MicrophoneStream:
    def __init__(self, rate, chunk):
        self._rate = rate
        self._chunk = chunk

        self._buff = queue.Queue()
        self.closed = True

    def __enter__(self):
        self._audio_interface = pyaudio.PyAudio()
        self._audio_stream = self._audio_interface.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self._rate,
            input=True,
            frames_per_buffer=self._chunk,
            stream_callback=self._fill_buffer,
        )

        self.closed = False
        return self

    def __exit__(self, type, value, traceback):
        self._audio_stream.stop_stream()
        self._audio_stream.close()
        self.closed = True
        self._buff.put(None)
        self._audio_interface.terminate()

    def _fill_buffer(self, in_data, frame_count, time_info, status_flags):
        self._buff.put(in_data)
        return None, pyaudio.paContinue

    def generator(self):
        while not self.closed:
            chunk = self._buff.get()
            if chunk is None:
                return
            yield chunk


def listen_real_time(callback):
    client = speech.SpeechClient()

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=RATE,
        language_code="ko-KR"
    )

    streaming_config = speech.StreamingRecognitionConfig(
        config=config,
        interim_results=False  # 중간 텍스트도 받고 싶으면 True
    )

    with MicrophoneStream(RATE, CHUNK) as stream:
        audio_generator = stream.generator()
        requests = (
            speech.StreamingRecognizeRequest(audio_content=content)
            for content in audio_generator
        )

        responses = client.streaming_recognize(streaming_config, requests)

        for response in responses:
            for result in response.results:
                text = result.alternatives[0].transcript
                callback(text)
                
def transcribe_from_mic(filepath):
    print("🎧 Whisper 파일 경로:", filepath)

    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(filepath)
    return result["text"]

