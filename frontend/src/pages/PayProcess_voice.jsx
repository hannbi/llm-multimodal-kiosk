// src/pages/PayProcess_voice.jsx
import { useNavigate, Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "../styles/MenuOrder.css";
import "../styles/MenuOrder_voice.css";

function PayProcess_voice() {
  const navigate = useNavigate();
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showStaffCallModal, setShowStaffCallModal] = useState(false);
  const [isStaffCalling, setIsStaffCalling] = useState(false);

  const [loading, setLoading] = useState(false);

  // 🔥 첫 화면 진입 시 자동 음성 재생
  useEffect(() => {
    const speakTTS = async () => {
      const res = await fetch("http://localhost:5000/pay_process_voice_tts", {
        method: "POST",
      });

      const data = await res.json();

      if (data.audio_url) {
        const audio = new Audio("http://localhost:5000/" + data.audio_url);
        audio.play();
      }
    };

    speakTTS();
  }, []);

  // 🔥 5초 후 로딩 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // 🔥 로딩 후 3초 뒤 complete_voice 이동
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        navigate("/complete_voice");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, navigate]);

  // 눈 깜빡임
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

      <div
        className="footer-option"
        onClick={() => setShowStaffCallModal(true)}
      >
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
            const currentStep = 3;
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
                  />
                )}
              </div>
            );
          }
        )}
      </div>

      {/* 중앙 카드 */}
      <div className="order-confirm-card-voice">
        <div className="order-card-header-voice">결제 진행</div>
        <div className="order-list-container-voice">
          <h3 className="payprocess-subtitle">신용카드 결제</h3>

          {!loading ? (
            <>
              <h2 className="payprocess-title">
                신용카드를 투입구에 넣어주세요
              </h2>
              <p className="payprocess-desc">
                결제가 완료될 때까지 카드를 빼지 마세요 !
              </p>
              <div className="payprocess-image-voice">
                <img src="/images/card_insert.png" alt="카드 삽입" />
              </div>
            </>
          ) : (
            <>
              <h2 className="payprocess-title">결제 진행중...</h2>
              <div className="loading-spinner"></div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="menu-footer">
        <img
          src={isBlinking ? "/images/staff_eyes.png" : "/images/staff.png"}
          alt="staff"
          className={`staff-img ${isBlinking ? "eyes" : ""}`}
        />

        <div className="welcome-message">
          {loading
            ? "결제를 진행중입니다..."
            : "결제를 진행중입니다\n신용카드를 투입구에 넣어주세요."}
        </div>

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
      <p>현재 음성 주문 모드입니다.<br />터치로 결제를 진행하시려면 전환이 필요합니다.</p>

      <div className="modal-buttons switch-buttons">

        {/* 아니오 */}
        <button
          onClick={() => setShowSwitchModal(false)}
          className="switch-cancel"
        >
          아니오
        </button>

        {/* 🔥 예 — 터치 결제 진행 페이지로 이동 */}
        <button
          onClick={() => {
            setShowSwitchModal(false);
            setIsTouchMode(true);

            navigate("/payprocess", {
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

export default PayProcess_voice;
