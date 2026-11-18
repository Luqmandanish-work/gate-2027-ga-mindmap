import { memo } from 'react';
import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from '@xyflow/react';
import type { GlowEdgeData } from '../types/syllabus';

type GlowEdgeType = Edge<GlowEdgeData, 'glowBezier'>;

export const GlowBezierEdge = memo(function GlowBezierEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<GlowEdgeType>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.42,
  });

  const color = data?.color ?? '#60a5fa';
  const isHighlighted = Boolean(data?.isHighlighted);
  const isDimmed = Boolean(data?.isDimmed);

  return (
    <g
      style={{
        opacity: isDimmed ? 0.14 : isHighlighted ? 1 : 0.62,
        transition: 'opacity 220ms ease',
      }}
    >
      {isHighlighted && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeOpacity={0.22}
          strokeLinecap="round"
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isHighlighted ? 2.4 : 1.6,
          strokeLinecap: 'round',
        }}
      />
      {isHighlighted && (
        <path
          d={edgePath}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.65}
          strokeWidth={1.5}
          strokeLinecap="round"
          className="edge-flow-animated"
        />
      )}
    </g>
  );
});
