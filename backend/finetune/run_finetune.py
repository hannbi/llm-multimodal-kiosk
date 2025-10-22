# finetune/run_finetune.py
# ---------------------------------------------
# 이 스크립트는 아래를 자동으로 수행합니다.
# 1) finetune/train.jsonl, finetune/valid.jsonl 업로드
# 2) gpt-4o-mini-2024-07-18을 베이스로 파인튜닝 Job 생성
# 3) Job 상태를 주기적으로 조회하여 진행 로그 출력
# 4) 완료되면 모델ID를 finetune/model_id.txt 에 저장
# ---------------------------------------------

import os
import time
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))           # .../finetune
PROJECT_DIR = os.path.dirname(BASE_DIR)                         # 프로젝트 루트
TRAIN_PATH = os.path.join(BASE_DIR, "train.jsonl")
VALID_PATH = os.path.join(BASE_DIR, "valid.jsonl")
MODEL_ID_PATH = os.path.join(BASE_DIR, "model_id.txt")
BASE_MODEL = "gpt-4o-mini-2024-07-18"                           # 베이스 모델

def upload_file(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {path}")
    print(f"⬆️  업로드: {os.path.relpath(path, PROJECT_DIR)}")
    with open(path, "rb") as f:
        file = client.files.create(file=f, purpose="fine-tune")
    print(f"   → file_id = {file.id}")
    return file.id

def create_job(train_file_id: str, valid_file_id: str):
    print("🚀 파인튜닝 Job 생성 중...")
    job = client.fine_tuning.jobs.create(
        training_file=train_file_id,
        validation_file=valid_file_id,
        model=BASE_MODEL,
        # 필요시 하이퍼파라미터 조정 가능
        # hyperparameters={"n_epochs":3, "batch_size":4, "learning_rate_multiplier":0.3}
    )
    print(f"   → job_id = {job.id}")
    return job.id

def watch_job(job_id: str):
    print("👀 진행상태 모니터링 시작...")
    last_event_ts = 0
    while True:
        job = client.fine_tuning.jobs.retrieve(job_id)
        status = job.status
        # 새 이벤트만 출력
        events = client.fine_tuning.jobs.list_events(job_id, limit=20)
        for ev in reversed(events.data):
            if ev.created_at and ev.created_at > last_event_ts:
                print(f"[{ev.created_at}] {ev.level.upper()} - {ev.message}")
                last_event_ts = ev.created_at

        if status in ("succeeded", "failed", "cancelled"):
            print(f"✅ 최종 상태: {status}")
            if status == "succeeded":
                ft_model = job.fine_tuned_model
                print(f"🎉 Fine-tuned Model ID: {ft_model}")
                # 모델ID 저장 (gpt_response.py가 자동으로 읽어 쓰도록)
                with open(MODEL_ID_PATH, "w", encoding="utf-8") as f:
                    f.write(ft_model)
                print(f"💾 저장됨 → {os.path.relpath(MODEL_ID_PATH, PROJECT_DIR)}")
            else:
                print("⚠️ 파인튜닝이 정상 완료되지 않았습니다.")
            break

        time.sleep(3)  # 과한 호출 방지 (간단 폴링)

def main():
    # 1) 파일 업로드
    train_id = upload_file(TRAIN_PATH)
    valid_id = upload_file(VALID_PATH)

    # 2) Job 생성
    job_id = create_job(train_id, valid_id)
    print(f"🔎 대시보드에서도 확인 가능 (Fine-tuning 메뉴) / job_id: {job_id}")

    # 3) 모니터링
    watch_job(job_id)

if __name__ == "__main__":
    main()
