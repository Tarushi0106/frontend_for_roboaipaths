import React, { useState, useCallback, useEffect } from 'react';
import DPad from './DPad';
import Joystick from './Joystick';
import Button from './Button';
import { sounds } from '../sounds/sounds';
import './RoboticArmController.css';

const RoboticArmController = () => {
  // WiFi & Backend connection
  const [backendURL, setBackendURL] = useState('http://192.168.4.1');
  const [ipInput, setIpInput] = useState('192.168.4.1');
  const [connectionMode, setConnectionMode] = useState('wifi'); // 'wifi' or 'localhost'
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'disconnected' | 'connecting'
  const [lastError, setLastError] = useState('');

  // Servo mapping: UI name -> backend servo number (1-4)
  const servoMap = {
    base: 1,
    shoulder: 2,
    elbow: 3,
    gripper: 4
  };

  const [power, setPower] = useState(false);
  const [servoPositions, setServoPositions] = useState({
    base: 90,     
    shoulder: 90,  
    elbow: 90,    
    gripper: 90    
  });

  // Test connection to backend
  const testConnection = async () => {
    setConnectionStatus('connecting');
    try {
      let url;
      if (connectionMode === 'localhost') {
        // Default localhost mock server includes port 3000 for local testing
        url = `http://localhost:3000`;
      } else {
        url = `http://${ipInput}`;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${url}/status`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Status request failed (${response.status})`);

      // Try to parse backend status JSON (contains a1..a4)
      try {
        const data = await response.json();
        if (data && typeof data.a1 !== 'undefined') {
          setServoPositions({
            base: Number(data.a1),
            shoulder: Number(data.a2),
            elbow: Number(data.a3),
            gripper: Number(data.a4)
          });
        }
      } catch (e) {
        // ignore parse errors, still treat as connected if response.ok
      }

      setBackendURL(url);
      setConnectionStatus('connected');
      setLastError('');
      sounds.success.play();
    } catch (error) {
      setConnectionStatus('disconnected');
      if (error.name === 'AbortError') {
        setLastError('Connection timeout - ESP8266 not responding. Make sure it\'s powered on.');
      } else {
        setLastError(`Connection failed: ${error.message}`);
      }
      sounds.error.play();
      console.error('Connection error:', error);
    }
  };

  // Send servo command to backend
  const sendServoCommand = useCallback(async (servoName, angle) => {
    if (connectionStatus !== 'connected' || !power) return;

    const servoNum = servoMap[servoName];
    if (!servoNum) {
      console.error(`Unknown servo: ${servoName}`);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const url = `${backendURL}/setServo?servo=${servoNum}&angle=${Math.round(angle)}`;
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Servo command returned non-ok status', response.status);
      }

      console.log(`Sent ${servoName} -> ${Math.round(angle)}°`);
    } catch (error) {
      if (error.name === 'AbortError') console.error('Servo command timeout');
      else console.error('Servo command error:', error);
    }
  }, [backendURL, connectionStatus, power, servoMap]);

  // Periodic status update from backend
  useEffect(() => {
    if (connectionStatus !== 'connected' || !power) return;

    const statusInterval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${backendURL}/status`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) return;
        const data = await response.json();
        if (data && typeof data.a1 !== 'undefined') {
          setServoPositions({
            base: Number(data.a1),
            shoulder: Number(data.a2),
            elbow: Number(data.a3),
            gripper: Number(data.a4)
          });
        }
      } catch (error) {
        console.error('Status fetch error:', error);
      }
    }, 1000); // Poll every 1000ms

    return () => clearInterval(statusInterval);
  }, [backendURL, connectionStatus, power]);

  const handlePowerToggle = () => {
    if (connectionStatus !== 'connected') {
      sounds.error.play();
      setLastError('Not connected to backend');
      return;
    }

    const newPowerState = !power;
    setPower(newPowerState);
    
    if (newPowerState) {
      sounds.success.play();
      setServoPositions({
        base: 90,
        shoulder: 90,
        elbow: 90,
        gripper: 90
      });
      // Send initial positions
      Object.entries(servoMap).forEach(([servo, _]) => {
        sendServoCommand(servo, 90);
      });
    } else {
      sounds.switch.play();
    }
  };

  const updateServoPosition = useCallback((servo, value) => {
    const clampedValue = Math.max(0, Math.min(180, value));
    setServoPositions(prev => ({
      ...prev,
      [servo]: clampedValue
    }));
    // Send command to backend
    sendServoCommand(servo, clampedValue);
  }, [sendServoCommand]);

  const handleDirectionChange = useCallback((direction, action) => {
    if (!power) return;

    if (action === 'press') {
      sounds.beep.play();
      
      const step = 5; 
      
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
    const step = 2; 

    if (Math.abs(x) > 0.1) {
      updateServoPosition('elbow', servoPositions.elbow + (x * step));
    }

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
      updateServoPosition('gripper', 180); 
    } else if (action === 'close') {
      updateServoPosition('gripper', 0); 
    }
  };

  const sendCommandToHardware = useCallback((servo, position) => {
    console.log(`Moving ${servo} to position: ${position}°`);
    sendServoCommand(servo, position);
  }, [sendServoCommand]);

  // Remove the old useEffect that called sendCommandToHardware without backend integration
  // It will now be integrated into updateServoPosition

  return (
    <div className="robotic-arm-controller">
      <div className="controller-header">
        <h1>🤖 Robotic Arm Controller</h1>
        <div className="status-indicator">
          <div className={`power-led ${power ? 'on' : 'off'}`}></div>
          <span>Power: {power ? 'ON' : 'OFF'}</span>
        </div>
        
        {/* WiFi Connection Panel */}
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>
            Connection: <span style={{ color: connectionStatus === 'connected' ? '#00ff88' : '#ff4444' }}>
              {connectionStatus === 'connecting' ? 'Connecting...' : connectionStatus}
            </span>
          </div>
          
          {/* Connection Mode Selector */}
          <div style={{ marginBottom: '8px', display: 'flex', gap: '10px' }}>
            <label style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="radio" 
                name="connectionMode" 
                value="wifi"
                checked={connectionMode === 'wifi'}
                onChange={(e) => setConnectionMode(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
              WiFi (192.168.4.1)
            </label>
            <label style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="radio" 
                name="connectionMode" 
                value="localhost"
                checked={connectionMode === 'localhost'}
                onChange={(e) => setConnectionMode(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
              Localhost
            </label>
          </div>

          {/* IP Input (only for WiFi mode) */}
          {connectionMode === 'wifi' && (
            <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="192.168.4.1"
                style={{
                  flex: 1,
                  padding: '6px',
                  backgroundColor: '#1a1a2e',
                  border: '1px solid var(--color-blue-300)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px'
                }}
              />
              <Button
                onClick={testConnection}
                variant="primary"
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                Connect
              </Button>
            </div>
          )}

          {/* Auto-connect for Localhost */}
          {connectionMode === 'localhost' && (
            <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
              <Button
                onClick={testConnection}
                variant="primary"
                style={{ padding: '6px 12px', fontSize: '11px', flex: 1 }}
              >
                Connect to Localhost
              </Button>
            </div>
          )}

          {lastError && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#ff6666' }}>
              {lastError}
            </div>
          )}
        </div>
      </div>

      <div className="controller-body">

        <div className="control-section">
          <Button
            onClick={handlePowerToggle}
            variant={power ? 'success' : 'danger'}
            className="power-btn"
          >
            {power ? 'POWER ON' : 'POWER OFF'}
          </Button>
        </div>

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


        <div className="controls-grid">
     
          <div className="control-panel">
            <DPad 
              onDirectionChange={handleDirectionChange}
              disabled={!power}
            />
          </div>

          <div className="control-panel">
            <Joystick 
              onPositionChange={handleJoystickPositionChange}
              disabled={!power}
            />
          </div>
        </div>

    
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