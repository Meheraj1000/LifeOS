"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { expenseColors, expenseLabels } from "@/lib/labels";

export function MoneyCharts({
  spent,
  earned,
  slices,
}: {
  spent: number;
  earned: number;
  slices: { category: string; amount: number }[];
}) {
  const bars = [
    { name: "আয়", amount: earned },
    { name: "খরচ", amount: spent },
  ];
  const pie = slices.filter((slice) => slice.amount > 0);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars}>
            <XAxis dataKey="name" stroke="#b7cdc4" fontSize={12} />
            <YAxis stroke="#b7cdc4" fontSize={12} />
            <Tooltip formatter={(value) => [`৳ ${Number(value).toLocaleString("bn-BD")}`, "পরিমাণ"]} />
            <Bar dataKey="amount" radius={8}>
              {bars.map((bar) => <Cell key={bar.name} fill={bar.name === "আয়" ? "#7dcea8" : "#e0b45a"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pie} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={80}>
              {pie.map((slice) => <Cell key={slice.category} fill={expenseColors[slice.category as keyof typeof expenseColors] ?? "#9aa89f"} />)}
            </Pie>
            <Tooltip formatter={(value, _name, item) => [`৳ ${Number(value).toLocaleString("bn-BD")}`, expenseLabels[(item?.payload as { category?: string })?.category as keyof typeof expenseLabels] ?? "খাত"]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
