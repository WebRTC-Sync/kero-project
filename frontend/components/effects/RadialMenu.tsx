"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import RadialMenuPresentational from "./RadialMenuPresentational";
import { MenuItem, Position } from "./radial-menu-types";

const MENU_ITEMS: MenuItem[] = [
  { id: "love", emoji: "\u2764\uFE0F", label: "Love", color: "#ef4444" },
  { id: "laugh", emoji: "\uD83D\uDE02", label: "Haha", color: "#fbbf24" },
  { id: "wow", emoji: "\uD83D\uDE2E", label: "Wow", color: "#3b82f6" },
  { id: "sad", emoji: "\uD83D\uDE22", label: "Sad", color: "#60a5fa" },
  { id: "angry", emoji: "\uD83D\uDE21", label: "Angry", color: "#f97316" },
  { id: "fire", emoji: "\uD83D\uDD25", label: "Lit", color: "#f59e0b" },
];

const DEAD_ZONE = 20;
const HOLD_DELAY = 0;

export default function RadialMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<Position>({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isOpenRef = useRef(false);
  const menuPosRef = useRef<Position>({ x: 0, y: 0 });
  const activeIndexRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const suppressMenuRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
    menuPosRef.current = menuPos;
    activeIndexRef.current = activeIndex;
  }, [isOpen, menuPos, activeIndex]);

  const fireConfetti = useCallback((pageX: number, pageY: number, emoji: string) => {
    const normalizedX = (pageX - window.scrollX) / window.innerWidth;
    const normalizedY = (pageY - window.scrollY) / window.innerHeight;
    const count = 5;

    for (let i = 0; i < count; i++) {
      const scalar = 1.5 + Math.random() * 5;
      const emojiShape = confetti.shapeFromText({ text: emoji, scalar });

      confetti({
        particleCount: 15,
        spread: 60 + Math.random() * 20,
        origin: { x: normalizedX, y: normalizedY },
        shapes: [emojiShape],
        scalar,
        disableForReducedMotion: true,
        zIndex: 9999,
        startVelocity: 25 + Math.random() * 10,
        gravity: 0.6 + Math.random() * 0.4,
        drift: (Math.random() - 0.5) * 0.5,
      });
    }
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 2) {
      const pos = { x: e.clientX, y: e.clientY };
      timerRef.current = setTimeout(() => {
        setMenuPos(pos);
        setIsOpen(true);
        setActiveIndex(null);
        suppressMenuRef.current = true;
      }, HOLD_DELAY);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isOpenRef.current) return;
    const currentPos = { x: e.clientX, y: e.clientY };
    const origin = menuPosRef.current;
    const dist = Math.sqrt(Math.pow(currentPos.x - origin.x, 2) + Math.pow(currentPos.y - origin.y, 2));

    if (dist < DEAD_ZONE) {
      if (activeIndexRef.current !== null) setActiveIndex(null);
      return;
    }

    const dx = currentPos.x - origin.x;
    const dy = currentPos.y - origin.y;
    let theta = (Math.atan2(dy, dx) * 180) / Math.PI;
    const normalizedAngle = (theta + 90) % 360;
    const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 360 : normalizedAngle;
    const index = Math.floor(positiveAngle / (360 / MENU_ITEMS.length));

    if (activeIndexRef.current !== index) setActiveIndex(index);
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isOpenRef.current) {
      if (activeIndexRef.current !== null) {
        const item = MENU_ITEMS[activeIndexRef.current];
        fireConfetti(e.pageX, e.pageY, item.emoji);
      }
      setIsOpen(false);
      setActiveIndex(null);
    }
  }, [fireConfetti]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (suppressMenuRef.current) {
      e.preventDefault();
      suppressMenuRef.current = false;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleContextMenu]);

  return (
    <RadialMenuPresentational
      isOpen={isOpen}
      position={menuPos}
      items={MENU_ITEMS}
      activeIndex={activeIndex}
    />
  );
}
