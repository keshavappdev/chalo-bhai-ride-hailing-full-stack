import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, Header, money } from '../components/UI';
import { api } from '../lib/api';

export default function Reports() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/admin/reports?days=30').then((response) => {
      setData(response.data.daily.map((item) => ({ ...item, date: item._id })));
    });
  }, []);

  return (
    <>
      <Header title="Reports & Statistics" sub="Last 30 days" />
      <Card>
        <div style={{ height: 420 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value, name) => (name === 'fare' ? money(value) : value)} />
              <Legend />
              <Line dataKey="total" />
              <Line dataKey="completed" />
              <Line dataKey="cancelled" />
              <Line dataKey="fare" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
