import { useEffect, useState, useRef } from "react";
import "./Preloader.css";

const MESSAGES = [
  "Đang chuẩn bị...",
  "Tải sản phẩm...",
  "Sắp xong rồi...",
  "Chào mừng bạn!",
];

/**
 * Preloader — Liquid Fill style
 *
 * Props:
 *   isLoading  {boolean}  — hiện preloader khi true, ẩn khi false
 *   minDisplay {number}   — thời gian tối thiểu hiển thị (ms), mặc định 1800
 *   onDone     {function} — callback sau khi animation exit xong
 */
export default function Preloader({ isLoading = true, minDisplay = 1800, onDone }) {
  const [visible, setVisible] = useState(true);   // còn trong DOM không
  const [exiting, setExiting] = useState(false);  // đang chạy exit animation
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);

  const minDoneRef = useRef(false);
  const loadDoneRef = useRef(false);

  // Đếm thời gian tối thiểu
  useEffect(() => {
    const t = setTimeout(() => {
      minDoneRef.current = true;
      if (loadDoneRef.current) startExit();
    }, minDisplay);
    return () => clearTimeout(t);
  }, []);

  // Theo dõi isLoading từ ngoài
  useEffect(() => {
    if (!isLoading) {
      loadDoneRef.current = true;
      if (minDoneRef.current) startExit();
    }
  }, [isLoading]);

  function startExit() {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 700); // khớp với transition exit trong CSS
  }

  // Xoay vòng message
  useEffect(() => {
    const iv = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % MESSAGES.length);
        setMsgVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  if (!visible) return null;

  return (
    <div className={`preloader-screen${exiting ? " preloader-exit" : ""}`} aria-label="Đang tải trang">

      {/* Ambient background blobs */}
      <div className="preloader-blob preloader-blob--1" />
      <div className="preloader-blob preloader-blob--2" />
      <div className="preloader-blob preloader-blob--3" />

      {/* Dot texture overlay */}
      <div className="preloader-dots" aria-hidden="true" />

      <div className="preloader-center">

        {/* ── Cup scene ── */}
        <div className="cup-scene" aria-hidden="true">

          {/* Drip từ ống hút */}
          <div className="cup-drip" />

          {/* Ống hút */}
          <div className="cup-straw">
            <div className="cup-straw__shine" />
          </div>

          {/* Lá garnish */}
          <div className="cup-garnish">
            <svg width="32" height="26" viewBox="0 0 32 26" fill="none">
              <path
                d="M16 24 C7 17 2 7 9 2 C14 -1 22 4 16 24Z"
                fill="#4ab973"
                opacity="0.92"
              />
              <path
                d="M16 24 C16 14 11 6 9 2"
                stroke="#2d7a4f"
                strokeWidth="0.9"
                fill="none"
                strokeLinecap="round"
              />
              {/* gân phụ */}
              <path d="M13 8 Q16 11 19 10" stroke="#2d7a4f" strokeWidth="0.6" fill="none" opacity="0.5" />
              <path d="M12 14 Q16 16 20 14" stroke="#2d7a4f" strokeWidth="0.6" fill="none" opacity="0.5" />
            </svg>
          </div>

          {/* Thân ly */}
          <div className="cup-body">
            <div className="cup-glass">
              {/* Nước dâng */}
              <div className="cup-liquid">
                <div className="cup-wave" />
                <div className="cup-wave cup-wave--2" />
                {/* Bọt khí */}
                <div className="bubble bubble--1" />
                <div className="bubble bubble--2" />
                <div className="bubble bubble--3" />
                <div className="bubble bubble--4" />
                <div className="bubble bubble--5" />
              </div>
              {/* Bóng phản chiếu */}
              <div className="cup-shine cup-shine--1" />
              <div className="cup-shine cup-shine--2" />
            </div>
            {/* Đế ly */}
            <div className="cup-base" />
          </div>
        </div>

        {/* ── Brand text ── */}
        <p className="preloader-eyebrow">Fresh &amp; Natural</p>
        <h1 className="preloader-brand">
          Green <span>Juice</span> Hub
        </h1>
        <p className="preloader-tagline">Pure · Organic · Fresh</p>

        {/* ── Progress ── */}
        <div className="preloader-progress">
          <div className="preloader-track">
            <div className={`preloader-fill${exiting ? " preloader-fill--done" : ""}`} />
          </div>
          <p className={`preloader-msg${msgVisible ? " preloader-msg--visible" : ""}`}>
            {MESSAGES[msgIdx]}
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="preloader-footer">greenjuicehub.vn</p>
    </div>
  );
}