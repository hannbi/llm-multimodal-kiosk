import React, { useEffect, useState } from 'react';
import '../styles/Home.css';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [blink, setBlink] = useState(false);

  const handleTouch = () => {
    navigate('/menu_coffee');
  };

  // 3초마다 눈 깜박이기 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 800); // 깜박임 지속시간 (0.15초)
    }, 3000); // 3초마다 반복

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container" onClick={handleTouch}>
      {/* 배경 이미지 */}
      <img src="/images/home2.png" alt="홈화면" className="home-image" />

      {/* staff 캐릭터 */}
      <img src="/images/staff.png" alt="staff" className="staff-home" />

      {/* 눈 이미지 (깜박임) */}
      <img
        src="/images/staff_eyes.png"
        alt="staff eyes"
        className={`staff-eyes ${blink ? 'blink' : ''}`}
      />
    </div>
  );
}

export default Home;
