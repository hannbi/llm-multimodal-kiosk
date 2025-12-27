#  🤖 LLM-Multimodal-Kiosk

음성·터치 기반의 LLM 멀티모달 키오스크 
– 사용자 질의에 따라 지능적으로 주문을 처리하는 카페 환경용 시스템
<img width="1226" height="941" alt="section_2 0" src="https://github.com/user-attachments/assets/c10f1a14-29be-40de-8da3-e15f144c6d19" />

## 💡 Description | 프로젝트 소개 
- 음성 인식(STT)과 터치 입력을 동시에 지원하는 카페 주문 키오스크
- LLLM 기반 질의 응답을 통한 메뉴 추천, 옵션 안내, 주문 확인
- 음성 출력(TTS)과 시각적 UI를 함께 제공하는 멀티모달 인터페이스
- 고령자 및 디지털 취약 계층을 고려한 접근성 중심 설계
  
## 📱 Features | 주요 기능
1. LLM 기반 주문 처리
- 사용자 발화를 자연어로 이해하여 주문으로 연결하는 LLM 기반 주문 처리 모델 구현
- 주문 의도(Intent: BuildOrder, NutritionFilter, ResetOrder 등) 및 음료명·사이즈·온도·옵션·영양 조건을 추출하는 Slot 구조 설계
- “아메리카노 아이스로 바꿔줘”, “카페인 적은 메뉴 추천해줘” 등 자연스러운 대화 기반 주문 처리 및 문맥 유지 응답 지원

2. STT·TTS 기반 음성 인터랙션
- 음성 입력 파일을 서버로 전송하여 Whisper 기반 STT로 텍스트 변환
- LLM 주문 해석 결과를 TTS로 음성 안내
- 발화 중단, 재요청, 옵션 변경 등 실사용 환경 예외 처리를 통해 끊김 없는 음성 주문 경험 제공

3. 터치·음성 멀티모달 UI/UX
- 터치와 음성을 병행 사용할 수 있는 멀티모달 키오스크 UI 구축
- 음성 주문 후 터치 결제, 터치 선택 후 음성 옵션 수정 등 유연한 입력 방식 지원
- 고령층·비숙련 사용자를 고려한 버튼 크기, 색 대비, 옵션 UI 개선
- 시각장애인을 위한 음성 주문 기본 제공으로 접근성 강화

4. 영양정보 기반 스마트 추천
- 음료 영양 성분(당류, 나트륨, 칼로리, 카페인 등)을 활용한 DB 기반 개인 조건 필터링 추천
- “당 적게”, “카페인 100mg 이하” 등 조건 발화 시 LLM이 자연스러운 대화 형태로 추천 제공
- 기존 키오스크에서 어려웠던 개인화 주문 경험 구현

5. 실시간 주문 수정 및 관리
- FastAPI 기반 서버와 상태 저장 구조를 통한 실시간 주문 관리
- 수량 변경, 옵션 수정, 메뉴 삭제 등 자연어 기반 주문 수정·취소 지원
- 주문 오류 감소 및 전체 주문 흐름의 안정성과 유연성 향상
  
## ⚙️ Stack & Structure | 기술스택 & 구조
- 음성 입력 → STT 처리
- 사용자 발화 → LLM 의도 분석
- 주문 로직 처리 → 응답 생성
- 음성 출력(TTS) 및 화면 UI 동시 제공
<img width="749" height="364" alt="section_2 1" src="https://github.com/user-attachments/assets/a421b179-b8cb-4a14-8f16-2d4ad1d85683" />

## 📌 Expected Outcomes | 기대효과

## 👥 Collaborators | 개발팀
| 역할 | GitHub | 
|------|----------------|
| PM / Backend / UX·UI | [hannbi](https://github.com/hannbi) |
| Frontend / Interaction Developer | [eunbin7](https://github.com/eunbin7) | 

### 👥 Contributions | eunbin7
- Implemented kiosk UI and interaction flow with React based on Figma designs
  (Figma 기반 키오스크 화면 구성 및 사용자 플로우 구현)
- Built touch-optimized UI, established screen structure, and adjusted design
  (키오스크용 화면 뼈대 구성 및 디자인 수정·보완)
- Integrated frontend with backend systems for order processing and voice recognition results, enabling    data storage and flow
  (주문 및 음성 AI 결과를 프론트엔드에서 연동하고 데이터 흐름/저장 처리)

