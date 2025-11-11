import React, { useState, useEffect } from 'react';
import Button from './Button';
import { sounds } from '../sounds/sounds';
import './RemoteControl.css';

const RemoteControl = () => {
  const [power, setPower] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentChannel, setCurrentChannel] = useState(1);
  const [muted, setMuted] = useState(false);


  useEffect(() => {
    Object.values(sounds).forEach(sound => {
      sound.volume(volume / 100);
    });
  }, [volume]);

  const handlePowerToggle = () => {
    const newPowerState = !power;
    setPower(newPowerState);
    if (newPowerState) {
      sounds.success.play();
    } else {
      sounds.switch.play();
    }
  };

  const handleVolumeChange = (newVolume) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(clampedVolume);
    sounds.click.play();
    

    Object.values(sounds).forEach(sound => {
      sound.volume(clampedVolume / 100);
    });
  };

  const handleChannelChange = (channel) => {
    if (!power) {
      sounds.error.play();
      return;
    }
    
    setCurrentChannel(channel);
    sounds.beep.play();
  };

  const handleMuteToggle = () => {
    if (!power) {
      sounds.error.play();
      return;
    }
    
    setMuted(!muted);
    sounds.switch.play();
  };

  const handleNumberPress = (number) => {
    if (!power) {
      sounds.error.play();
      return;
    }
    
    sounds.click.play();
   
    setCurrentChannel(number);
  };

  return (
    <div className="remote-control">
      <div className="remote-header">
        <h1>Universal Remote</h1>
        <div className="status-indicator">
          <div className={`power-led ${power ? 'on' : 'off'}`}></div>
          <span>Power: {power ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      <div className="remote-body">
    
        <div className="control-section">
          <Button
            onClick={handlePowerToggle}
            variant={power ? 'success' : 'danger'}
            className="power-btn"
          >
            {power ? 'POWER ON' : 'POWER OFF'}
          </Button>
        </div>

    
        <div className="display-section">
          <div className="display">
            <div className="channel-display">
              CH: {power ? currentChannel : '---'}
            </div>
            <div className="volume-display">
              VOL: {power ? (muted ? 'MUTED' : volume) : '---'}
            </div>
          </div>
        </div>

  
        <div className="control-section">
          <div className="volume-controls">
            <Button
              onClick={() => handleVolumeChange(volume - 10)}
              variant="primary"
              disabled={!power}
            >
              VOL -
            </Button>
            <Button
              onClick={handleMuteToggle}
              variant={muted ? 'warning' : 'secondary'}
              disabled={!power}
            >
              {muted ? 'UNMUTE' : 'MUTE'}
            </Button>
            <Button
              onClick={() => handleVolumeChange(volume + 10)}
              variant="primary"
              disabled={!power}
            >
              VOL +
            </Button>
          </div>
        </div>

     
        <div className="control-section">
          <div className="channel-controls">
            <Button
              onClick={() => handleChannelChange(currentChannel - 1)}
              variant="secondary"
              disabled={!power}
            >
              CH -
            </Button>
            <Button
              onClick={() => handleChannelChange(currentChannel + 1)}
              variant="secondary"
              disabled={!power}
            >
              CH +
            </Button>
          </div>
        </div>


        <div className="control-section">
          <div className="number-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((number) => (
              <Button
                key={number}
                onClick={() => handleNumberPress(number)}
                variant="primary"
                disabled={!power}
                className="number-btn"
              >
                {number}
              </Button>
            ))}
          </div>
        </div>

      
        <div className="control-section">
          <div className="quick-channels">
            <Button
              onClick={() => handleChannelChange(1)}
              variant="success"
              disabled={!power}
            >
              NEWS
            </Button>
            <Button
              onClick={() => handleChannelChange(2)}
              variant="success"
              disabled={!power}
            >
              SPORTS
            </Button>
            <Button
              onClick={() => handleChannelChange(3)}
              variant="success"
              disabled={!power}
            >
              MOVIES
            </Button>
            <Button
              onClick={() => handleChannelChange(4)}
              variant="success"
              disabled={!power}
            >
              MUSIC
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteControl;