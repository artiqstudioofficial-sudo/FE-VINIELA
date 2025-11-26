import React from "react";

export interface BarChartItem {
  label: string;
  value: number;
}

interface SVGBarChartProps {
  data: BarChartItem[];
  color: string;
}

const SVGBarChart: React.FC<SVGBarChartProps> = ({ data, color }) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barHeight = 24;
  const gap = 12;
  const totalHeight = data.length * (barHeight + gap);
  const labelWidth = 120;

  if (data.length === 0) {
    return (
      <div className="text-gray-400 text-sm text-center py-10">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width="100%"
        height={totalHeight}
        className="min-w-[300px] font-sans text-xs"
      >
        {data.map((item, i) => {
          const barWidthPercent = (item.value / maxVal) * 100;
          const y = i * (barHeight + gap);
          return (
            <g key={i} className="group">
              <rect
                x={labelWidth}
                y={y}
                width={`calc(100% - ${labelWidth + 40}px)`} // background bar
                height={barHeight}
                rx="4"
                fill="#f3f4f6"
              />
              <rect
                x={labelWidth}
                y={y}
                width={`${barWidthPercent * 0.8}%`}
                height={barHeight}
                rx="4"
                fill={color}
                className="transition-all duration-1000 ease-out origin-left hover:opacity-80"
              >
                <animate
                  attributeName="width"
                  from="0"
                  to={`${barWidthPercent * 0.8}%`}
                  dur="0.8s"
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1"
                />
              </rect>
              <text
                x="0"
                y={y + barHeight / 1.5}
                fill="#4b5563"
                className="font-medium"
                style={{ textOverflow: "ellipsis" }}
              >
                {item.label.length > 18
                  ? item.label.substring(0, 18) + "..."
                  : item.label}
              </text>
              <text
                x={`calc(${labelWidth}px + ${barWidthPercent * 0.8}% + 10px)`}
                y={y + barHeight / 1.5}
                fill="#1a1a1a"
                fontWeight="bold"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default SVGBarChart;
