import { useNavigate } from "react-router-dom";
import React, { useEffect } from "react";   // ✅ useEffect 추가
import "../styles/CompletePage.css";

function CompletePage() {
  const navigate = useNavigate();

  // ⏳ 10초 뒤 홈("/")으로 자동 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");  // 홈으로 이동
    }, 15000); // 10000ms = 10초

    return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 해제
  }, [navigate]);

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

{/* 진행 단계 */}
<div className="stepper">
  {["주문 확인", "이용 방식", "결제 수단", "결제 진행", "주문 완료"].map(
    (label, index) => {
      const isCompleted = true; // ✅ 모든 단계 완료

      return (
        <div className="step-wrapper" key={index}>
          <div className="step-circle completed">✔</div> {/* ✅ 전부 체크 */}
          <div className="step-label completed">{label}</div>
          {index !== 4 && <div className="step-line completed" />}
        </div>
      );
    }
  )}
</div>



      {/* 중앙 카드 */}
      <div className="order-confirm-card">
        {/* 검은색 상단 바 */}
        <div className="order-card-header">결제 완료</div>

        {/* 본문 영역 */}
        <div className="order-list-container">
          <h2 className="complete-title">결제가 완료되었습니다</h2>
          <h3 className="complete-subtitle">대기번호</h3>
          {/* <p className="complete-time">예상 소요시간: 5분</p> */}

          {/* 대기 번호 */}
          <div className="complete-number">27</div>

          {/* 영수증 아이콘 */}
          <div className="complete-receipt">
            <img src="/images/receipt.png" alt="영수증" />
          </div>

          {/* 버튼 */}
          <button
            className="receipt-btn"
            onClick={() => alert("영수증 출력 기능은 추후 연동됩니다.")}
          >
            영수증 출력하기
          </button>

          {/* ⏳ 안내 문구 추가 */}
          <p className="auto-redirect-msg">
            (15초 후 자동으로 홈 화면으로 이동합니다)
          </p>
        </div>
      </div>
    </div>
  );
}

export default CompletePage;
