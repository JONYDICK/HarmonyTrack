import React, { useEffect, useState } from 'react';
import { getPerformanceMonitor, PerformanceMetrics, detectDeviceCapability, DeviceCapability } from '../utils/performance';

interface PerformanceHUDProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const PerformanceHUD: React.FC<PerformanceHUDProps> = ({
  enabled = import.meta.env.MODE === 'development',
  position = 'top-right',
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    warnings: [],
  });
  const [deviceInfo, setDeviceInfo] = useState<DeviceCapability | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Detect device capability
    const capability = detectDeviceCapability();
    setDeviceInfo(capability);

    // Start monitoring
    const monitor = getPerformanceMonitor();
    monitor.startMonitoring((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      monitor.stopMonitoring();
    };
  }, [enabled]);

  if (!enabled) return null;

  const getFPSColor = () => {
    if (metrics.fps >= 55) return '#10D97D';
    if (metrics.fps >= 30) return '#FFB627';
    return '#FF006E';
  };

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      padding: '10px',
      borderRadius: '8px',
      backgroundColor: 'rgba(10, 10, 15, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#E0AAFF',
      minWidth: '150px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '10px', left: '10px' };
      case 'top-right':
        return { ...baseStyles, top: '10px', right: '10px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '10px', left: '10px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '10px', right: '10px' };
      default:
        return { ...baseStyles, top: '10px', right: '10px' };
    }
  };

  return (
    <div
      style={getPositionStyles()}
      onClick={() => setIsExpanded(!isExpanded)}
      title="Click to expand/collapse"
    >
      {/* Compact View */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: isExpanded ? '10px' : '0',
      }}>
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: getFPSColor(),
        }}>
          {metrics.fps.toFixed(1)} FPS
        </span>
        
        <span style={{
          fontSize: '10px',
          color: '#9D4EDD',
        }}>
          {metrics.frameTime.toFixed(2)}ms
        </span>

        {metrics.warnings.length > 0 && (
          <span style={{
            backgroundColor: '#FF006E',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: '600',
          }}>
            !
          </span>
        )}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {/* Device Info */}
          {deviceInfo && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '8px',
              borderRadius: '6px',
            }}>
              <div style={{
                fontSize: '10px',
                color: '#9D4EDD',
                marginBottom: '4px',
                fontWeight: '600',
              }}>
                DEVICE
              </div>
              <div style={{
                fontSize: '11px',
                color: '#E0AAFF',
              }}>
                Tier: <span style={{
                  color: deviceInfo.tier === 'high' ? '#10D97D' : deviceInfo.tier === 'medium' ? '#FFB627' : '#FF006E',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}>
                  {deviceInfo.tier}
                </span>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#9D4EDD',
                marginTop: '2px',
              }}>
                Particles: {deviceInfo.particleDensity} | Blur: {deviceInfo.enableBlur ? 'ON' : 'OFF'}
              </div>
            </div>
          )}

          {/* Memory Usage */}
          {metrics.memoryUsage !== undefined && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '8px',
              borderRadius: '6px',
            }}>
              <div style={{
                fontSize: '10px',
                color: '#9D4EDD',
                marginBottom: '4px',
                fontWeight: '600',
              }}>
                MEMORY
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${metrics.memoryUsage * 100}%`,
                  height: '100%',
                  backgroundColor: metrics.memoryUsage > 0.8 ? '#FF006E' : '#10D97D',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{
                fontSize: '10px',
                color: '#E0AAFF',
                marginTop: '4px',
              }}>
                {(metrics.memoryUsage * 100).toFixed(1)}% used
              </div>
            </div>
          )}

          {/* Warnings */}
          {metrics.warnings.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(255, 0, 110, 0.1)',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #FF006E',
            }}>
              <div style={{
                fontSize: '10px',
                color: '#FF006E',
                marginBottom: '4px',
                fontWeight: '600',
              }}>
                WARNINGS
              </div>
              {metrics.warnings.map((warning, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '10px',
                    color: '#FFB627',
                    marginTop: '2px',
                  }}
                >
                  • {warning}
                </div>
              ))}
            </div>
          )}

          <div style={{
            fontSize: '9px',
            color: '#9D4EDD',
            textAlign: 'center',
            marginTop: '4px',
            fontStyle: 'italic',
          }}>
            Click to collapse
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceHUD;
