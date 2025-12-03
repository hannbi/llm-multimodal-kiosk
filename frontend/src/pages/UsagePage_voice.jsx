import { useNavigate, Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "../styles/MenuOrder.css";
import "../styles/MenuOrder_voice.css";

function UsageVoice() {
  const navigate = useNavigate();

  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showStaffCallModal, setShowStaffCallModal] = useState(false);
  const [isStaffCalling, setIsStaffCalling] = useState(false);

  const [selected, setSelected] = useState(null);
  const [aiText, setAiText] = useState("이용 방식을 말씀해주세요.");

  // 🔥 메뉴오더에서 가져온 녹음 함수
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm; codecs=opus",
    });

    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm; codecs=opus" });
      sendVoice(blob);
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 4000); // 4초 녹음
  };

  // 🔥 서버로 전송
const sendVoice = async (blob) => {
  const formData = new FormData();
  formData.append("file", blob, "audio.webm");

  const res = await fetch("http://localhost:5000/voice_usage_page", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  // 화면에 표시되는 문장 업데이트
  setAiText(data.ai_text || "다시 말씀해주세요.");

  try {
    // ✔ 먹고가기
    if (data.intent === "EatHere") {
      setAiText("먹고 가시는군요. 다음 단계로 이동합니다.");
    }

    // ✔ 포장하기
    if (data.intent === "TakeOut") {
      setAiText("포장하시는군요. 다음 단계로 이동합니다.");
    }

  } finally {
    // 어떤 경우에도 음성 재생
    if (data.audio_url) {
      const audio = new Audio("http://localhost:5000/" + data.audio_url);

      audio.play().catch((err) => console.error("음성 재생 오류:", err));

      audio.onended = () => {
        // ✔ intent가 EatHere 또는 TakeOut이면 다음페이지 이동
        if (data.intent === "EatHere" || data.intent === "TakeOut") {
          navigate("/paychoice_voice");
        }
      };
    }
  }
};


// 페이지 처음 들어올 때 웰컴 음성 재생
useEffect(() => {
  async function playWelcome() {
    const res = await fetch("http://localhost:5000/usage_voice_tts_intro", {
      method: "POST"
    });
    const data = await res.json();

    if (data.audio_url) {
      const audio = new Audio("http://localhost:5000/" + data.audio_url);
      audio.play().catch(err => console.log("초기 음성 재생 오류:", err));
    }
  }

  playWelcome();
}, []);


  // 눈 깜빡임
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Footer 공용 옵션
  const renderFooterOptions = () => (
    <div className="footer-options">
      <Link to="/" className="footer-option">
        <img src="/images/home_icon.png" alt="처음으로" />
        <span>처음으로</span>
      </Link>

      <div
        className={`footer-option ${!isTouchMode ? "disabled" : ""}`}
        onClick={() => {
          if (isTouchMode) setShowVoiceSwitchModal(true);
        }}
      >
        <img src="/images/order_icon.png" alt="음성주문" />
        <span>음성주문</span>
      </div>

      <div
        className={`footer-option ${isTouchMode ? "disabled" : ""}`}
        onClick={() => {
          if (!isTouchMode) setShowSwitchModal(true);
        }}
      >
        <img src="/images/touch_icon.png" alt="터치주문" />
        <span>터치주문</span>
      </div>

      <div className="footer-option" onClick={() => setShowStaffCallModal(true)}>
        <img src="/images/bell_icon.png" alt="직원호출" />
        <span>직원호출</span>
      </div>
    </div>
  );

  return (
    <div className="menu-order-wrapper">
      {/* 상단 로고 */}
      <div className="header">
        <div className="logo-text">
          <strong>
            MOMENT
            <br />
            COFFEE
          </strong>
        </div>
      </div>

      {/* 단계 표시 */}
      <div className="stepper">
        {["주문 확인", "이용 방식", "결제 수단", "결제 진행", "주문 완료"].map(
          (label, index) => {
            const currentStep = 1;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div className="step-wrapper" key={index}>
                <div
                  className={`step-circle ${
                    isActive ? "active" : isCompleted ? "completed" : ""
                  }`}
                >
                  {isCompleted ? "✔" : index + 1}
                </div>
                <div
                  className={`step-label ${
                    isActive ? "active" : isCompleted ? "completed" : ""
                  }`}
                >
                  {label}
                </div>

                {index !== 4 && (
                  <div
                    className={`step-line ${
                      isCompleted ? "completed" : isActive ? "active" : ""
                    }`}
                  ></div>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* 중앙 카드 */}
      <div className="order-confirm-card-voice">
        <div className="order-card-header-voice">이용 방식</div>
        <div className="order-list-container-voice">
          <h2 className="confirm-title-voice">이용 방식을 말씀해주세요</h2>

          <div className="usage-options-voice">
            <div
              className={`usage-option-voice ${
                selected === "eat" ? "active" : ""
              }`}
              onClick={() => {
                setSelected("eat");
                navigate("/paychoice_voice");
              }}
            >
              <img src="/images/staff_eat.png" alt="먹고가기" />
              <span>먹고 가기</span>
            </div>

            <div
              className={`usage-option-voice ${
                selected === "takeout" ? "active" : ""
              }`}
              onClick={() => {
                setSelected("takeout");
                navigate("/paychoice_voice");
              }}
            >
              <img src="/images/staff_pojang.png" alt="포장하기" />
              <span>포장 하기</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="menu-footer">
        <img
          src={isBlinking ? "/images/staff_eyes.png" : "/images/staff.png"}
          alt="staff"
          className={`staff-img ${isBlinking ? "eyes" : ""}`}
        />

        <div className="welcome-message">{aiText}</div>

        {/* 🔥 말하기 버튼 추가 */}
        <button
          className="voice-record-btn"
          onClick={startRecording}
          style={{ background: "red", zIndex: 9999 }}
        >
          🎤 말하기
        </button>

        {renderFooterOptions()}
      </footer>

      {/* 직원 호출 모달 */}
      {showStaffCallModal && !isStaffCalling && (
        <div className="modal-overlay">
          <div className="modal-box switch-modal">
            <h3>직원을 호출하시겠습니까?</h3>
            <p>직원 호출 후 잠시 기다려주세요.</p>
            <div className="modal-buttons switch-buttons">
              <button
                onClick={() => setShowStaffCallModal(false)}
                className="switch-cancel"
              >
                아니오
              </button>
              <button
                onClick={() => {
                  setShowStaffCallModal(false);
                  setIsStaffCalling(true);
                  setTimeout(() => setIsStaffCalling(false), 5000);
                }}
                className="switch-confirm"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 직원 호출 중 */}
      {isStaffCalling && (
        <div className="modal-overlay">
          <div className="modal-box switch-modal">
            <h3>직원 호출중입니다...</h3>
            <p>직원 호출중이니 기다려주세요.</p>
          </div>
        </div>
      )}
      {/* 🔥 터치 주문 전환 모달 */}
{showSwitchModal && (
  <div className="modal-overlay">
    <div className="modal-box switch-modal">
      <h3>터치 모드로 전환하시겠습니까?</h3>
      <p>현재 음성 주문 모드입니다.<br />터치로 주문하시려면 전환이 필요합니다.</p>

      <div className="modal-buttons switch-buttons">
        
        {/* 아니오 */}
        <button
          onClick={() => setShowSwitchModal(false)}
          className="switch-cancel"
        >
          아니오
        </button>

        {/* 🔥 예 — 터치 이용방식 페이지로 이동 */}
        <button
          onClick={() => {
            setShowSwitchModal(false);
            setIsTouchMode(true);

            navigate("/usage", {
              replace: false
            });
          }}
          className="switch-confirm"
        >
          예
        </button>

      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default UsageVoice;
