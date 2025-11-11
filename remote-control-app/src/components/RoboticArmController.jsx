import React, { useState, useCallback } from 'react';
import DPad from './DPad';
import Joystick from './Joystick';
import Button from './Button';
import { sounds } from '../sounds/sounds';
import './RoboticArmController.css';

const RoboticArmController = () => {
  const [power, setPower] = useState(false);
  const [servoPositions, setServoPositions] = useState({
    base: 90,      // servo1 - Left/Right (0-180)
    shoulder: 90,  // servo2 - Up/Down (0-180)
    elbow: 90,     // servo3 - X-axis (0-180)
    gripper: 90    // servo4 - Y-axis (0-180, 90=neutral)
  });

  const handlePowerToggle = () => {
    const newPowerState = !power;
    setPower(newPowerState);
    
    if (newPowerState) {
      sounds.success.play();
      // Reset positions when turning on
      setServoPositions({
        base: 90,
        shoulder: 90,
        elbow: 90,
        gripper: 90
      });
    } else {
      sounds.switch.play();
    }
  };

  const updateServoPosition = useCallback((servo, value) => {
    setServoPositions(prev => ({
      ...prev,
      [servo]: Math.max(0, Math.min(180, value))
    }));
  }, []);

  const handleDirectionChange = useCallback((direction, action) => {
    if (!power) return;

    if (action === 'press') {
      sounds.beep.play();
      
      const step = 5; // Movement step size
      
      switch (direction) {
        case 'left':
          updateServoPosition('base', servoPositions.base - step);
          break;
        case 'right':
          updateServoPosition('base', servoPositions.base + step);
          break;
        case 'up':
          updateServoPosition('shoulder', servoPositions.shoulder + step);
          break;
        case 'down':
          updateServoPosition('shoulder', servoPositions.shoulder - step);
          break;
        default:
          break;
      }
    }
  }, [power, servoPositions, updateServoPosition]);

  const handleJoystickPositionChange = useCallback((position) => {
    if (!power) return;

    const { x, y } = position;
    const step = 2; // Smaller step for smoother joystick control

    // X-axis controls elbow
    if (Math.abs(x) > 0.1) {
      updateServoPosition('elbow', servoPositions.elbow + (x * step));
    }

    // Y-axis controls gripper
    if (Math.abs(y) > 0.1) {
      updateServoPosition('gripper', servoPositions.gripper + (y * step));
    }
  }, [power, servoPositions, updateServoPosition]);

  const handleResetPosition = () => {
    if (!power) {
      sounds.error.play();
      return;
    }

    sounds.switch.play();
    setServoPositions({
      base: 90,
      shoulder: 90,
      elbow: 90,
      gripper: 90
    });
  };

  const handleGripperAction = (action) => {
    if (!power) {
      sounds.error.play();
      return;
    }

    sounds.click.play();
    if (action === 'open') {
      updateServoPosition('gripper', 180); // Fully open
    } else if (action === 'close') {
      updateServoPosition('gripper', 0); // Fully closed
    }
  };

  // Function to send commands to actual hardware (placeholder)
  const sendCommandToHardware = useCallback((servo, position) => {
    // This is where you would send the command to your robotic arm
    // For example: WebSocket, HTTP request, Serial communication, etc.
    console.log(`Moving ${servo} to position: ${position}°`);
    
    // Example WebSocket implementation:
    // if (websocket && websocket.readyState === WebSocket.OPEN) {
    //   websocket.send(JSON.stringify({ servo, position }));
    // }
  }, []);

  // Send commands when positions change
  React.useEffect(() => {
    if (power) {
      Object.entries(servoPositions).forEach(([servo, position]) => {
        sendCommandToHardware(servo, Math.round(position));
      });
    }
  }, [servoPositions, power, sendCommandToHardware]);

  return (
    <div className="robotic-arm-controller">
      <div className="controller-header">
        <h1>🤖 Robotic Arm Controller</h1>
        <div className="status-indicator">
          <div className={`power-led ${power ? 'on' : 'off'}`}></div>
          <span>Power: {power ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      <div className="controller-body">
        {/* Power Control */}
        <div className="control-section">
          <Button
            onClick={handlePowerToggle}
            variant={power ? 'success' : 'danger'}
            className="power-btn"
          >
            {power ? 'POWER ON' : 'POWER OFF'}
          </Button>
        </div>

        {/* Servo Position Display */}
        <div className="position-display">
          <div className="servo-position">
            <span>Base:</span>
            <div className="position-bar">
              <div 
                className="position-fill"
                style={{ width: `${(servoPositions.base / 180) * 100}%` }}
              ></div>
              <span className="position-value">{Math.round(servoPositions.base)}°</span>
            </div>
          </div>
          <div className="servo-position">
            <span>Shoulder:</span>
            <div className="position-bar">
              <div 
                className="position-fill"
                style={{ width: `${(servoPositions.shoulder / 180) * 100}%` }}
              ></div>
              <span className="position-value">{Math.round(servoPositions.shoulder)}°</span>
            </div>
          </div>
          <div className="servo-position">
            <span>Elbow:</span>
            <div className="position-bar">
              <div 
                className="position-fill"
                style={{ width: `${(servoPositions.elbow / 180) * 100}%` }}
              ></div>
              <span className="position-value">{Math.round(servoPositions.elbow)}°</span>
            </div>
          </div>
          <div className="servo-position">
            <span>Gripper:</span>
            <div className="position-bar">
              <div 
                className="position-fill"
                style={{ width: `${(servoPositions.gripper / 180) * 100}%` }}
              ></div>
              <span className="position-value">{Math.round(servoPositions.gripper)}°</span>
            </div>
          </div>
        </div>

        {/* Control Sections */}
        <div className="controls-grid">
          {/* D-Pad Section */}
          <div className="control-panel">
            <DPad 
              onDirectionChange={handleDirectionChange}
              disabled={!power}
            />
          </div>

          {/* Joystick Section */}
          <div className="control-panel">
            <Joystick 
              onPositionChange={handleJoystickPositionChange}
              disabled={!power}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Button
            onClick={handleResetPosition}
            variant="warning"
            disabled={!power}
          >
            RESET POSITION
          </Button>
          <div className="gripper-controls">
            <Button
              onClick={() => handleGripperAction('open')}
              variant="success"
              disabled={!power}
            >
              OPEN GRIPPER
            </Button>
            <Button
              onClick={() => handleGripperAction('close')}
              variant="danger"
              disabled={!power}
            >
              CLOSE GRIPPER
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoboticArmController;