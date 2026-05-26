import React, { useCallback, useRef, useState } from 'react';

export default function SeekBar({ seek, duration, onSeek }) {
  const trackRef = useRef(null);
  const scrubbingRef = useRef(false);   // truth source for the gesture
  const [scrubbing, setScrubbing] = useState(false); // for re-render of preview
  const [scrubValue, setScrubValue] = useState(0);
  const [hover, setHover] = useState(null);

  const positionFromEvent = useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    return (x / rect.width) * (duration || 0);
  }, [duration]);

  const onPointerDown = (e) => {
    if (!duration) return;
    scrubbingRef.current = true;
    setScrubbing(true);
    const v = positionFromEvent(e);
    setScrubValue(v);
    onSeek(v); // jump immediately on click
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e) => {
    if (scrubbingRef.current) {
      setScrubValue(positionFromEvent(e));
    } else if (duration) {
      setHover(positionFromEvent(e));
    }
  };

  const onPointerUp = (e) => {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    setScrubbing(false);
    const v = positionFromEvent(e);
    onSeek(v);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  const onPointerCancel = () => {
    scrubbingRef.current = false;
    setScrubbing(false);
  };

  const displaySeek = scrubbing ? scrubValue : seek;
  const pct = duration > 0 ? Math.min(100, (displaySeek / duration) * 100) : 0;
  const hoverPct = hover != null && duration > 0 ? (hover / duration) * 100 : null;

  return (
    <div
      ref={trackRef}
      className="seek-bar"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={() => setHover(null)}
    >
      <div className="seek-track">
        {hoverPct !== null && <div className="seek-hover" style={{ width: `${hoverPct}%` }} />}
        <div className="seek-fill" style={{ width: `${pct}%` }} />
        <div className="seek-knob" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}
