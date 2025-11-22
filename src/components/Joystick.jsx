import React, { useState, useRef, useCallback, useEffect } from 'react';
import { sounds } from '../sounds/sounds';
import './Joystick.css';

const Joystick = ({ onPositionChange, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef(null);
  const knobRef = useRef(null);

  const MAX_DISTANCE = 50;

  const updatePosition = useCallback((clientX, clientY) => {
    if (!joystickRef.current || disabled) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    const distance = Math.min(MAX_DISTANCE, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
    const angle = Math.atan2(deltaY, deltaX);
    
    const newX = Math.cos(angle) * distance;
    const newY = Math.sin(angle) * distance;

    setPosition({ x: newX, y: newY });
    
    const normalizedX = newX / MAX_DISTANCE;
    const normalizedY = newY / MAX_DISTANCE;
    
    onPositionChange({ x: normalizedX, y: normalizedY });
  }, [disabled, onPositionChange]);

  const handleMouseDown = useCallback((e) => {
    if (disabled) {
      sounds.error.play();
      return;
    }
    
    setIsDragging(true);
    sounds.click.play();
    updatePosition(e.clientX, e.clientY);
  }, [disabled, updatePosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    updatePosition(e.clientX, e.clientY);
  }, [isDragging, updatePosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onPositionChange({ x: 0, y: 0 });
  }, [isDragging, onPositionChange]);

  const handleTouchStart = useCallback((e) => {
    if (disabled) {
      sounds.error.play();
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    sounds.click.play();
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
  }, [disabled, updatePosition]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
  }, [isDragging, updatePosition]);

  const handleTouchEnd = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onPositionChange({ x: 0, y: 0 });
  }, [isDragging, onPositionChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className="joystick-container">
      <div className="joystick-label">Elbow & Gripper Control</div>
      <div 
        ref={joystickRef}
        className={`joystick ${disabled ? 'disabled' : ''}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div 
          ref={knobRef}
          className="joystick-knob"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          }}
        />
      </div>
      <div className="joystick-instruction">
        X-Axis: Elbow | Y-Axis: Gripper
      </div>
      <div className="joystick-position">
        X: {position.x.toFixed(0)} | Y: {position.y.toFixed(0)}
      </div>
    </div>
  );
};

export default Joystick;