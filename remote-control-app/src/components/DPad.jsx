import React, { useState, useCallback } from 'react';
import { sounds } from '../sounds/sounds';
import './DPad.css';

const DPad = ({ onDirectionChange, disabled = false }) => {
  const [activeDirection, setActiveDirection] = useState(null);

  const handleDirectionPress = useCallback((direction) => {
    if (disabled) {
      sounds.error.play();
      return;
    }

    setActiveDirection(direction);
    sounds.click.play();
    onDirectionChange(direction, 'press');
  }, [disabled, onDirectionChange]);

  const handleDirectionRelease = useCallback((direction) => {
    setActiveDirection(null);
    onDirectionChange(direction, 'release');
  }, [onDirectionChange]);

  const DirectionButton = ({ direction, icon, position, label }) => (
    <button
      className={`dpad-button ${position} ${activeDirection === direction ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onMouseDown={() => handleDirectionPress(direction)}
      onMouseUp={() => handleDirectionRelease(direction)}
      onMouseLeave={() => activeDirection === direction && handleDirectionRelease(direction)}
      onTouchStart={(e) => {
        e.preventDefault();
        handleDirectionPress(direction);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleDirectionRelease(direction);
      }}
      disabled={disabled}
    >
      <span className="dpad-icon">{icon}</span>
      <span className="dpad-label-small">{label}</span>
    </button>
  );

  return (
    <div className="dpad-container">
      <div className="dpad-header">
        <h3>Base & Shoulder Control</h3>
        <div className="dpad-instruction">
          <div className="instruction-row">
            <span className="instruction-item">
              <span className="arrow">←→</span> Base
            </span>
            <span className="instruction-item">
              <span className="arrow">↑↓</span> Shoulder
            </span>
          </div>
        </div>
      </div>
      
      <div className="dpad">
        <DirectionButton 
          direction="up" 
          icon="↑" 
          position="top" 
          label="Shoulder"
        />
        <DirectionButton 
          direction="right" 
          icon="→" 
          position="right" 
          label="Base"
        />
        <div className="dpad-center">
          <div className="dpad-center-text">D-PAD</div>
        </div>
        <DirectionButton 
          direction="down" 
          icon="↓" 
          position="bottom" 
          label="Shoulder"
        />
        <DirectionButton 
          direction="left" 
          icon="←" 
          position="left" 
          label="Base"
        />
      </div>
    </div>
  );
};

export default DPad;