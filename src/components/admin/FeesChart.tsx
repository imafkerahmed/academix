"use client";
import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function FeesChart() {
  // Example data
  const data = [
    { name: "Paid", value: 54000, color: "#16a34a" },
    { name: "Pending", value: 6000, color: "#eab308" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fees Collection</CardTitle>
        <CardDescription>Paid vs Pending Fees</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] w-full flex items-center justify-center">
          <ChartContainer
            config={Object.fromEntries(
              data.map((d) => [d.name, { color: d.color }]),
            )}
          >
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
