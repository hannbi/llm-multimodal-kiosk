import React, { useState, useEffect } from 'react';
import '../styles/Menu.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

function MenuCoffee() {
  const [activeCategory, setActiveCategory] = useState('커피');
  const navigate = useNavigate();
  // 🔥 음성 녹음 + 서버 전송 함수 추가 (필수)
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const options = { mimeType: "audio/webm; codecs=opus" };
    const recorder = new MediaRecorder(stream, options);

    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };


    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm; codecs=opus" });

      sendVoice(blob);
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 6000);
  };


  const [showOptionWarning, setShowOptionWarning] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
  const [selectedTemp, setSelectedTemp] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [aiText, setAiText] = useState("어서오세요! 음성으로 주문해주세요.");  // ① 추가
  const [isBlinking, setIsBlinking] = useState(false);
  const [showStaffCallModal, setShowStaffCallModal] = useState(false);
  const [isStaffCalling, setIsStaffCalling] = useState(false);

  const [menuData, setMenuData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableTemps, setAvailableTemps] = useState([]);

  const [cartItems, setCartItems] = useState([]);
  const location = useLocation();
  const [smartRecommendData, setSmartRecommendData] = useState([]);

  // 기존 state들 아래에 추가
  const [showSmartFilterModal, setShowSmartFilterModal] = useState(false);
  const [smartFilters, setSmartFilters] = useState({
    calories: '전체',
    caffeine: '전체',
    sugar: '전체',
    sodium: '전체',
    protein: '전체'
  });
  const [filterResultText, setFilterResultText] = useState('');

  // 1️⃣ sendVoice 밖
  const requestSmartRecommend = async (nutrient, compare) => {
    const res = await fetch(`http://localhost:5000/recommend?nutrient=${nutrient}&compare=${compare}`);
    const data = await res.json();

    setSmartRecommendData(data.recommend || []);
    setAiText(data.ai_text || "추천 결과입니다.");

    setTimeout(() => {
      const scrollArea = document.querySelector(".menu-scroll-area");
      if (scrollArea) scrollArea.scrollTop = 0;
    }, 50);
  };

  const buildFilterResultText = (filters) => {
    const labels = [];

    if (filters.caffeine === "없음")
      labels.push("카페인 없음 ( 0mg )");
    else if (filters.caffeine === "적음")
      labels.push("카페인 적음 ( <100mg )");
    else if (filters.caffeine === "많음")
      labels.push("카페인 많음 ( ≥150mg )");

    if (filters.sugar === "적음")
      labels.push("당류 적음 ( <5g )");
    else if (filters.sugar === "많음")
      labels.push("당류 많음 ( ≥50g )");

    if (filters.calories === "낮음")
      labels.push("칼로리 낮음 ( <130kcal )");
    else if (filters.calories === "높음")
      labels.push("칼로리 높음 ( ≥220kcal )");

    if (filters.protein === "없음")
      labels.push("단백질 없음 ( 0g )");
    else if (filters.protein === "적음")
      labels.push("단백질 적음 ( <10g )");
    else if (filters.protein === "많음")
      labels.push("카페인 많음 ( ≥10mg )");

    if (filters.protein === "많음")
      labels.push("단백질 많음 ( ≥10g )");

    if (filters.sodium === "없음")
      labels.push("나트륨 없음 ( 0mg )");
    else if (filters.sodium === "적음")
      labels.push("나트륨 적음 ( <100mg )");
    else if (filters.sodium === "많음")
      labels.push("나트륨 많음 ( ≥200mg )");

    return labels.join(" · ");
  };

  // 🔥 새로운 필터링 함수
  const applySmartFilter = async () => {
    const params = new URLSearchParams();

    // 칼로리
    if (smartFilters.calories === '낮음') {
      params.append('calories_min', 0);
      params.append('calories_max', 130);
    } else if (smartFilters.calories === '높음') {
      params.append('calories_min', 220);
    }

    // 카페인
    if (smartFilters.caffeine === '없음') {
      params.append('caffeine_min', 0);
      params.append('caffeine_max', 0);
    } else if (smartFilters.caffeine === '적음') {
      params.append('caffeine_min', 1);
      params.append('caffeine_max', 100);
    } else if (smartFilters.caffeine === '많음') {
      params.append('caffeine_min', 150);
    }

    // 당류
    if (smartFilters.sugar === '없음') {
      params.append('sugar_min', 0);
      params.append('sugar_max', 5);
    } else if (smartFilters.sugar === '적음') {
      params.append('sugar_min', 2);
      params.append('sugar_max', 25);
    } else if (smartFilters.sugar === '많음') {
      params.append('sugar_min', 50);
    }

    // 나트륨
    if (smartFilters.sodium === '없음') {
      params.append('sodium_min', 0);
      params.append('sodium_max', 50);
    } else if (smartFilters.sodium === '적음') {
      params.append('sodium_min', 50);
      params.append('sodium_max', 100);
    } else if (smartFilters.sodium === '많음') {
      params.append('sodium_min', 200);
    }

    // 단백질
    if (smartFilters.protein === '없음') {
      params.append('protein_min', 0);
      params.append('protein_max', 2);
    } else if (smartFilters.protein === '적음') {
      params.append('protein_min', 2);
      params.append('protein_max', 10);

    } else if (smartFilters.protein === '많음') {
      params.append('protein_min', 10);
    }

    // 서버에 요청
    const res = await fetch(`http://localhost:5000/api/smart_filter?${params.toString()}`);
    const data = await res.json();

    setSmartRecommendData(data.recommend || []);
    setFilterResultText(generateFilterText());
    setTimeout(() => {
      setActiveCategory("스마트추천");
    }, 0);
    setShowSmartFilterModal(false);

    setTimeout(() => {
      const scrollArea = document.querySelector(".menu-scroll-area");
      if (scrollArea) scrollArea.scrollTop = 0;
    }, 50);
  };

  // 🔥 필터 설명 텍스트 생성
  const generateFilterText = () => {
    const conditions = [];

    if (smartFilters.calories !== '전체') {
      conditions.push(`칼로리 ${smartFilters.calories}`);
    }
    if (smartFilters.caffeine !== '전체') {
      conditions.push(`카페인 ${smartFilters.caffeine}`);
    }
    if (smartFilters.sugar !== '전체') {
      conditions.push(`당류 ${smartFilters.sugar}`);
    }
    if (smartFilters.sodium !== '전체') {
      conditions.push(`나트륨 ${smartFilters.sodium}`);
    }
    if (smartFilters.protein !== '전체') {
      conditions.push(`단백질 ${smartFilters.protein}`);
    }

    if (conditions.length === 0) {
      return "전체";
    }

    return conditions.join(', ') + " 메뉴들입니다";
  };

  const sendVoice = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");

    const res = await fetch("http://localhost:5000/voice", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setAiText(data.ai_text);

    // 🔥 menuData가 로딩되지 않았다면 모달 띄우기 중단
    if (!menuData || Object.keys(menuData).length === 0) {
      console.log("⚠ menuData 아직 로딩 안됨");
      return;
    }

    // ----------------------------
    //  try 내부에서 모든 intent 처리
    // ----------------------------
    try {

      // 🔥 음성으로 카테고리 변경
      if (data.intent === "ChangeCategory" && data.slots?.category) {
        const category = data.slots.category;

        const mapping = {
          "커피": "커피",
          "티/에이드": "티/에이드",
          "주스/라떼": "주스/라떼",
          "쉐이크/스무디": "쉐이크/스무디",
          "빙수/아이스크림": "빙수/아이스크림",
          "빵/케이크": "빵/케이크",
          "스낵": "스낵",
        };

        const normalized = mapping[category];

        if (normalized && menuData[normalized]) {
          setActiveCategory(normalized);
          setAiText(`${normalized} 화면입니다.`);

          setTimeout(() => {
            const scrollArea = document.querySelector('.menu-scroll-area');
            if (scrollArea) scrollArea.scrollTop = 0;
          }, 50);
        }

        return;
      }

      // 🔥 스마트추천 intent
      if (data.intent === "SmartRecommend" && data.recommend) {
        setActiveCategory("스마트추천");
        setSmartRecommendData(data.recommend);
        setAiText(data.ai_text);

        setTimeout(() => {
          const scrollArea = document.querySelector(".menu-scroll-area");
          if (scrollArea) scrollArea.scrollTop = 0;
        }, 50);

        return;
      }

      // 🔥 BuildOrder → 옵션 모달 자동 오픈
      if (data.intent === "BuildOrder" && data.slots?.menu_name) {
        const menuName = data.slots.menu_name;

        const foundMenu = Object.values(menuData)
          .flat()
          .find((m) => m.name === menuName);

        if (foundMenu) {
          setSelectedMenu(foundMenu);
          setShowModal(true);

          fetch(`http://localhost:5000/api/menu/${foundMenu.name}/options`)
            .then((res) => res.json())
            .then((opt) => {
              setAvailableSizes(opt.sizes || []);
              setAvailableTemps(opt.temperatures || []);

              // 온도 자동 선택
              if (opt.temperatures?.length === 1) {
                setSelectedTemp(opt.temperatures[0]);
              } else if (data.slots.temperature) {
                const t = data.slots.temperature.toLowerCase();
                if (t.includes("ice")) setSelectedTemp("Iced");
                else if (t.includes("hot") || t.includes("뜨") || t.includes("핫"))
                  setSelectedTemp("Hot");
              }

              // 사이즈 자동 선택
              if (opt.sizes?.length === 1) {
                setSelectedSize(opt.sizes[0]);
              } else if (data.slots.size) {
                const s = data.slots.size.toLowerCase();
                if (s.includes("small") || s.includes("스몰") || s.includes("작"))
                  setSelectedSize("Small");
                else if (s.includes("large") || s.includes("라지") || s.includes("큰"))
                  setSelectedSize("Large");
              }

              // 커피 옵션 자동 선택
              if (activeCategory === "커피" && data.slots.option_strength) {
                const optText = data.slots.option_strength.toLowerCase();
                if (optText.includes("연")) setSelectedOption("연하게");
                else if (optText.includes("기본")) setSelectedOption("기본");
                else if (optText.includes("진")) setSelectedOption("진하게");
              }
            });
        }

        return;
      }

      // 🔥 OptionSelect
      if (data.intent === "OptionSelect") {
        const { temperature, size, option_strength } = data.slots;

        if (data.ai_text.includes("제공되지 않아요")) {
          setSelectedTemp(null);
          setSelectedSize(null);
          setSelectedOption(null);
          return;
        }

        if (temperature) {
          let normalizedTemp = null;
          const t = temperature.toLowerCase();
          if (t.includes("ice")) normalizedTemp = "Iced";
          else if (t.includes("hot") || t.includes("뜨") || t.includes("핫"))
            normalizedTemp = "Hot";
          if (normalizedTemp) setSelectedTemp(normalizedTemp);
        }

        if (size) {
          let normalizedSize = null;
          const s = size.toLowerCase();
          if (s.includes("small") || s.includes("스몰")) normalizedSize = "Small";
          else if (s.includes("large") || s.includes("라지")) normalizedSize = "Large";
          if (normalizedSize) setSelectedSize(normalizedSize);
        }

        if (option_strength) {
          const o = option_strength.toLowerCase();
          if (o.includes("연")) setSelectedOption("연하게");
          else if (o.includes("기본")) setSelectedOption("기본");
          else if (o.includes("진")) setSelectedOption("진하게");
        }
      }

      // 🔥 NutritionQuery → 옵션창 열기
      if (data.intent === "NutritionQuery" && data.slots?.menu_name) {
        const menuName = data.slots.menu_name;

        const foundMenu = Object.values(menuData)
          .flat()
          .find((m) => m.name === menuName);

        if (foundMenu) {
          setSelectedMenu(foundMenu);
          setShowModal(true);
          setShowDetail(true);

          setSelectedTemp(null);
          setSelectedSize(null);
          setSelectedOption(null);

          fetch(`http://localhost:5000/api/menu/${foundMenu.name}/options`)
            .then((res) => res.json())
            .then((opt) => {
              setAvailableSizes(opt.sizes || []);
              setAvailableTemps(opt.temperatures || []);

              if (opt.temperatures?.length === 1) {
                setSelectedTemp(opt.temperatures[0]);
              }
              if (opt.sizes?.length === 1) {
                setSelectedSize(opt.sizes[0]);
              }
            });
        }
      }

      // 🔥 AddToCart
      if (data.intent === "AddToCart") {
        handleAddToCart();
        setShowModal(false);
        setSelectedTemp(null);
        setSelectedSize(null);
        setSelectedOption(null);
      }

      // 🔥 Payment → 다음 페이지 이동
      if (data.intent === "Payment" || data.next_action === "go_payment") {
        const totalPrice = cartItems.reduce(
          (sum, item) => sum + item.price * item.qty,
          0
        );

        navigate("/order_voice", {
          state: { cartItems, totalPrice },
        });
      }

    } finally {
      // ----------------------------
      // ✔ 반드시 음성 재생 — 어떤 intent라도
      // ----------------------------
      if (data.audio_url) {
        const audio = new Audio("http://localhost:5000/" + data.audio_url);
        audio.play().catch(err => console.error("음성 재생 오류:", err));
      }
    }
  };




  useEffect(() => {
    let ignore = false;

    if (!ignore) {
      fetch("http://localhost:5000/speak/welcome")
        .then(res => res.json())
        .then(data => {
          if (data.audio_url) {
            new Audio("http://localhost:5000/" + data.audio_url).play();
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (sessionStorage.getItem("welcomePlayed") === "true") return;

    fetch("http://localhost:5000/speak/welcome")
      .then(res => res.json())
      .then(data => {
        if (data.audio_url) {
          new Audio("http://localhost:5000/" + data.audio_url).play();
        }
        sessionStorage.setItem("welcomePlayed", "true");
      })
      .catch(err => console.error("음성 재생 실패:", err));
  }, []);


  // 눈 깜빡임 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200); // 0.2초 동안 눈 감기
    }, 3000); // 3초마다 깜빡임

    return () => clearInterval(interval);
  }, []);

  // 메뉴 불러오기 (FastAPI)
  useEffect(() => {
    fetch("http://localhost:5000/api/menu")
      .then((res) => res.json())
      .then((data) => {
        const grouped = {};

        data.forEach((item) => {
          if (!grouped[item.category]) grouped[item.category] = [];

          // 중복 제거: 같은 이름의 메뉴는 한 번만 추가
          const exists = grouped[item.category].some(
            (menu) => menu.name === item.name
          );

          if (!exists) {
            grouped[item.category].push({
              name: item.name,
              category: item.category,
              price: item.price,
              calories_kcal: item.calories_kcal,
              caffeine_mg: item.caffeine_mg,
              sugar_g: item.sugar_g,
              sodium_mg: item.sodium_mg,
              img: item.image_url, // 임시 이미지
            });
          }
        });

        setMenuData(grouped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ 메뉴 불러오기 실패:", err);
        setLoading(false);
      });
  }, []); // 빈 배열이면 처음 렌더링 시 1회만 실행

  // 옵션에 따른 상세정보, 가격 변동
  useEffect(() => {
    if (!selectedMenu || !selectedTemp || !selectedSize) return;

    fetch(
      `http://localhost:5000/api/menu/${selectedMenu.name}/detail?size=${selectedSize}&temperature=${selectedTemp}`
    )
      .then((res) => res.json())
      .then((data) => {
        setSelectedMenu((prev) => ({
          ...prev,
          price: data.price,
          volume_ml: data.volume_ml,
          calories_kcal: data.calories_kcal,
          sugar_g: data.sugar_g,
          protein_g: data.protein_g,
          caffeine_mg: data.caffeine_mg,
          sodium_mg: data.sodium_mg,
        }));
      })
      .catch(() =>
        console.warn("⚠️ 상세정보를 불러오지 못했습니다.")
      );
  }, [selectedTemp, selectedSize]);

  useEffect(() => {
    if (location.state?.cartItems) {
      setCartItems(location.state.cartItems);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.forceTouch === true) {
      setIsTouchMode(true);
    }
  }, [location.state]);


  const handleMenuClick = (item) => {
    if (!isTouchMode) {
      setShowSwitchModal(true);
    } else {
      setSelectedMenu(item);
      setShowModal(true);

      // 메뉴별 선택 가능한 옵션만 표시
      fetch(`http://localhost:5000/api/menu/${item.name}/options`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableSizes(data.sizes || []);
          setAvailableTemps(data.temperatures || []);

          // 온도 옵션이 1개이면 자동 선택
          if (data.temperatures && data.temperatures.length === 1) {
            if (!selectedTemp) { // 이미 음성으로 선택된 값이 있으면 유지
              setSelectedTemp(data.temperatures[0]);
            }
          }

          // 온도 옵션 여러 개일 때 초기화하지 않음!
          // 음성 인식으로 들어온 값이 소중함
          // setSelectedTemp(null)  ← 절대 하지 말기


          // 🔥 사이즈 옵션도 1개면 자동 선택 (필요하면)
          if (data.sizes && data.sizes.length === 1) {
            setSelectedSize(data.sizes[0]);
          } else {
            setSelectedSize(null);
          }
        })
        .catch((err) => console.error("옵션 불러오기 실패:", err));

    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowDetail(false);
    setSelectedTemp(null);
    setSelectedSize(null);
    setSelectedOption(null);
  };

  const handleAddToCart = () => {
    const hasTempOption = availableTemps.length > 0;
    const hasSizeOption = availableSizes.length > 0;

    // 추가옵션이 필요한 카테고리인지 판단 (기존 UI 조건과 동일하게)
    const needExtraOption = !['빙수 · 아이스크림', '베이커리', '스낵'].includes(activeCategory);

    // 온도 옵션 필요인데 선택 안 했으면 경고
    if (hasTempOption && !selectedTemp) {
      setShowOptionWarning(true);
      return;
    }

    // 사이즈 옵션 필요인데 선택 안 했으면 경고
    if (hasSizeOption && !selectedSize) {
      setShowOptionWarning(true);
      return;
    }
    // ⭐ 커피일 때 추가 옵션 필수 선택 검사
    if (activeCategory === '커피' && !selectedOption) {
      setShowOptionWarning(true);
      return;
    }



    // 온도 옵션이 ICE 하나만 있을 경우 자동 선택
    if (hasTempOption && availableTemps.length === 1 && !selectedTemp) {
      setSelectedTemp(availableTemps[0]);
    }

    const newItem = {
      name: selectedMenu.name,
      price: selectedMenu.price,
      temp: selectedTemp,
      size: selectedSize,
      option: selectedOption,
      img: selectedMenu.img,
      qty: 1
    };

    setCartItems(prev => [...prev, newItem]);
    handleCloseModal();
  };




  const updateQty = (index, diff) => {
    setCartItems(prev =>
      prev.map((item, i) =>
        i === index
          ? { ...item, qty: Math.max(1, item.qty + diff) }
          : item
      )
    );
  };


  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );


  const renderFooterOptions = (onVoiceClick) => (
    <div className="footer-options">
      <Link to="/" className="footer-option">
        <img src="/images/home_icon.png" alt="처음으로" />
        <span>처음으로</span>
      </Link>
      <div
        className={`footer-option ${!isTouchMode ? 'disabled' : ''}`}
        onClick={() => {
          if (isTouchMode) setShowVoiceSwitchModal(true);
        }}
      >
        <img src="/images/order_icon.png" alt="음성주문" />
        <span>음성주문</span>
      </div>

      <div
        className={`footer-option ${isTouchMode ? 'disabled' : ''}`}
        onClick={() => {
          if (!isTouchMode) setShowSwitchModal(true);
        }}
      >
        <img src="/images/touch_icon.png" alt="터치주문" />
        <span>터치주문</span>
      </div>
      <div
        className="footer-option"
        onClick={() => setShowStaffCallModal(true)}  // 모달 열기
      >
        <img src="/images/bell_icon.png" alt="직원호출" />
        <span>직원호출</span>
      </div>
    </div>
  );

  if (loading) return <div className="menu-loading">메뉴 불러오는중...</div>;

  return (
    <div className="menu-wrapper">
      <aside className="menu-sidebar">
        <h2 className="logo">MOMENT COFFEE</h2>
        <ul>
          {/* 기존 카테고리 자동 출력 */}
          {Object.keys(menuData).map((category) => (
            <li
              key={category}
              className={activeCategory === category ? 'active' : ''}
              onClick={() => {
                setActiveCategory(category);
                const scrollArea = document.querySelector('.menu-scroll-area');
                if (scrollArea) {
                  scrollArea.scrollTop = 0;
                }
              }}
            >
              {category}
            </li>
          ))}

          {/* ⭐ 스마트추천 메뉴 강제로 추가 */}
          <li
            key="스마트추천"
            className={activeCategory === "스마트추천" ? "active" : ""}
            onClick={() => {
              // 🔥 터치모드일 때만 모달 열기
              if (isTouchMode) {
                setShowSmartFilterModal(true);
              } else {
                // 음성모드는 기존대로
                setActiveCategory("스마트추천");
                setSmartRecommendData([]);
                const scrollArea = document.querySelector(".menu-scroll-area");
                if (scrollArea) scrollArea.scrollTop = 0;
              }
            }}
          >
            ⭐스마트 추천
          </li>
        </ul>
      </aside>


      <main className="menu-content">
        <div className="menu-fixed-bar">{activeCategory}</div>

        <div className="menu-scroll-area">
          {/* ⭐ 상단 추천 조건 문구 (터치 모드 */}
          {activeCategory === "스마트추천" && isTouchMode && filterResultText && (
            <div className="smart-filter-container">
              <div className="smart-filter-top-text">
                <p>요청하신 조건이 적용된 추천 메뉴입니다</p>
                {/* 상세 조건 표시 */}
                <span className="smart-condition-detail">
                  {buildFilterResultText(smartFilters)}
                </span>

                <p className="smart-filter-hint">
                  ※ 조건에 따라 온도·사이즈가 자동 적용되어 여러 옵션이 표시될 수 있습니다
                </p>
              </div>
            </div>
          )}
          <div className="menu-grid">
            {activeCategory === "스마트추천" ? (
              <>

                {/* 🔥 음성모드에서만 13개 버튼 표시 */}
                {!isTouchMode && (
                  <div
                    className="smart-filter-area"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "12px",
                      marginBottom: "25px",
                      maxWidth: "900px",
                      marginLeft: "auto",
                      marginRight: "auto",
                      textAlign: "center",
                    }}
                  >
                    {/* 기존 13개 버튼들 */}
                    <button className="smart-btn" onClick={() => requestSmartRecommend("calories_kcal", "min")}>칼로리 낮은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("sugar_g", "min")}>당류 낮은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("caffeine_mg", "min")}>카페인 낮은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("sodium_mg", "min")}>나트륨 낮은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("protein_g", "max")}>단백질 많은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("calories_kcal", "max")}>칼로리 높은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("sugar_g", "max")}>당류 높은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("caffeine_mg", "max")}>카페인 높은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("sodium_mg", "max")}>나트륨 높은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("protein_g", "min")}>단백질 적은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("price", "min")}>가격 낮은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("price", "max")}>가격 높은 순</button>
                    <button className="smart-btn" onClick={() => requestSmartRecommend("random", "any")}>랜덤 추천</button>
                  </div>
                )}

                {/* 🔥 추천 메뉴 결과 */}
                {smartRecommendData.length === 0 ? (
                  <p style={{ opacity: 0.7, textAlign: "center" }}>
                    {isTouchMode ? "필터를 설정하면 메뉴가 표시됩니다." : "추천 기준을 선택하면 메뉴가 표시됩니다."}
                  </p>
                ) : (
                  smartRecommendData.map((item, i) => (
                    <div className="menu-item" key={i} onClick={() => {
                      setSelectedMenu(item);
                      setSelectedSize(item.size);
                      setSelectedTemp(item.temperature);
                      setShowModal(true);
                      fetch(`http://localhost:5000/api/menu/${item.name}/options`)
                        .then(res => res.json())
                        .then(opt => {
                          setAvailableSizes(opt.sizes || []);
                          setAvailableTemps(opt.temperatures || []);
                        });
                    }}>
                      <img src={item.img} alt={item.name} />
                      <p>
                        {item.name}
                        <br />
                        <strong>{item.price.toLocaleString()}원</strong>
                      </p>
                    </div>
                  ))
                )}
              </>
            ) : (

              /* 기존 카테고리 메뉴 출력 */
              menuData[activeCategory]?.length > 0 ? (
                menuData[activeCategory].map((item, i) => (
                  <div className="menu-item" key={i} onClick={() => handleMenuClick(item)}>
                    <img src={item.img} alt={item.name} />
                    <p>
                      {item.name}
                      <br />
                      <strong>{item.price.toLocaleString()}원</strong>
                    </p>
                  </div>
                ))
              ) : (
                <p>메뉴가 없습니다.</p>
              )
            )}
          </div>
        </div>
      </main>



      <footer className="menu-footer">
        {!isTouchMode ? (
          <>
            <img
              src={isBlinking ? '/images/staff_eyes.png' : '/images/staff.png'}
              alt="staff"
              className={`staff-img ${isBlinking ? 'eyes' : ''}`}
            />


            <div className="welcome-message">
              {aiText}
            </div>

            <button
              className="voice-record-btn"
              onClick={startRecording}
              style={{ backgroundColor: '#e82929', zIndex: 9999, color: 'white' }}
            >
              🎤 말하기
            </button>

            {renderFooterOptions(() => setShowVoiceSwitchModal(true))}
          </>
        ) : (
          <div className="touch-mode-footer">

            {/* 카드들을 감싸는 회색 박스 */}
            <div className="cart-box-wrapper">
              <div className="cart-slider-area">

                {cartItems.length === 0 && (
                  <div style={{ padding: 20, opacity: 0.7 }}></div>
                )}

                {cartItems.map((item, idx) => (
                  <div className="cart-card" key={idx}>
                    <img src={item.img} alt={item.name} />
                    <p>{item.name}</p>

                    <div className="cart-option">
                      {item.temp} / {item.size}
                      {item.option && ` / ${item.option}`}
                    </div>

                    <div className="qty-controller">
                      <button onClick={() => updateQty(idx, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(idx, 1)}>+</button>
                    </div>

                    <button className="remove-btn" onClick={() => removeFromCart(idx)}>X</button>
                  </div>
                ))}
              </div>

            </div>

            {/* 결제 정보 박스 */}
            <div className="summary-box">
              <div className="summary-title">총 결제금액</div>
              <div className="summary-price">
                ₩ {totalPrice.toLocaleString()}원
              </div>
              <div className="summary-buttons">
                <button className="cancel-order">전체 취소</button>
                <button
                  className="confirm-order"
                  onClick={() =>
                    navigate("/order", {
                      state: { cartItems, totalPrice },
                    })
                  }
                >
                  주문 하기
                </button>

              </div>
            </div>

            {renderFooterOptions(() => setShowSwitchModal(true))}
          </div>
        )}
      </footer>
      {showOptionWarning && (
        <div className="modal-overlay option-warning-overlay">

          <div className="modal-box switch-modal">
            <h3>옵션을 선택해주세요</h3>
            <p>필수 옵션을 모두 선택해야 담을 수 있습니다.</p>

            <div className="modal-buttons switch-buttons">
              <button
                onClick={() => setShowOptionWarning(false)}
                className="switch-confirm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* 호출 중 모달 */}
      {isStaffCalling && (
        <div className="modal-overlay">
          <div className="modal-box switch-modal">
            <h3>직원 호출중입니다...</h3>
            <p>직원 호출중이니 기다려주세요.</p>
          </div>
        </div>
      )}


      {showSwitchModal && (
        <div className="modal-overlay">
          <div className="modal-box switch-modal">
            <h3>터치 모드로 전환하시겠습니까?</h3>
            <p>현재 음성주문 모드입니다.<br />터치로 주문하시려면 전환이 필요합니다.</p>
            <div className="modal-buttons switch-buttons">
              <button onClick={() => setShowSwitchModal(false)} className="cancel-btn switch-cancel">아니오</button>
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  setIsTouchMode(true);

                }}
                className="add-btn switch-confirm"
              >예</button>
            </div>
          </div>
        </div>
      )}

      {showVoiceSwitchModal && (
        <div className="modal-overlay">
          <div className="modal-box switch-modal">
            <h3>음성 모드로 전환하시겠습니까?</h3>
            <p>현재 터치주문 모드입니다. <br />음성으로 주문하시려면 전환이 필요합니다.</p>
            <div className="modal-buttons switch-buttons">
              <button onClick={() => setShowVoiceSwitchModal(false)} className="cancel-btn switch-cancel">아니오</button>
              <button
                onClick={() => {
                  setShowVoiceSwitchModal(false);
                  setIsTouchMode(false);
                }}
                className="add-btn switch-confirm"
              >예</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 스마트 필터 모달 */}
      {showSmartFilterModal && (
        <div className="modal-overlay">
          <div className="smart-filter-modal">
            <h3>⭐ 스마트 추천 옵션</h3>
            {/* 카페인 */}
            <div className="filter-section">
              <label>카페인 (Caffeine)</label>
              <div className="filter-hint">
                <p>※ 1일 권장량은</p>
                <p>성인 400mg, 임산부 200mg, 청소년 100mg 이하입니다</p>
              </div>
              <div className="filter-buttons">
                <button
                  className={smartFilters.caffeine === '없음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, caffeine: '없음' })}
                >
                  없음
                </button>
                <button
                  className={smartFilters.caffeine === '적음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, caffeine: '적음' })}
                >
                  적음
                </button>
                <button
                  className={smartFilters.caffeine === '전체' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, caffeine: '전체' })}
                >
                  전체
                </button>
                <button
                  className={smartFilters.caffeine === '많음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, caffeine: '많음' })}
                >
                  많음
                </button>
              </div>
            </div>

            {/* 칼로리 */}
            <div className="filter-section">
              <label>칼로리 (Calories)</label>
              <div className="filter-buttons">
                <button
                  className={smartFilters.calories === '낮음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, calories: '낮음' })}
                >
                  낮음
                </button>
                <button
                  className={smartFilters.calories === '전체' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, calories: '전체' })}
                >
                  전체
                </button>
                <button
                  className={smartFilters.calories === '높음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, calories: '높음' })}
                >
                  높음
                </button>
              </div>
            </div>

            {/* 당류 */}
            <div className="filter-section">
              <label>당류 (Sugars)</label>
              <div className="filter-buttons">
                <button
                  className={smartFilters.sugar === '없음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, sugar: '없음' })}
                >
                  없음
                </button>
                <button
                  className={smartFilters.sugar === '적음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, sugar: '적음' })}
                >
                  적음
                </button>
                <button
                  className={smartFilters.sugar === '전체' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, sugar: '전체' })}
                >
                  전체
                </button>
                <button
                  className={smartFilters.sugar === '많음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, sugar: '많음' })}
                >
                  많음
                </button>
              </div>
            </div>

            {/* 나트륨 */}
            <div className="filter-section">
              <label>나트륨 (Sodium)</label>
              <div className="filter-buttons">
                <button
                  className={smartFilters.sodium === '없음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, sodium: '없음' })}
                >
                  없음
                </button>
                <button
                  className={smartFilters.sodium === '적음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, sodium: '적음' })}
                >
                  적음
                </button>
                <button
                  className={smartFilters.sodium === '전체' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, sodium: '전체' })}
                >
                  전체
                </button>
                <button
                  className={smartFilters.sodium === '많음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, sodium: '많음' })}
                >
                  많음
                </button>
              </div>
            </div>

            {/* 단백질 */}
            <div className="filter-section">
              <label>단백질 (Protein)</label>
              <div className="filter-buttons">
                <button
                  className={smartFilters.protein === '없음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, protein: '없음' })}
                >
                  없음
                </button>
                <button
                  className={smartFilters.protein === '적음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, protein: '적음' })}
                >
                  적음
                </button>
                <button
                  className={smartFilters.protein === '전체' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, protein: '전체' })}
                >
                  전체
                </button>
                <button
                  className={smartFilters.protein === '많음' ? 'active' : ''}
                  onClick={() => setSmartFilters({ ...smartFilters, protein: '많음' })}
                >
                  많음
                </button>
              </div>
            </div>

            {/* 버튼 */}
            <div className="modal-buttons smart-filter-buttons">
              <button
                onClick={() => {
                  setShowSmartFilterModal(false);
                  // 필터 초기화
                  setSmartFilters({
                    calories: '전체',
                    caffeine: '전체',
                    sugar: '전체',
                    sodium: '전체',
                    protein: '전체'
                  });
                }}
                className="cancel-btn"
              >
                취소
              </button>
              <button
                onClick={applySmartFilter}
                className="add-btn"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/*옵션 선택 모달*/}
      {showModal && (
        <div className="modal-overlay">
          <div className="option-modal-box">
            <h3>옵션 메뉴 선택</h3>
            <img
              src={selectedMenu?.img}
              alt={selectedMenu?.name}
              style={{ width: '130px', borderRadius: '8px' }}
            />
            <p className="option-menu-name"><strong>{selectedMenu?.name || '음료 선택됨'}</strong></p>
            <p className="option-menu-desc">Moment만의 특별한 메뉴인 {selectedMenu?.name}</p>

            {/* 실시간 가격 반영 */}
            <p style={{ fontWeight: 'bold', fontSize: '2.5rem', marginTop: '15px',marginBottom:'30px' }}>
              ₩{selectedMenu?.price?.toLocaleString() || 0}
            </p>

            {/* 옵션 선택: 빙수/베이커리/스낵 제외 */}
            {/* 옵션 선택: 빙수/베이커리/스낵 제외 */}
            {!['빙수 · 아이스크림', '베이커리', '스낵'].includes(activeCategory) && (
              <>
                {/* 온도 */}
                <div className="option-section">
                  <p><strong>온도</strong></p>
                  {availableTemps.includes('Hot') && (
                    <button
                      className={selectedTemp === 'Hot' ? 'active' : ''}
                      onClick={() => setSelectedTemp('Hot')}
                    >
                      HOT
                    </button>
                  )}
                  {availableTemps.includes('Iced') && (
                    <button
                      className={selectedTemp === 'Iced' ? 'active' : ''}
                      onClick={() => setSelectedTemp('Iced')}
                    >
                      ICE
                    </button>
                  )}
                </div>

                {/* 사이즈 */}
                <div className="option-section">
                  <p><strong>사이즈</strong></p>
                  {availableSizes.includes('Small') && (
                    <button
                      className={selectedSize === 'Small' ? 'active' : ''}
                      onClick={() => setSelectedSize('Small')}
                    >
                      Small
                    </button>
                  )}
                  {availableSizes.includes('Large') && (
                    <button
                      className={selectedSize === 'Large' ? 'active' : ''}
                      onClick={() => setSelectedSize('Large')}
                    >
                      Large
                    </button>
                  )}
                </div>

                {/* 추가 옵션 - ⭐ 커피만 표시 */}
                {/* 추가 옵션 - ⭐ selectedMenu 기준으로 커피만 표시 */}
                {selectedMenu?.category === '커피' && (
                  <div className="option-section">
                    <p><strong>추가 옵션</strong></p>
                    <button
                      className={selectedOption === '연하게' ? 'active' : ''}
                      onClick={() => setSelectedOption('연하게')}
                    >
                      연하게
                    </button>
                    <button
                      className={selectedOption === '기본' ? 'active' : ''}
                      onClick={() => setSelectedOption('기본')}
                    >
                      기본
                    </button>
                    <button
                      className={selectedOption === '진하게' ? 'active' : ''}
                      onClick={() => setSelectedOption('진하게')}
                    >
                      진하게
                    </button>
                  </div>
                )}

              </>
            )}


            {/* 상세정보 보기 */}
            <div className="option-section">
              <p
                onClick={() => setShowDetail(!showDetail)}
                className="option-detail-toggle"
              >
                {showDetail ? '상세정보 닫기' : '상세정보 보기'}
              </p>

              {showDetail && selectedMenu && (
                <div className="nutrition-box">
                  <p>용량: {selectedMenu.volume_ml || 0} ml</p>
                  <p>칼로리: {selectedMenu.calories_kcal || 0} kcal</p>
                  <p>카페인: {selectedMenu.caffeine_mg || 0} mg</p>
                  <p>단백질: {selectedMenu.protein_g || 0} g</p>
                  <p>당류: {selectedMenu.sugar_g || 0} g</p>
                  <p>나트륨: {selectedMenu.sodium_mg || 0} mg</p>
                </div>
              )}
            </div>

            <div className="modal-buttons option-buttons">
              <button onClick={handleCloseModal} className="cancel-btn option-cancel">
                취소
              </button>
              <button onClick={handleAddToCart} className="add-btn option-add">
                담기
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default MenuCoffee;
