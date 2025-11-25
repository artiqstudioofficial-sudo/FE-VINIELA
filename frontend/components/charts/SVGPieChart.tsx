import React from "react";

export interface PieChartItem {
  label: string;
  value: number;
  color: string;
}

interface SVGPieChartProps {
  data: PieChartItem[];
}

const SVGPieChart: React.FC<SVGPieChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = data.map((item) => {
    const startPercent = cumulativePercent;
    const slicePercent = total === 0 ? 0 : item.value / total;
    cumulativePercent += slicePercent;
    const endPercent = cumulativePercent;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

    if (total === item.value) {
      return {
        path: "M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0",
        color: item.color,
        percent: slicePercent,
        label: item.label,
        value: item.value,
      };
    }

    const pathData = [
      `M 0 0`,
      `L ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `Z`,
    ].join(" ");

    return {
      path: pathData,
      color: item.color,
      percent: slicePercent,
      label: item.label,
      value: item.value,
    };
  });

  if (total === 0) {
    return (
      <div className="text-gray-400 text-sm text-center py-10">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
      <div className="relative w-48 h-48">
        <svg
          viewBox="-1.1 -1.1 2.2 2.2"
          className="w-full h-full transform -rotate-90"
        >
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.path}
              fill={slice.color}
              className="hover:opacity-90 transition-opacity cursor-pointer stroke-white stroke-[0.02]"
            >
              <title>{`${slice.label}: ${slice.value} (${(
                slice.percent * 100
              ).toFixed(1)}%)`}</title>
            </path>
          ))}
          <circle cx="0" cy="0" r="0.6" fill="white" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="block text-3xl font-bold text-viniela-dark">
              {total}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
              Total
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 min-w-[150px]">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 text-sm group cursor-default"
          >
            <span
              className="w-3 h-3 rounded-full shadow-sm group-hover:scale-125 transition-transform"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex justify-between w-full text-gray-600">
              <span>{item.label}</span>
              <span className="font-bold text-viniela-dark ml-3">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SVGPieChart;
