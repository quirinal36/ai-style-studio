import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useStyleStore from '../../stores/useStyleStore';

export default function LossChart() {
  const lossHistory = useStyleStore((s) => s.lossHistory);

  if (lossHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Loss 변화 그래프</h3>
        <p className="text-sm text-gray-400 text-center py-8">
          스타일 변환을 실행하면 Loss 변화가 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Loss 변화 그래프</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lossHistory}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="step" label={{ value: 'Step', position: 'bottom' }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="contentLoss" stroke="#3b82f6" name="Content Loss" dot={false} />
          <Line type="monotone" dataKey="styleLoss" stroke="#8b5cf6" name="Style Loss" dot={false} />
          <Line type="monotone" dataKey="totalLoss" stroke="#6b7280" name="Total Loss" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
