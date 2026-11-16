import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { chartColors } from '@/constants/theme';
import { formatAxis } from '@/lib/format';
import { chartScale } from '@/lib/summary';

export type BarDatum = { label: string; income: number; expense: number };

type Props = { data: BarDatum[]; height?: number };

const AXIS_W = 30;
const BOTTOM = 26;
const TOP = 8;
const BAR_W = 9;

/** Gráfico de barras agrupadas (receitas x despesas por mês), desenhado com SVG. */
export function BarChart({ data, height = 190 }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const maxValue = Math.max(0, ...data.map((d) => Math.max(d.income, d.expense)));
  const { max, ticks } = chartScale(maxValue);
  const plotH = height - BOTTOM - TOP;
  const plotW = Math.max(0, width - AXIS_W);
  const groupW = data.length ? plotW / data.length : 0;
  const y = (value: number) => TOP + plotH - (value / max) * plotH;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {ticks.map((tick) => (
            <Line
              key={tick}
              x1={AXIS_W}
              x2={width}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#FFFFFF"
              strokeOpacity={tick === 0 ? 0.6 : 0.25}
              strokeWidth={1}
            />
          ))}
          {ticks.map((tick) => (
            <SvgText
              key={`l${tick}`}
              x={AXIS_W - 6}
              y={y(tick) + 3}
              fontSize={9}
              fill="#FFFFFF"
              fillOpacity={0.6}
              textAnchor="end"
              fontFamily="Inter_500Medium">
              {formatAxis(tick)}
            </SvgText>
          ))}
          {data.map((d, i) => {
            const cx = AXIS_W + groupW * i + groupW / 2;
            const incH = Math.max(d.income > 0 ? 2 : 0, (d.income / max) * plotH);
            const expH = Math.max(d.expense > 0 ? 2 : 0, (d.expense / max) * plotH);
            return (
              <G key={d.label}>
                <Rect x={cx - BAR_W - 1} y={y(0) - expH} width={BAR_W} height={expH} rx={4} fill={chartColors.expense} />
                <Rect x={cx + 1} y={y(0) - incH} width={BAR_W} height={incH} rx={4} fill={chartColors.income} />
                <SvgText
                  x={cx}
                  y={height - 8}
                  fontSize={11}
                  fill="#FFFFFF"
                  fillOpacity={0.7}
                  textAnchor="middle"
                  fontFamily="Inter_500Medium">
                  {d.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}
