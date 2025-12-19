#  🤖 LLM-Multimodal-Kiosk

음성·터치 기반의 LLM 멀티모달 키오스크 
– 사용자 질의에 따라 지능적으로 주문을 처리하는 카페 환경용 시스템

## 💡 Description | 설명
- 음성 인식(STT)과 터치 입력을 동시에 지원하는 카페 주문 키오스크
- LLLM 기반 질의 응답을 통한 메뉴 추천, 옵션 안내, 주문 확인
- 음성 출력(TTS)과 시각적 UI를 함께 제공하는 멀티모달 인터페이스
- 고령자 및 디지털 취약 계층을 고려한 접근성 중심 설계
  
## 📱 Features | 기능
- 음성 기반 메뉴 검색 및 주문 요청
- 자연어 발화를 통한 옵션 선택 처리
- 터치 UI를 통한 메뉴 선택 및 주문 내역 확인
- 주문 내역 수정 및 단계별 결제 흐름 안내

## 💻 Stack | 기술 스택
- Frontend: React, JavaScript, CSS
- Backend: Python
- AI / LLM: OpenAI API
- Speech: Speech-to-Text, Text-to-Speech
  
## ⚙️ Structure | 구조
- 음성 입력 → STT 처리
- 사용자 발화 → LLM 의도 분석
- 주문 로직 처리 → 응답 생성
- 음성 출력(TTS) 및 화면 UI 동시 제공
  
## 👥 Collaborators | 개발팀
| 역할 | GitHub | 
|------|----------------|
| PM / Backend / UX·UI | [hannbi](https://github.com/hannbi) |
| Frontend / Interaction Developer | [qksdmsqls1](https://github.com/qksdmsqls1) | 

### 👥 Contributions | hannbi

### 👥 Contributions | qksdmsqls1
- Implemented kiosk UI and interaction flow with React based on Figma designs
  (Figma 기반 키오스크 화면 구성 및 사용자 플로우 구현)
- Built touch-optimized UI, established screen structure, and adjusted design
  (키오스크용 화면 뼈대 구성 및 디자인 수정·보완)
- Integrated frontend with backend systems for order processing and voice recognition results, enabling    data storage and flow
  (주문 및 음성 AI 결과를 프론트엔드에서 연동하고 데이터 흐름/저장 처리)

